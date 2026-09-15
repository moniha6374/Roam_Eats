"""
Multi-Agent AI System for Station-Based Food Truck Ecosystem
Agents: Customer Discovery, Demand Prediction, Route Optimization, Order Management, Business Advisor
"""
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from models import FoodTruck, Station, Route, Order, MenuItem, DemandPrediction, OrderItem
from datetime import datetime


# ─────────────────────────────────────────────
# STATION DEMAND SCORE (SDS) ALGORITHM
# SDS = 0.30*HistoricalDemand + 0.25*CurrentPreorders + 0.15*TimeDemand +
#       0.15*StationPopularity + 0.10*RouteAccessibility + 0.05*FoodCategoryTrend
# ─────────────────────────────────────────────

def calculate_sds(
    historical_demand: float,      # 0-100
    current_preorders: float,      # 0-100 (normalized count)
    time_based_demand: float,      # 0-100 (peak hour boost)
    station_popularity: float,     # 0-100
    route_accessibility: float,    # 0-100
    food_category_trend: float     # 0-100
) -> float:
    score = (
        0.30 * historical_demand +
        0.25 * current_preorders +
        0.15 * time_based_demand +
        0.15 * station_popularity +
        0.10 * route_accessibility +
        0.05 * food_category_trend
    )
    return round(min(max(score, 0), 100), 1)


def get_demand_level(sds: float) -> str:
    if sds >= 75:
        return "HIGH"
    elif sds >= 50:
        return "MEDIUM"
    return "LOW"


def get_time_demand_factor(hour: int) -> float:
    """Time-of-day demand multiplier."""
    if 12 <= hour <= 14:   # Lunch peak
        return 90.0
    elif 8 <= hour <= 10:  # Breakfast
        return 70.0
    elif 17 <= hour <= 19: # Evening snack
        return 75.0
    elif 10 <= hour <= 12:
        return 60.0
    return 40.0


# ─────────────────────────────────────────────
# AGENT 1: CUSTOMER DISCOVERY AGENT
# ─────────────────────────────────────────────

def customer_discovery_agent(
    db: Session,
    preference: str = "",
    time_preference: str = "",
    station_preference: Optional[int] = None
) -> Dict[str, Any]:
    """Recommends trucks, stations and timing based on customer preferences."""
    
    preference_lower = preference.lower()
    is_vegetarian_query = any(w in preference_lower for w in ["veg", "vegetarian", "pure veg"])
    food_keywords = [w for w in ["biryani", "burger", "wrap", "dosa", "rice", "snack", "south indian"] if w in preference_lower]
    
    trucks = db.query(FoodTruck).filter(FoodTruck.is_active == True).all()
    recommendations = []
    
    for truck in trucks:
        score = 50  # base
        reasons = []
        
        # Food match
        if is_vegetarian_query:
            veg_items = [m for m in truck.menu_items if m.is_vegetarian and m.is_available]
            if veg_items:
                score += 20
                reasons.append(f"{len(veg_items)} vegetarian options available")
        
        if food_keywords:
            matching = [m for m in truck.menu_items if any(kw in m.name.lower() for kw in food_keywords) and m.is_available]
            if matching:
                score += 15
                reasons.append(f"Serves {matching[0].name}")
        
        # Rating boost
        score += (truck.rating - 4.0) * 10
        
        # Get current/next route
        today = datetime.now().strftime("%Y-%m-%d")
        current_route = db.query(Route).filter(
            Route.truck_id == truck.id,
            Route.date == today,
            Route.status.in_(["current", "planned"])
        ).order_by(Route.sequence).first()
        
        if current_route:
            station = current_route.station
            # Station popularity boost
            score += station.popularity_score * 0.1
            
            # Time match
            if time_preference:
                try:
                    pref_hour = int(time_preference.split(":")[0]) if ":" in time_preference else int(time_preference.split(" ")[0].replace("pm","").replace("am",""))
                    route_hour = int(current_route.arrival_time.split(":")[0])
                    diff = abs(pref_hour - route_hour)
                    if diff == 0:
                        score += 20
                        reasons.append("Perfect time match")
                    elif diff == 1:
                        score += 10
                        reasons.append("Close time match")
                except:
                    pass
            
            # Demand boost
            preorder_count = db.query(Order).filter(
                Order.truck_id == truck.id,
                Order.station_id == station.id,
                Order.status.in_(["PREORDERED", "PREPARING"])
            ).count()
            
            score = min(score, 100)
            reasons.insert(0, f"Arriving at {station.name} at {current_route.arrival_time}")
            
            recommendations.append({
                "truck_id": truck.id,
                "truck_name": truck.name,
                "cuisine_type": truck.cuisine_type,
                "image_url": truck.image_url,
                "rating": truck.rating,
                "recommendation_score": round(score, 1),
                "recommended_station": station.name,
                "recommended_station_id": station.id,
                "arrival_time": current_route.arrival_time,
                "reasons": reasons,
                "preorders_at_station": preorder_count,
                "waiting_time_min": max(5, preorder_count * 3),
                "vegetarian_options": len([m for m in truck.menu_items if m.is_vegetarian and m.is_available]),
            })
    
    recommendations.sort(key=lambda x: x["recommendation_score"], reverse=True)
    
    top = recommendations[0] if recommendations else None
    agent_message = ""
    if top:
        agent_message = (
            f"🤖 Customer Discovery Agent: Based on your preferences, I recommend **{top['truck_name']}** "
            f"arriving at **{top['recommended_station']}** at **{top['arrival_time']}**. "
            f"Reason: {', '.join(top['reasons'][:2])}. "
            f"Estimated waiting time: {top['waiting_time_min']} minutes."
        )
    
    return {
        "agent": "Customer Discovery Agent",
        "status": "COMPLETED",
        "recommendations": recommendations[:5],
        "top_recommendation": top,
        "agent_message": agent_message,
        "reasoning": [
            "Analyzed customer food preference and time",
            "Matched against active truck menus",
            "Applied station popularity weighting",
            "Computed recommendation score",
            "Ranked results by score"
        ]
    }


# ─────────────────────────────────────────────
# AGENT 2: DEMAND PREDICTION AGENT
# ─────────────────────────────────────────────

def demand_prediction_agent(db: Session, truck_id: int) -> Dict[str, Any]:
    """Calculates SDS scores for all stations on a truck's route."""
    
    today = datetime.now().strftime("%Y-%m-%d")
    current_hour = datetime.now().hour
    routes = db.query(Route).filter(
        Route.truck_id == truck_id,
        Route.date == today
    ).order_by(Route.sequence).all()
    
    station_scores = []
    
    for route in routes:
        station = route.station
        if not station:
            continue
        
        # Historical demand (from DemandPrediction table or station popularity)
        hist = db.query(DemandPrediction).filter(
            DemandPrediction.station_id == station.id,
            DemandPrediction.truck_id == truck_id
        ).first()
        historical_demand = hist.historical_demand if hist else station.popularity_score
        
        # Current preorders
        preorder_count = db.query(Order).filter(
            Order.truck_id == truck_id,
            Order.station_id == station.id,
            Order.status.in_(["PREORDERED", "PREPARING"])
        ).count()
        preorder_score = min(preorder_count * 12, 100)
        
        # Time-based demand
        try:
            route_hour = int(route.arrival_time.split(":")[0])
        except:
            route_hour = current_hour
        time_demand = get_time_demand_factor(route_hour)
        
        # Route accessibility (earlier in sequence = more accessible)
        accessibility = max(100 - (route.sequence - 1) * 15, 40)
        
        # Food category trend (biryani/lunch items peak at noon)
        food_trend = 80 if 12 <= route_hour <= 14 else 55
        
        sds = calculate_sds(
            historical_demand=historical_demand,
            current_preorders=preorder_score,
            time_based_demand=time_demand,
            station_popularity=station.popularity_score,
            route_accessibility=accessibility,
            food_category_trend=food_trend
        )
        
        demand_level = get_demand_level(sds)
        
        # Preparation recommendation
        base_prep = max(10, int(sds / 5))
        prep_note = f"Prepare {base_prep} meals. " 
        if demand_level == "HIGH":
            prep_note += f"Increase biryani/main course by 25%."
        elif demand_level == "MEDIUM":
            prep_note += "Maintain standard stock."
        else:
            prep_note += "Light stock sufficient."
        
        station_scores.append({
            "station_id": station.id,
            "station_name": station.name,
            "arrival_time": route.arrival_time,
            "departure_time": route.departure_time,
            "sequence": route.sequence,
            "status": route.status,
            "sds_score": sds,
            "demand_level": demand_level,
            "preorder_count": preorder_count,
            "historical_demand": round(historical_demand, 1),
            "time_demand": round(time_demand, 1),
            "station_popularity": station.popularity_score,
            "breakdown": {
                "historical_demand": {"score": historical_demand, "weight": "30%", "contribution": round(0.30 * historical_demand, 1)},
                "current_preorders": {"score": preorder_score, "weight": "25%", "contribution": round(0.25 * preorder_score, 1)},
                "time_based_demand": {"score": time_demand, "weight": "15%", "contribution": round(0.15 * time_demand, 1)},
                "station_popularity": {"score": station.popularity_score, "weight": "15%", "contribution": round(0.15 * station.popularity_score, 1)},
                "route_accessibility": {"score": accessibility, "weight": "10%", "contribution": round(0.10 * accessibility, 1)},
                "food_category_trend": {"score": food_trend, "weight": "5%", "contribution": round(0.05 * food_trend, 1)},
            },
            "preparation_recommendation": prep_note,
            "expected_peak": f"{route_hour}:00 - {route_hour+1}:00"
        })
    
    station_scores.sort(key=lambda x: x["sds_score"], reverse=True)
    top_station = station_scores[0] if station_scores else None
    
    agent_message = ""
    if top_station:
        agent_message = (
            f"🤖 Demand Prediction Agent: **{top_station['station_name']}** has the highest demand score "
            f"({top_station['sds_score']}/100 — {top_station['demand_level']} DEMAND). "
            f"Expected peak: {top_station['expected_peak']}. "
            f"{top_station['preparation_recommendation']}"
        )
    
    return {
        "agent": "Demand Prediction Agent",
        "status": "COMPLETED",
        "station_scores": station_scores,
        "top_station": top_station,
        "agent_message": agent_message,
        "reasoning": [
            "Loaded historical order data per station",
            "Counted current active preorders",
            "Applied time-of-day demand factor",
            "Weighted station popularity",
            "Evaluated route sequence accessibility",
            "Applied food category trend multiplier",
            "Computed SDS = Σ(weight × factor)"
        ]
    }


# ─────────────────────────────────────────────
# AGENT 3: ROUTE OPTIMIZATION AGENT
# ─────────────────────────────────────────────

def route_optimization_agent(db: Session, truck_id: int) -> Dict[str, Any]:
    """Suggests optimal station ordering based on demand and distance."""
    
    demand_data = demand_prediction_agent(db, truck_id)
    station_scores = demand_data["station_scores"]
    
    if not station_scores:
        return {"agent": "Route Optimization Agent", "status": "NO_DATA", "recommendations": []}
    
    # Weighted Route Score = SDS / (distance_factor)
    # We simulate distance using sequence order
    optimized = []
    for i, s in enumerate(station_scores):
        distance_factor = max(1, s["sequence"])
        weighted_score = round(s["sds_score"] / distance_factor, 2)
        optimized.append({
            **s,
            "weighted_route_score": weighted_score,
            "recommended_priority": i + 1
        })
    
    optimized.sort(key=lambda x: x["weighted_route_score"], reverse=True)
    best = optimized[0]
    
    current_planned = sorted(station_scores, key=lambda x: x["sequence"])
    current_route_names = [s["station_name"] for s in current_planned]
    optimal_route_names = [s["station_name"] for s in optimized]
    
    needs_reorder = current_route_names != optimal_route_names
    
    agent_message = (
        f"🤖 Route Optimization Agent: Optimal next stop is **{best['station_name']}** "
        f"(Weighted Score: {best['weighted_route_score']}). "
        f"Recommended arrival: {best['arrival_time']}. "
        f"{'Route reordering recommended for maximum revenue.' if needs_reorder else 'Current route order is efficient.'}"
    )
    
    return {
        "agent": "Route Optimization Agent",
        "status": "COMPLETED",
        "current_route": current_planned,
        "optimized_route": optimized,
        "best_next_station": best,
        "needs_reorder": needs_reorder,
        "agent_message": agent_message,
        "reasoning": [
            "Retrieved Station Demand Scores for all route stops",
            "Applied Weighted Route Score = SDS / Distance Factor",
            "Ranked stations by opportunity score",
            "Compared to current planned sequence",
            "Generated reorder recommendation if beneficial"
        ]
    }


# ─────────────────────────────────────────────
# AGENT 4: ORDER MANAGEMENT AGENT
# ─────────────────────────────────────────────

def order_management_agent(db: Session, truck_id: int) -> Dict[str, Any]:
    """Monitors orders, detects spikes, prioritizes prep."""
    
    active_orders = db.query(Order).filter(
        Order.truck_id == truck_id,
        Order.status.in_(["PREORDERED", "PREPARING"])
    ).all()
    
    station_order_counts = {}
    for order in active_orders:
        sid = order.station_id
        station_order_counts[sid] = station_order_counts.get(sid, 0) + 1
    
    # Item demand analysis
    item_demand = {}
    for order in active_orders:
        for item in order.items:
            name = item.menu_item.name if item.menu_item else "Unknown"
            item_demand[name] = item_demand.get(name, 0) + item.quantity
    
    alerts = []
    total_active = len(active_orders)
    
    if total_active >= 8:
        alerts.append({
            "type": "HIGH_DEMAND",
            "icon": "🔥",
            "message": f"{total_active} active orders detected. High preparation load!",
            "action": f"Prepare {total_active + 5} additional meals in advance.",
            "severity": "HIGH"
        })
    
    for sid, count in station_order_counts.items():
        station = db.query(Station).get(sid)
        if station and count >= 4:
            alerts.append({
                "type": "STATION_SPIKE",
                "icon": "📍",
                "message": f"{count} orders queued for {station.name}.",
                "action": f"Prioritize preparation for {station.name} stop.",
                "severity": "MEDIUM"
            })
    
    top_item = max(item_demand.items(), key=lambda x: x[1]) if item_demand else None
    if top_item:
        alerts.append({
            "type": "ITEM_DEMAND",
            "icon": "🍛",
            "message": f"{top_item[0]} is the most ordered item ({top_item[1]} portions).",
            "action": f"Prepare {top_item[1] + 8} additional portions of {top_item[0]}.",
            "severity": "INFO"
        })
    
    agent_message = (
        f"🤖 Order Management Agent: {total_active} active orders. "
        f"{'⚠️ High load detected!' if total_active >= 8 else 'Load manageable.'} "
        f"Top item: {top_item[0] if top_item else 'N/A'} ({top_item[1] if top_item else 0} portions)."
    )
    
    return {
        "agent": "Order Management Agent",
        "status": "COMPLETED",
        "total_active_orders": total_active,
        "station_order_counts": station_order_counts,
        "item_demand": item_demand,
        "alerts": alerts,
        "agent_message": agent_message,
        "reasoning": [
            "Queried all active (PREORDERED/PREPARING) orders",
            "Grouped orders by station",
            "Analyzed item-level demand",
            "Detected demand spikes above threshold",
            "Generated prioritized alerts"
        ]
    }


# ─────────────────────────────────────────────
# AGENT 5: BUSINESS ADVISOR AGENT
# ─────────────────────────────────────────────

def business_advisor_agent(db: Session, truck_id: int) -> Dict[str, Any]:
    """Generates strategic business recommendations."""
    
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Revenue today
    completed_orders = db.query(Order).filter(
        Order.truck_id == truck_id,
        Order.status.in_(["COMPLETED", "READY"])
    ).all()
    
    active_orders = db.query(Order).filter(
        Order.truck_id == truck_id,
        Order.status.in_(["PREORDERED", "PREPARING", "ON_ROUTE", "ARRIVING"])
    ).all()
    
    total_revenue = sum(o.total_amount for o in completed_orders)
    projected_revenue = total_revenue + sum(o.total_amount for o in active_orders)
    
    demand_data = demand_prediction_agent(db, truck_id)
    station_scores = demand_data["station_scores"]
    
    recommendations = []
    
    # Find highest demand station not yet visited
    planned_stations = [s for s in station_scores if s["status"] in ["planned", "current"]]
    if planned_stations:
        best = max(planned_stations, key=lambda x: x["sds_score"])
        if best["demand_level"] == "HIGH":
            recommendations.append({
                "type": "TIMING",
                "icon": "⏰",
                "title": "Timing Optimization",
                "insight": f"Arrive at {best['station_name']} 15 minutes earlier tomorrow.",
                "detail": f"Demand is consistently high between {best['expected_peak']}.",
                "impact": f"+18% revenue opportunity",
                "action": f"Adjust arrival to {best['arrival_time'].split(':')[0]}:{int(best['arrival_time'].split(':')[1])-15:02d} AM"
            })
    
    # Menu recommendation
    item_demand = {}
    all_orders = db.query(Order).filter(Order.truck_id == truck_id).all()
    for order in all_orders:
        for item in order.items:
            name = item.menu_item.name if item.menu_item else "Unknown"
            item_demand[name] = item_demand.get(name, 0) + item.quantity
    
    if item_demand:
        top_item = max(item_demand.items(), key=lambda x: x[1])
        recommendations.append({
            "type": "MENU",
            "icon": "🍽️",
            "title": "Menu Popularity Insight",
            "insight": f"**{top_item[0]}** is your best-seller ({top_item[1]} orders).",
            "detail": "Consider offering a combo deal to increase average order value.",
            "impact": "+₹200–400 avg order value",
            "action": f"Create '{top_item[0]} Combo' with beverage at ₹30 discount"
        })
    
    # Station coverage recommendation
    if len(planned_stations) > 0:
        low_stations = [s for s in planned_stations if s["demand_level"] == "LOW"]
        if low_stations:
            recommendations.append({
                "type": "ROUTE",
                "icon": "🚚",
                "title": "Route Efficiency Alert",
                "insight": f"{low_stations[0]['station_name']} shows low demand (SDS: {low_stations[0]['sds_score']}).",
                "detail": "Consider swapping this stop for a higher-demand alternative.",
                "impact": "Avoid low-revenue stop",
                "action": f"Replace {low_stations[0]['station_name']} with a high-demand area"
            })
    
    recommendations.append({
        "type": "REVENUE",
        "icon": "📈",
        "title": "Revenue Projection",
        "insight": f"Today's projected revenue: ₹{projected_revenue:.0f}",
        "detail": f"Completed: ₹{total_revenue:.0f} | Active orders: ₹{projected_revenue - total_revenue:.0f} pending",
        "impact": f"{'On track' if projected_revenue > 2000 else 'Below target'}",
        "action": "Promote top items at next station to boost average order value"
    })
    
    agent_message = (
        f"🤖 Business Advisor: Today's projected revenue is ₹{projected_revenue:.0f}. "
        f"Top recommendation: {recommendations[0]['insight'] if recommendations else 'Keep up the good work!'}"
    )
    
    return {
        "agent": "Business Advisor Agent",
        "status": "COMPLETED",
        "total_revenue": total_revenue,
        "projected_revenue": projected_revenue,
        "total_orders_today": len(completed_orders) + len(active_orders),
        "recommendations": recommendations,
        "agent_message": agent_message,
        "reasoning": [
            "Aggregated completed and active order revenue",
            "Analyzed station demand scores",
            "Ranked menu items by order frequency",
            "Identified low-performing route stops",
            "Generated actionable business recommendations"
        ]
    }


# ─────────────────────────────────────────────
# WHAT-IF SIMULATION
# ─────────────────────────────────────────────

def what_if_simulation(db: Session, truck_id: int, station_id: int) -> Dict[str, Any]:
    """Simulates revenue impact of moving to a specific station."""
    
    station = db.query(Station).get(station_id)
    if not station:
        return {"error": "Station not found"}
    
    truck = db.query(FoodTruck).get(truck_id)
    
    # Current revenue
    current_orders = db.query(Order).filter(
        Order.truck_id == truck_id,
        Order.status.in_(["PREORDERED", "PREPARING", "COMPLETED"])
    ).all()
    current_revenue = sum(o.total_amount for o in current_orders)
    
    # Calculate SDS for target station
    current_hour = datetime.now().hour
    hist = db.query(DemandPrediction).filter(
        DemandPrediction.station_id == station_id
    ).first()
    historical_demand = hist.historical_demand if hist else station.popularity_score
    
    preorder_count = db.query(Order).filter(
        Order.station_id == station_id,
        Order.status.in_(["PREORDERED", "PREPARING"])
    ).count()
    
    time_demand = get_time_demand_factor(current_hour + 1)
    sds = calculate_sds(
        historical_demand=historical_demand,
        current_preorders=min(preorder_count * 12, 100),
        time_based_demand=time_demand,
        station_popularity=station.popularity_score,
        route_accessibility=70,
        food_category_trend=75
    )
    
    demand_level = get_demand_level(sds)
    
    # Estimate predicted revenue
    avg_order_value = 160
    predicted_orders = int(sds / 3.5)
    predicted_revenue = current_revenue + (predicted_orders * avg_order_value)
    opportunity = ((predicted_revenue - current_revenue) / max(current_revenue, 1)) * 100
    
    return {
        "station_id": station_id,
        "station_name": station.name,
        "sds_score": sds,
        "demand_level": demand_level,
        "current_revenue": round(current_revenue, 2),
        "predicted_revenue": round(predicted_revenue, 2),
        "opportunity_percent": round(opportunity, 1),
        "predicted_new_orders": predicted_orders,
        "recommendation": (
            f"Moving to {station.name} is {'HIGHLY RECOMMENDED' if demand_level == 'HIGH' else 'OPTIONAL'}. "
            f"Expected {predicted_orders} additional orders. "
            f"Revenue opportunity: +{opportunity:.0f}%."
        ),
        "agent_message": (
            f"🤖 What-If Analysis: Moving to **{station.name}** could generate "
            f"₹{predicted_revenue:.0f} total revenue (currently ₹{current_revenue:.0f}). "
            f"Opportunity: +{opportunity:.0f}%. SDS Score: {sds}/100."
        )
    }


# ─────────────────────────────────────────────
# AI CHAT ASSISTANT (Deterministic)
# ─────────────────────────────────────────────

def ai_chat_response(db: Session, truck_id: int, message: str) -> Dict[str, Any]:
    """Deterministic AI chat assistant for owner queries."""
    
    msg = message.lower()
    
    demand_data = demand_prediction_agent(db, truck_id)
    order_data = order_management_agent(db, truck_id)
    business_data = business_advisor_agent(db, truck_id)
    
    top_station = demand_data.get("top_station")
    
    if any(w in msg for w in ["station", "prioritize", "which station", "best station"]):
        if top_station:
            response = (
                f"**{top_station['station_name']}** should be your top priority! "
                f"SDS Score: {top_station['sds_score']}/100 ({top_station['demand_level']} DEMAND). "
                f"Expected peak: {top_station['expected_peak']}. "
                f"There are currently {top_station['preorder_count']} preorders waiting there."
            )
        else:
            response = "No active stations found. Check your route plan."
    
    elif any(w in msg for w in ["biryani", "which food", "highest demand", "popular item", "best item"]):
        item_demand = order_data.get("item_demand", {})
        if item_demand:
            top = max(item_demand.items(), key=lambda x: x[1])
            response = (
                f"**{top[0]}** has the highest demand with {top[1]} portions ordered. "
                f"Make sure to stock up! Consider preparing {top[1] + 10} portions for the next stop."
            )
        else:
            response = "Chicken Biryani and Paneer Wrap are consistently popular items based on historical data."
    
    elif any(w in msg for w in ["how many", "prepare", "quantity", "stock"]):
        if top_station:
            prep = int(top_station['sds_score'] / 5)
            response = (
                f"For {top_station['station_name']} (SDS: {top_station['sds_score']}), "
                f"prepare approximately **{prep} meals**. "
                f"{top_station['preparation_recommendation']}"
            )
        else:
            response = "Based on current data, prepare 15–20 meals per station during peak hours."
    
    elif any(w in msg for w in ["why station 2", "why", "explain", "reason"]):
        if top_station:
            b = top_station.get("breakdown", {})
            response = (
                f"**{top_station['station_name']}** is recommended because:\n"
                f"• Historical Demand: {b.get('historical_demand', {}).get('score', 0)}/100 (contributes {b.get('historical_demand', {}).get('contribution', 0)} pts)\n"
                f"• Current Preorders: {top_station['preorder_count']} active (contributes {b.get('current_preorders', {}).get('contribution', 0)} pts)\n"
                f"• Time Demand: Peak hour boost ({b.get('time_based_demand', {}).get('score', 0)}/100)\n"
                f"• Station Popularity: {top_station['station_popularity']}/100\n"
                f"Combined SDS Score: **{top_station['sds_score']}/100**"
            )
        else:
            response = "Unable to retrieve station data. Please check your route."
    
    elif any(w in msg for w in ["revenue", "business", "today", "earnings", "sales"]):
        response = (
            f"Today's business summary:\n"
            f"• Total Orders: {business_data['total_orders_today']}\n"
            f"• Revenue Earned: ₹{business_data['total_revenue']:.0f}\n"
            f"• Projected Total: ₹{business_data['projected_revenue']:.0f}\n"
            f"• Top Recommendation: {business_data['recommendations'][0]['insight'] if business_data['recommendations'] else 'Keep serving!'}"
        )
    
    elif any(w in msg for w in ["route", "next stop", "move", "where"]):
        route_data = route_optimization_agent(db, truck_id)
        best = route_data.get("best_next_station")
        if best:
            response = (
                f"Recommended next stop: **{best['station_name']}** "
                f"(Weighted Score: {best['weighted_route_score']}). "
                f"Arrive by {best['arrival_time']} for peak demand window. "
                f"{'Route reordering is suggested for +15% efficiency.' if route_data.get('needs_reorder') else 'Your current route is optimal.'}"
            )
        else:
            response = "No further route stops planned for today."
    
    else:
        alerts = order_data.get("alerts", [])
        response = (
            f"Here's your current status:\n"
            f"• Active orders: {order_data['total_active_orders']}\n"
            f"• Top station: {top_station['station_name'] if top_station else 'N/A'} "
            f"(SDS: {top_station['sds_score'] if top_station else 'N/A'})\n"
            f"• Revenue today: ₹{business_data['total_revenue']:.0f}\n"
            f"• Alerts: {len(alerts)} active alerts\n\n"
            f"Ask me about: station priority, food preparation, revenue insights, or route optimization!"
        )
    
    return {
        "response": response,
        "agent": "AI Assistant",
        "timestamp": datetime.now().strftime("%H:%M")
    }
