from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

from database import get_db, create_tables
from models import User, FoodTruck, MenuItem, Station, Route, Order, OrderItem, DemandPrediction, TruckHoliday
from ai_agents import (
    customer_discovery_agent, demand_prediction_agent,
    route_optimization_agent, order_management_agent,
    business_advisor_agent, what_if_simulation, ai_chat_response
)
from seed import seed

app = FastAPI(title="FoodTrack AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    create_tables()
    seed()


# ─── AUTH ───────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    role: str = "customer"  # "customer" or "owner"

@app.post("/auth/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user or user.password != req.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "token": f"demo-token-{user.id}"
    }

@app.post("/auth/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if req.role not in ("customer", "owner"):
        raise HTTPException(status_code=400, detail="Role must be 'customer' or 'owner'")
    
    user = User(
        name=req.name,
        email=req.email,
        password=req.password,   # plain text — demo app, no hashing needed
        role=req.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # If owner registered, auto-create a placeholder truck for them
    if user.role == "owner":
        today = datetime.now().strftime("%Y-%m-%d")
        truck = FoodTruck(
            name=f"{user.name}'s Truck",
            owner_id=user.id,
            cuisine_type="Multi-Cuisine",
            description="My food truck",
            image_url="🚚",
            is_active=True,
            rating=4.0
        )
        db.add(truck)
        db.commit()

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "token": f"demo-token-{user.id}"
    }

@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()


# ─── TRUCKS ─────────────────────────────────
@app.get("/trucks")
def get_trucks(db: Session = Depends(get_db)):
    trucks = db.query(FoodTruck).options(
        joinedload(FoodTruck.menu_items),
        joinedload(FoodTruck.routes).joinedload(Route.station)
    ).all()
    result = []
    for t in trucks:
        today = datetime.now().strftime("%Y-%m-%d")
        current_route = next((r for r in t.routes if r.date == today and r.status == "current"), None)
        next_route = next((r for r in sorted(t.routes, key=lambda x: x.sequence) if r.date == today and r.status == "planned"), None)
        result.append({
            "id": t.id,
            "name": t.name,
            "owner_id": t.owner_id,
            "cuisine_type": t.cuisine_type,
            "description": t.description,
            "image_url": t.image_url,
            "rating": t.rating,
            "is_active": t.is_active,
            "current_station_id": t.current_station_id,
            "current_station": current_route.station.name if current_route and current_route.station else None,
            "current_arrival": current_route.arrival_time if current_route else None,
            "next_station": next_route.station.name if next_route and next_route.station else None,
            "next_arrival": next_route.arrival_time if next_route else None,
            "menu_count": len(t.menu_items),
            "veg_count": len([m for m in t.menu_items if m.is_vegetarian]),
        })
    return result

@app.get("/trucks/{truck_id}")
def get_truck(truck_id: int, db: Session = Depends(get_db)):
    t = db.query(FoodTruck).options(
        joinedload(FoodTruck.menu_items),
        joinedload(FoodTruck.routes).joinedload(Route.station)
    ).filter(FoodTruck.id == truck_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Truck not found")
    
    today = datetime.now().strftime("%Y-%m-%d")
    routes_today = sorted([r for r in t.routes if r.date == today], key=lambda x: x.sequence)
    
    return {
        "id": t.id,
        "name": t.name,
        "cuisine_type": t.cuisine_type,
        "description": t.description,
        "image_url": t.image_url,
        "rating": t.rating,
        "is_active": t.is_active,
        "menu_items": [
            {"id": m.id, "name": m.name, "price": m.price, "category": m.category,
             "is_available": m.is_available, "is_vegetarian": m.is_vegetarian,
             "image_emoji": m.image_emoji, "description": m.description}
            for m in t.menu_items
        ],
        "routes_today": [
            {"id": r.id, "station_id": r.station_id, "station_name": r.station.name if r.station else None,
             "arrival_time": r.arrival_time, "departure_time": r.departure_time,
             "sequence": r.sequence, "status": r.status}
            for r in routes_today
        ]
    }


# ─── STATIONS ───────────────────────────────
@app.get("/stations")
def get_stations(db: Session = Depends(get_db)):
    return db.query(Station).all()

@app.post("/stations")
def create_station(data: dict, db: Session = Depends(get_db)):
    s = Station(**data)
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


# ─── ROUTES ─────────────────────────────────
@app.get("/routes")
def get_routes(truck_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Route).options(joinedload(Route.station), joinedload(Route.truck))
    if truck_id:
        query = query.filter(Route.truck_id == truck_id)
    today = datetime.now().strftime("%Y-%m-%d")
    routes = query.filter(Route.date == today).order_by(Route.sequence).all()
    return [
        {
            "id": r.id,
            "truck_id": r.truck_id,
            "truck_name": r.truck.name if r.truck else None,
            "station_id": r.station_id,
            "station_name": r.station.name if r.station else None,
            "arrival_time": r.arrival_time,
            "departure_time": r.departure_time,
            "sequence": r.sequence,
            "status": r.status,
            "date": r.date
        }
        for r in routes
    ]

@app.post("/routes")
def add_route(data: dict, db: Session = Depends(get_db)):
    r = Route(**data)
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

@app.patch("/routes/{route_id}")
def update_route(route_id: int, data: dict, db: Session = Depends(get_db)):
    r = db.query(Route).filter(Route.id == route_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Route not found")
    for k, v in data.items():
        setattr(r, k, v)
    db.commit()
    db.refresh(r)
    return r


# ─── MENU ────────────────────────────────────
@app.get("/menu/{truck_id}")
def get_menu(truck_id: int, db: Session = Depends(get_db)):
    return db.query(MenuItem).filter(MenuItem.truck_id == truck_id).all()

@app.post("/menu")
def add_menu_item(data: dict, db: Session = Depends(get_db)):
    m = MenuItem(**data)
    db.add(m)
    db.commit()
    db.refresh(m)
    return m

@app.patch("/menu/{item_id}")
def update_menu_item(item_id: int, data: dict, db: Session = Depends(get_db)):
    m = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Item not found")
    for k, v in data.items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return m

@app.delete("/menu/{item_id}")
def delete_menu_item(item_id: int, db: Session = Depends(get_db)):
    m = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(m)
    db.commit()
    return {"message": "Deleted"}


# ─── ORDERS ─────────────────────────────────
class OrderCreate(BaseModel):
    customer_id: int
    truck_id: int
    station_id: int
    pickup_time: Optional[str] = None
    notes: Optional[str] = None
    items: List[dict]

@app.post("/orders")
def create_order(req: OrderCreate, db: Session = Depends(get_db)):
    total = 0
    order = Order(
        customer_id=req.customer_id,
        truck_id=req.truck_id,
        station_id=req.station_id,
        status="PREORDERED",
        pickup_time=req.pickup_time,
        notes=req.notes,
        created_at=datetime.utcnow()
    )
    db.add(order)
    db.flush()
    
    for item in req.items:
        menu_item = db.query(MenuItem).filter(MenuItem.id == item["menu_item_id"]).first()
        if not menu_item:
            continue
        qty = item.get("quantity", 1)
        oi = OrderItem(
            order_id=order.id,
            menu_item_id=menu_item.id,
            quantity=qty,
            price=menu_item.price
        )
        db.add(oi)
        total += menu_item.price * qty
    
    order.total_amount = total
    db.commit()
    db.refresh(order)
    
    # Load station and truck for response
    station = db.query(Station).get(order.station_id)
    truck = db.query(FoodTruck).get(order.truck_id)
    
    return {
        "id": order.id,
        "status": order.status,
        "total_amount": total,
        "truck_name": truck.name if truck else None,
        "station_name": station.name if station else None,
        "pickup_time": order.pickup_time,
        "message": "Order confirmed! Your food is being prepared."
    }

@app.get("/orders")
def get_orders(customer_id: Optional[int] = None, truck_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.menu_item),
        joinedload(Order.customer),
        joinedload(Order.truck),
        joinedload(Order.station)
    )
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    if truck_id:
        query = query.filter(Order.truck_id == truck_id)
    orders = query.order_by(Order.created_at.desc()).all()
    return [_serialize_order(o) for o in orders]

@app.get("/orders/{order_id}")
def get_order(order_id: int, db: Session = Depends(get_db)):
    o = db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.menu_item),
        joinedload(Order.customer), joinedload(Order.truck), joinedload(Order.station)
    ).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    return _serialize_order(o)

@app.patch("/orders/{order_id}/status")
def update_order_status(order_id: int, data: dict, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    o.status = data.get("status", o.status)
    db.commit()
    return {"id": o.id, "status": o.status}

def _serialize_order(o: Order):
    return {
        "id": o.id,
        "customer_id": o.customer_id,
        "customer_name": o.customer.name if o.customer else None,
        "truck_id": o.truck_id,
        "truck_name": o.truck.name if o.truck else None,
        "station_id": o.station_id,
        "station_name": o.station.name if o.station else None,
        "status": o.status,
        "total_amount": o.total_amount,
        "pickup_time": o.pickup_time,
        "created_at": o.created_at.isoformat() if o.created_at else None,
        "items": [
            {
                "id": i.id,
                "menu_item_id": i.menu_item_id,
                "name": i.menu_item.name if i.menu_item else None,
                "quantity": i.quantity,
                "price": i.price,
                "emoji": i.menu_item.image_emoji if i.menu_item else "🍔"
            }
            for i in o.items
        ]
    }


# ─── OWNER DASHBOARD ────────────────────────
@app.get("/owner/dashboard")
def owner_dashboard(truck_id: int, db: Session = Depends(get_db)):
    truck = db.query(FoodTruck).get(truck_id)
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    
    today = datetime.now().strftime("%Y-%m-%d")
    all_orders = db.query(Order).filter(Order.truck_id == truck_id).all()
    active_orders = [o for o in all_orders if o.status in ["PREORDERED", "PREPARING"]]
    completed_orders = [o for o in all_orders if o.status in ["COMPLETED", "READY"]]
    
    total_revenue = sum(o.total_amount for o in completed_orders)
    projected = total_revenue + sum(o.total_amount for o in active_orders)
    
    current_route = db.query(Route).filter(
        Route.truck_id == truck_id, Route.date == today, Route.status == "current"
    ).first()
    next_route = db.query(Route).filter(
        Route.truck_id == truck_id, Route.date == today, Route.status == "planned"
    ).order_by(Route.sequence).first()
    
    demand_data = demand_prediction_agent(db, truck_id)
    order_data = order_management_agent(db, truck_id)
    
    return {
        "truck": {"id": truck.id, "name": truck.name, "cuisine_type": truck.cuisine_type, "image_url": truck.image_url},
        "stats": {
            "total_orders": len(all_orders),
            "active_orders": len(active_orders),
            "completed_orders": len(completed_orders),
            "total_revenue": round(total_revenue, 2),
            "projected_revenue": round(projected, 2),
        },
        "current_station": current_route.station.name if current_route and current_route.station else "In Transit",
        "current_station_id": current_route.station_id if current_route else None,
        "next_station": next_route.station.name if next_route and next_route.station else None,
        "next_arrival": next_route.arrival_time if next_route else None,
        "station_demand": demand_data["station_scores"],
        "top_demand_station": demand_data["top_station"],
        "alerts": order_data["alerts"],
        "active_order_count": order_data["total_active_orders"],
    }


# ─── AI ENDPOINTS ────────────────────────────
@app.get("/ai/demand")
def ai_demand(truck_id: int, db: Session = Depends(get_db)):
    return demand_prediction_agent(db, truck_id)

@app.get("/ai/recommendations")
def ai_recommendations(truck_id: int, db: Session = Depends(get_db)):
    return {
        "demand": demand_prediction_agent(db, truck_id),
        "route": route_optimization_agent(db, truck_id),
        "orders": order_management_agent(db, truck_id),
        "business": business_advisor_agent(db, truck_id),
    }

@app.get("/ai/discover")
def ai_discover(
    preference: str = "",
    time_preference: str = "",
    station_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    return customer_discovery_agent(db, preference, time_preference, station_id)

@app.get("/ai/whatif")
def ai_whatif(truck_id: int, station_id: int, db: Session = Depends(get_db)):
    return what_if_simulation(db, truck_id, station_id)

@app.get("/ai/business")
def ai_business(truck_id: int, db: Session = Depends(get_db)):
    return business_advisor_agent(db, truck_id)

@app.post("/ai/chat")
def ai_chat(data: dict, db: Session = Depends(get_db)):
    truck_id = data.get("truck_id", 1)
    message = data.get("message", "")
    return ai_chat_response(db, truck_id, message)


# ─── SIMULATION ─────────────────────────────
@app.post("/simulation/next-stop")
def simulate_next_stop(data: dict, db: Session = Depends(get_db)):
    truck_id = data.get("truck_id", 1)
    today = datetime.now().strftime("%Y-%m-%d")
    
    # Mark current as completed
    current = db.query(Route).filter(
        Route.truck_id == truck_id, Route.date == today, Route.status == "current"
    ).first()
    if current:
        current.status = "completed"
        db.flush()
    
    # Promote first planned to current
    next_planned = db.query(Route).filter(
        Route.truck_id == truck_id, Route.date == today, Route.status == "planned"
    ).order_by(Route.sequence).first()
    
    if not next_planned:
        db.commit()
        return {"message": "No more stops for today!", "finished": True}
    
    next_planned.status = "current"
    
    # Update truck's current station
    truck = db.query(FoodTruck).get(truck_id)
    if truck:
        truck.current_station_id = next_planned.station_id
    
    # Update orders at this station to ARRIVING
    orders_at_station = db.query(Order).filter(
        Order.truck_id == truck_id,
        Order.station_id == next_planned.station_id,
        Order.status.in_(["PREORDERED", "ON_ROUTE"])
    ).all()
    for o in orders_at_station:
        o.status = "ARRIVING"
    
    db.commit()
    
    station = next_planned.station
    demand_data = demand_prediction_agent(db, truck_id)
    
    return {
        "message": f"Truck moved to {station.name if station else 'next station'}!",
        "finished": False,
        "new_station": {
            "id": next_planned.station_id,
            "name": station.name if station else None,
            "arrival_time": next_planned.arrival_time,
        },
        "orders_updated": len(orders_at_station),
        "demand_update": demand_data.get("top_station"),
        "ai_recommendation": demand_data.get("agent_message"),
    }

@app.get("/health")
def health():
    return {"status": "ok", "time": datetime.now().isoformat()}


# ─── TRUCK LIVE LOCATION ─────────────────────
@app.get("/trucks/{truck_id}/location")
def get_truck_location(truck_id: int, db: Session = Depends(get_db)):
    """Returns current station coords for map tracking."""
    truck = db.query(FoodTruck).get(truck_id)
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    today = datetime.now().strftime("%Y-%m-%d")
    current_route = db.query(Route).filter(
        Route.truck_id == truck_id, Route.date == today, Route.status == "current"
    ).first()
    next_route = db.query(Route).filter(
        Route.truck_id == truck_id, Route.date == today, Route.status == "planned"
    ).order_by(Route.sequence).first()
    
    current_station = current_route.station if current_route else None
    next_station = next_route.station if next_route else None
    
    all_routes = db.query(Route).filter(
        Route.truck_id == truck_id, Route.date == today
    ).order_by(Route.sequence).all()
    
    return {
        "truck_id": truck_id,
        "truck_name": truck.name,
        "image_url": truck.image_url,
        "current_station": {
            "id": current_station.id if current_station else None,
            "name": current_station.name if current_station else "In Transit",
            "lat": current_station.latitude if current_station else 11.0168,
            "lng": current_station.longitude if current_station else 76.9558,
        },
        "next_station": {
            "id": next_station.id if next_station else None,
            "name": next_station.name if next_station else None,
            "lat": next_station.latitude if next_station else None,
            "lng": next_station.longitude if next_station else None,
            "arrival_time": next_route.arrival_time if next_route else None,
        } if next_station else None,
        "full_route": [
            {
                "station_name": r.station.name if r.station else None,
                "lat": r.station.latitude if r.station else None,
                "lng": r.station.longitude if r.station else None,
                "arrival_time": r.arrival_time,
                "status": r.status,
                "sequence": r.sequence
            }
            for r in all_routes if r.station
        ]
    }

@app.get("/map/all-trucks")
def get_all_trucks_location(db: Session = Depends(get_db)):
    """Returns all active trucks with their current positions for the live map."""
    today = datetime.now().strftime("%Y-%m-%d")
    trucks = db.query(FoodTruck).filter(FoodTruck.is_active == True).all()
    result = []
    for truck in trucks:
        current_route = db.query(Route).filter(
            Route.truck_id == truck.id, Route.date == today, Route.status == "current"
        ).first()
        if current_route and current_route.station:
            s = current_route.station
            preorders = db.query(Order).filter(
                Order.truck_id == truck.id,
                Order.station_id == s.id,
                Order.status.in_(["PREORDERED", "PREPARING"])
            ).count()
            result.append({
                "truck_id": truck.id,
                "truck_name": truck.name,
                "cuisine_type": truck.cuisine_type,
                "image_url": truck.image_url,
                "rating": truck.rating,
                "lat": s.latitude,
                "lng": s.longitude,
                "station_name": s.name,
                "arrival_time": current_route.arrival_time,
                "departure_time": current_route.departure_time,
                "active_orders": preorders,
            })
    return result


# ─── DISH AVAILABILITY ───────────────────────
@app.patch("/menu/{item_id}/soldout")
def mark_soldout(item_id: int, db: Session = Depends(get_db)):
    """Mark a menu item as sold out — notifies customers via status."""
    m = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Item not found")
    m.is_available = False
    db.commit()
    # Update any PREORDERED orders containing this item
    affected_orders = db.query(Order).join(OrderItem).filter(
        OrderItem.menu_item_id == item_id,
        Order.status == "PREORDERED"
    ).all()
    return {
        "item_id": item_id,
        "item_name": m.name,
        "message": f"{m.name} marked as SOLD OUT.",
        "affected_orders": len(affected_orders),
        "notification": f"⚠️ {m.name} is now sold out. {len(affected_orders)} customers will be notified."
    }

@app.patch("/menu/{item_id}/available")
def mark_available(item_id: int, db: Session = Depends(get_db)):
    m = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Item not found")
    m.is_available = True
    db.commit()
    return {"item_id": item_id, "item_name": m.name, "message": f"{m.name} is now available again."}


# ─── TRUCK HOLIDAY / LEAVE ───────────────────
@app.get("/trucks/{truck_id}/holidays")
def get_holidays(truck_id: int, db: Session = Depends(get_db)):
    return db.query(TruckHoliday).filter(
        TruckHoliday.truck_id == truck_id,
        TruckHoliday.is_active == True
    ).all()

@app.post("/trucks/{truck_id}/holiday")
def set_holiday(truck_id: int, data: dict, db: Session = Depends(get_db)):
    date = data.get("date")
    reason = data.get("reason", "Day off")
    if not date:
        raise HTTPException(status_code=400, detail="Date required")
    existing = db.query(TruckHoliday).filter(
        TruckHoliday.truck_id == truck_id,
        TruckHoliday.date == date,
        TruckHoliday.is_active == True
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Holiday already set for this date")
    h = TruckHoliday(truck_id=truck_id, date=date, reason=reason)
    db.add(h)
    db.commit()
    db.refresh(h)
    return {"id": h.id, "date": h.date, "reason": h.reason, "message": f"Holiday set for {date}. Customers will be notified."}

@app.delete("/trucks/{truck_id}/holiday/{holiday_id}")
def cancel_holiday(truck_id: int, holiday_id: int, db: Session = Depends(get_db)):
    h = db.query(TruckHoliday).filter(
        TruckHoliday.id == holiday_id, TruckHoliday.truck_id == truck_id
    ).first()
    if not h:
        raise HTTPException(status_code=404, detail="Not found")
    h.is_active = False
    db.commit()
    return {"message": "Holiday cancelled"}

@app.get("/notifications/customer/{customer_id}")
def customer_notifications(customer_id: int, db: Session = Depends(get_db)):
    """Smart notifications for a customer — sold-out dishes, truck holidays, order updates."""
    notifications = []
    today = datetime.now().strftime("%Y-%m-%d")

    # 1. Check preorders with sold-out items
    customer_orders = db.query(Order).filter(
        Order.customer_id == customer_id,
        Order.status.in_(["PREORDERED", "PREPARING"])
    ).all()
    for order in customer_orders:
        for item in order.items:
            if item.menu_item and not item.menu_item.is_available:
                notifications.append({
                    "type": "SOLD_OUT",
                    "icon": "⚠️",
                    "title": "Item Sold Out",
                    "message": f"{item.menu_item.name} in your order #{order.id} is now sold out.",
                    "detail": f"Order from {order.truck.name if order.truck else 'truck'} at {order.station.name if order.station else 'station'}.",
                    "severity": "HIGH",
                    "timestamp": datetime.now().strftime("%H:%M")
                })

    # 2. Check if any truck the customer ordered from is on holiday tomorrow
    ordered_trucks = list(set(o.truck_id for o in customer_orders))
    tomorrow = (datetime.now().replace(hour=0, minute=0, second=0) )
    import datetime as dt
    tomorrow_str = (dt.datetime.now() + dt.timedelta(days=1)).strftime("%Y-%m-%d")
    for truck_id in ordered_trucks:
        holiday = db.query(TruckHoliday).filter(
            TruckHoliday.truck_id == truck_id,
            TruckHoliday.date == tomorrow_str,
            TruckHoliday.is_active == True
        ).first()
        if holiday:
            truck = db.query(FoodTruck).get(truck_id)
            notifications.append({
                "type": "TRUCK_HOLIDAY",
                "icon": "🚫",
                "title": "Truck Not Available Tomorrow",
                "message": f"{truck.name if truck else 'Truck'} will be closed tomorrow ({tomorrow_str}).",
                "detail": f"Reason: {holiday.reason}. Plan accordingly!",
                "severity": "MEDIUM",
                "timestamp": datetime.now().strftime("%H:%M")
            })

    # 3. Check upcoming order status
    for order in customer_orders:
        if order.status == "ARRIVING":
            notifications.append({
                "type": "ARRIVING",
                "icon": "🚚",
                "title": "Truck Arriving!",
                "message": f"{order.truck.name if order.truck else 'Truck'} is arriving at {order.station.name if order.station else 'your station'}!",
                "detail": f"Your order #{order.id} is almost ready for pickup.",
                "severity": "HIGH",
                "timestamp": datetime.now().strftime("%H:%M")
            })
        elif order.status == "READY":
            notifications.append({
                "type": "READY",
                "icon": "✅",
                "title": "Order Ready!",
                "message": f"Your order #{order.id} is ready for pickup!",
                "detail": f"Pick up from {order.station.name if order.station else 'station'}.",
                "severity": "HIGH",
                "timestamp": datetime.now().strftime("%H:%M")
            })

    # 4. Today's truck holiday alerts for all trucks
    all_holidays_today = db.query(TruckHoliday).filter(
        TruckHoliday.date == today,
        TruckHoliday.is_active == True
    ).all()
    for h in all_holidays_today:
        truck = db.query(FoodTruck).get(h.truck_id)
        notifications.append({
            "type": "TRUCK_CLOSED_TODAY",
            "icon": "🔴",
            "title": "Truck Closed Today",
            "message": f"{truck.name if truck else 'A truck'} is not serving today.",
            "detail": f"Reason: {h.reason}.",
            "severity": "LOW",
            "timestamp": datetime.now().strftime("%H:%M")
        })

    return {"notifications": notifications, "count": len(notifications)}
