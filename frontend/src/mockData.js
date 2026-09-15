// ─── ROAMEATS DEMO DATA ───────────────────────────────────────────────────────
// Used when backend is unavailable (GitHub Pages static deployment)

export const DEMO_USERS = [
  { id: 1, name: "Arjun Kumar", email: "customer@demo.com", password: "demo123", role: "customer", token: "demo-token-1" },
  { id: 2, name: "Priya Sharma", email: "customer2@demo.com", password: "demo123", role: "customer", token: "demo-token-2" },
  { id: 3, name: "Ravi Trucks", email: "owner@demo.com", password: "demo123", role: "owner", token: "demo-token-3" },
]

export const DEMO_STATIONS = [
  { id: 1, name: "Railway Station", location: "Central Railway Station, Coimbatore", latitude: 11.0168, longitude: 76.9558, popularity_score: 72, description: "High footfall transit hub" },
  { id: 2, name: "IT Park", location: "TIDEL Park, Singanallur", latitude: 11.0107, longitude: 77.0231, popularity_score: 88, description: "Tech professionals zone" },
  { id: 3, name: "College Area", location: "PSG College, Peelamedu", latitude: 11.0262, longitude: 77.0233, popularity_score: 65, description: "Student-heavy area" },
  { id: 4, name: "Bus Stand", location: "Gandhipuram Bus Stand", latitude: 11.0177, longitude: 76.9721, popularity_score: 78, description: "Major transit point" },
  { id: 5, name: "Medical District", location: "KMCH Hospital Area", latitude: 11.0245, longitude: 76.9913, popularity_score: 55, description: "Hospital staff and visitors" },
]

export const DEMO_TRUCKS = [
  {
    id: 1, name: "Spice Route", owner_id: 3, cuisine_type: "South Indian",
    description: "Authentic South Indian biryani and curries", image_url: "🍛",
    rating: 4.7, is_active: true, current_station_id: 2,
    current_station: "IT Park", current_arrival: "12:45",
    next_station: "Bus Stand", next_arrival: "14:30",
    menu_count: 5, veg_count: 3,
  },
  {
    id: 2, name: "Green Bites", owner_id: 3, cuisine_type: "Vegetarian",
    description: "Pure vegetarian fast food and wraps", image_url: "🥗",
    rating: 4.5, is_active: true, current_station_id: 2,
    current_station: "IT Park", current_arrival: "12:30",
    next_station: "Railway Station", next_arrival: "14:30",
    menu_count: 5, veg_count: 5,
  },
  {
    id: 3, name: "Street Beats", owner_id: 4, cuisine_type: "Fast Food",
    description: "Burgers, wraps and beverages", image_url: "🍔",
    rating: 4.3, is_active: true, current_station_id: 3,
    current_station: "College Area", current_arrival: "12:00",
    next_station: "Bus Stand", next_arrival: "14:00",
    menu_count: 4, veg_count: 3,
  },
]

export const DEMO_MENU = {
  1: [
    { id: 1, truck_id: 1, name: "Chicken Biryani", price: 150, category: "Main Course", description: "Aromatic basmati rice with tender chicken", is_available: true, is_vegetarian: false, image_emoji: "🍛" },
    { id: 2, truck_id: 1, name: "Mutton Biryani", price: 180, category: "Main Course", description: "Slow-cooked mutton biryani", is_available: true, is_vegetarian: false, image_emoji: "🍲" },
    { id: 3, truck_id: 1, name: "Veg Biryani", price: 120, category: "Main Course", description: "Fragrant vegetable biryani", is_available: true, is_vegetarian: true, image_emoji: "🥘" },
    { id: 4, truck_id: 1, name: "Raita", price: 30, category: "Side", description: "Fresh yogurt raita", is_available: true, is_vegetarian: true, image_emoji: "🥛" },
    { id: 5, truck_id: 1, name: "Lemon Juice", price: 50, category: "Beverage", description: "Fresh squeezed lemon", is_available: true, is_vegetarian: true, image_emoji: "🍋" },
  ],
  2: [
    { id: 6, truck_id: 2, name: "Paneer Wrap", price: 120, category: "Snack", description: "Grilled paneer with spiced chutney wrap", is_available: true, is_vegetarian: true, image_emoji: "🌯" },
    { id: 7, truck_id: 2, name: "Veg Fried Rice", price: 100, category: "Main Course", description: "Stir-fried rice with vegetables", is_available: true, is_vegetarian: true, image_emoji: "🍚" },
    { id: 8, truck_id: 2, name: "Masala Dosa", price: 80, category: "Breakfast", description: "Crispy dosa with potato masala", is_available: true, is_vegetarian: true, image_emoji: "🫓" },
    { id: 9, truck_id: 2, name: "Mango Lassi", price: 60, category: "Beverage", description: "Sweet mango yogurt drink", is_available: true, is_vegetarian: true, image_emoji: "🥭" },
    { id: 10, truck_id: 2, name: "Pav Bhaji", price: 90, category: "Snack", description: "Spiced vegetable curry with bread", is_available: true, is_vegetarian: true, image_emoji: "🍞" },
  ],
  3: [
    { id: 11, truck_id: 3, name: "Veg Burger", price: 80, category: "Fast Food", description: "Crispy veg patty burger", is_available: true, is_vegetarian: true, image_emoji: "🍔" },
    { id: 12, truck_id: 3, name: "Chicken Burger", price: 110, category: "Fast Food", description: "Juicy grilled chicken burger", is_available: true, is_vegetarian: false, image_emoji: "🍔" },
    { id: 13, truck_id: 3, name: "French Fries", price: 60, category: "Side", description: "Golden crispy fries", is_available: true, is_vegetarian: true, image_emoji: "🍟" },
    { id: 14, truck_id: 3, name: "Cold Coffee", price: 70, category: "Beverage", description: "Chilled coffee with ice cream", is_available: true, is_vegetarian: true, image_emoji: "☕" },
  ],
}

export const DEMO_ROUTES = {
  1: [
    { id: 1, truck_id: 1, station_id: 1, station_name: "Railway Station", arrival_time: "11:30", departure_time: "12:30", sequence: 1, status: "completed" },
    { id: 2, truck_id: 1, station_id: 2, station_name: "IT Park", arrival_time: "12:45", departure_time: "14:00", sequence: 2, status: "current" },
    { id: 3, truck_id: 1, station_id: 4, station_name: "Bus Stand", arrival_time: "14:30", departure_time: "16:00", sequence: 3, status: "planned" },
    { id: 4, truck_id: 1, station_id: 5, station_name: "Medical District", arrival_time: "16:30", departure_time: "18:00", sequence: 4, status: "planned" },
  ],
  2: [
    { id: 5, truck_id: 2, station_id: 3, station_name: "College Area", arrival_time: "11:00", departure_time: "12:00", sequence: 1, status: "completed" },
    { id: 6, truck_id: 2, station_id: 2, station_name: "IT Park", arrival_time: "12:30", departure_time: "14:00", sequence: 2, status: "current" },
    { id: 7, truck_id: 2, station_id: 1, station_name: "Railway Station", arrival_time: "14:30", departure_time: "16:00", sequence: 3, status: "planned" },
  ],
  3: [
    { id: 8, truck_id: 3, station_id: 3, station_name: "College Area", arrival_time: "12:00", departure_time: "13:30", sequence: 1, status: "current" },
    { id: 9, truck_id: 3, station_id: 4, station_name: "Bus Stand", arrival_time: "14:00", departure_time: "15:30", sequence: 2, status: "planned" },
    { id: 10, truck_id: 3, station_id: 5, station_name: "Medical District", arrival_time: "16:00", departure_time: "17:30", sequence: 3, status: "planned" },
  ],
}

export const DEMO_STATION_DEMAND = [
  { station_id: 1, station_name: "Railway Station", arrival_time: "11:30", sds_score: 68, demand_level: "MEDIUM", preorder_count: 3, historical_demand: 72, time_demand: 60, station_popularity: 72, expected_peak: "12:00 - 13:00", status: "completed", preparation_recommendation: "Prepare 14 meals. Maintain standard stock." },
  { station_id: 2, station_name: "IT Park", arrival_time: "12:45", sds_score: 87, demand_level: "HIGH", preorder_count: 8, historical_demand: 88, time_demand: 90, station_popularity: 88, expected_peak: "13:00 - 14:00", status: "current", preparation_recommendation: "Prepare 18 meals. Increase biryani/main course by 25%." },
  { station_id: 4, station_name: "Bus Stand", arrival_time: "14:30", sds_score: 74, demand_level: "MEDIUM", preorder_count: 4, historical_demand: 78, time_demand: 75, station_popularity: 78, expected_peak: "14:00 - 15:00", status: "planned", preparation_recommendation: "Prepare 15 meals. Maintain standard stock." },
  { station_id: 5, station_name: "Medical District", arrival_time: "16:30", sds_score: 42, demand_level: "LOW", preorder_count: 1, historical_demand: 55, time_demand: 40, station_popularity: 55, expected_peak: "16:00 - 17:00", status: "planned", preparation_recommendation: "Prepare 9 meals. Light stock sufficient." },
]

export const DEMO_ORDERS = [
  { id: 1, customer_id: 1, customer_name: "Arjun Kumar", truck_id: 1, truck_name: "Spice Route", station_id: 2, station_name: "IT Park", status: "PREORDERED", total_amount: 300, pickup_time: "13:00", created_at: new Date().toISOString(), items: [{ id: 1, menu_item_id: 1, name: "Chicken Biryani", quantity: 2, price: 150, emoji: "🍛" }] },
  { id: 2, customer_id: 1, customer_name: "Arjun Kumar", truck_id: 2, truck_name: "Green Bites", station_id: 2, station_name: "IT Park", status: "PREPARING", total_amount: 120, pickup_time: "12:50", created_at: new Date().toISOString(), items: [{ id: 2, menu_item_id: 6, name: "Paneer Wrap", quantity: 1, price: 120, emoji: "🌯" }] },
]

export const DEMO_AI_DISCOVER = (preference, timePreference) => {
  const isVeg = preference?.toLowerCase().includes('veg')
  const results = [
    {
      truck_id: 2, truck_name: "Green Bites", cuisine_type: "Vegetarian",
      image_url: "🥗", rating: 4.5, recommendation_score: isVeg ? 94 : 78,
      recommended_station: "IT Park", recommended_station_id: 2,
      arrival_time: "12:30", vegetarian_options: 5, waiting_time_min: 8,
      reasons: ["5 vegetarian options available", "Arrives at IT Park at 12:30", "Best time match", "High station demand (SDS: 87)"],
    },
    {
      truck_id: 1, truck_name: "Spice Route", cuisine_type: "South Indian",
      image_url: "🍛", rating: 4.7, recommendation_score: isVeg ? 71 : 89,
      recommended_station: "IT Park", recommended_station_id: 2,
      arrival_time: "12:45", vegetarian_options: 3, waiting_time_min: 12,
      reasons: ["Arriving at IT Park at 12:45", "High station demand", "Rating: 4.7"],
    },
    {
      truck_id: 3, truck_name: "Street Beats", cuisine_type: "Fast Food",
      image_url: "🍔", rating: 4.3, recommendation_score: 62,
      recommended_station: "College Area", recommended_station_id: 3,
      arrival_time: "12:00", vegetarian_options: 3, waiting_time_min: 5,
      reasons: ["Quick service", "Currently at College Area"],
    },
  ].sort((a, b) => b.recommendation_score - a.recommendation_score)

  const top = results[0]
  return {
    agent: "Customer Discovery Agent", status: "COMPLETED",
    recommendations: results, top_recommendation: top,
    agent_message: `🤖 Customer Discovery Agent: Based on your preferences, I recommend **${top.truck_name}** arriving at **${top.recommended_station}** at **${top.arrival_time}**. Reason: ${top.reasons[0]}. Estimated waiting time: ${top.waiting_time_min} minutes.`,
    reasoning: ["Analyzed customer food preference and time", "Matched against active truck menus", "Applied station popularity weighting", "Computed recommendation score", "Ranked results by score"],
  }
}

export const DEMO_OWNER_DASHBOARD = {
  truck: { id: 1, name: "Spice Route", cuisine_type: "South Indian", image_url: "🍛" },
  stats: { total_orders: 10, active_orders: 5, completed_orders: 3, total_revenue: 660, projected_revenue: 1410 },
  current_station: "IT Park", current_station_id: 2,
  next_station: "Bus Stand", next_arrival: "14:30",
  station_demand: DEMO_STATION_DEMAND,
  top_demand_station: DEMO_STATION_DEMAND[1],
  alerts: [
    { type: "HIGH_DEMAND", icon: "🔥", message: "5 active orders detected. High preparation load!", action: "Prepare 10 additional meals in advance.", severity: "HIGH" },
    { type: "ITEM_DEMAND", icon: "🍛", message: "Chicken Biryani is the most ordered item (4 portions).", action: "Prepare 12 additional portions of Chicken Biryani.", severity: "INFO" },
  ],
  active_order_count: 5,
}

export const DEMO_AI_RECOMMENDATIONS = {
  demand: {
    agent: "Demand Prediction Agent", status: "COMPLETED",
    station_scores: DEMO_STATION_DEMAND,
    top_station: DEMO_STATION_DEMAND[1],
    agent_message: "🤖 Demand Prediction Agent: **IT Park** has the highest demand score (87/100 — HIGH DEMAND). Expected peak: 13:00 - 14:00. Prepare 18 meals. Increase biryani/main course by 25%.",
    reasoning: ["Loaded historical order data per station", "Counted current active preorders", "Applied time-of-day demand factor", "Weighted station popularity", "Evaluated route sequence accessibility", "Applied food category trend multiplier", "Computed SDS = Σ(weight × factor)"],
  },
  route: {
    agent: "Route Optimization Agent", status: "COMPLETED",
    best_next_station: { station_name: "IT Park", weighted_route_score: 43.5, arrival_time: "12:45" },
    needs_reorder: false,
    agent_message: "🤖 Route Optimization Agent: Optimal next stop is **IT Park** (Weighted Score: 43.5). Recommended arrival: 12:45. Current route order is efficient.",
    reasoning: ["Retrieved Station Demand Scores for all route stops", "Applied Weighted Route Score = SDS / Distance Factor", "Ranked stations by opportunity score", "Compared to current planned sequence"],
  },
  orders: {
    agent: "Order Management Agent", status: "COMPLETED",
    total_active_orders: 5,
    item_demand: { "Chicken Biryani": 4, "Paneer Wrap": 2, "Veg Biryani": 1 },
    alerts: [
      { type: "HIGH_DEMAND", icon: "🔥", message: "5 active orders detected. High preparation load!", action: "Prepare 10 additional meals in advance.", severity: "HIGH" },
      { type: "ITEM_DEMAND", icon: "🍛", message: "Chicken Biryani is the most ordered item (4 portions).", action: "Prepare 12 additional portions.", severity: "INFO" },
    ],
    agent_message: "🤖 Order Management Agent: 5 active orders. Load manageable. Top item: Chicken Biryani (4 portions).",
    reasoning: ["Queried all active orders", "Grouped orders by station", "Analyzed item-level demand", "Detected demand spikes above threshold"],
  },
  business: {
    agent: "Business Advisor Agent", status: "COMPLETED",
    total_revenue: 660, projected_revenue: 1410, total_orders_today: 10,
    recommendations: [
      { type: "TIMING", icon: "⏰", title: "Timing Optimization", insight: "Arrive at IT Park 15 minutes earlier tomorrow.", detail: "Demand is consistently high between 13:00 - 14:00.", impact: "+18% revenue opportunity", action: "Adjust arrival to 12:30" },
      { type: "MENU", icon: "🍽️", title: "Menu Popularity Insight", insight: "**Chicken Biryani** is your best-seller (4 orders).", detail: "Consider offering a combo deal to increase average order value.", impact: "+₹200–400 avg order value", action: "Create 'Biryani Combo' with beverage at ₹30 discount" },
      { type: "REVENUE", icon: "📈", title: "Revenue Projection", insight: "Today's projected revenue: ₹1410", detail: "Completed: ₹660 | Active orders: ₹750 pending", impact: "On track", action: "Promote top items at next station" },
    ],
    agent_message: "🤖 Business Advisor: Today's projected revenue is ₹1410. Top recommendation: Arrive at IT Park 15 minutes earlier tomorrow.",
    reasoning: ["Aggregated completed and active order revenue", "Analyzed station demand scores", "Ranked menu items by order frequency"],
  },
}

let demoOrderId = 100
let demoOrders = [...DEMO_ORDERS]
let demoMenuState = {}
Object.entries(DEMO_MENU).forEach(([k, v]) => { demoMenuState[k] = [...v] })
let demoStationIndex = { 1: 1 } // truck_id -> current route sequence index

export const demoStore = {
  getOrders: (customerId, truckId) => {
    if (customerId) return demoOrders.filter(o => o.customer_id === customerId)
    if (truckId) return demoOrders.filter(o => o.truck_id === truckId)
    return demoOrders
  },
  createOrder: (data) => {
    const truck = DEMO_TRUCKS.find(t => t.id === data.truck_id)
    const station = DEMO_STATIONS.find(s => s.id === data.station_id)
    const items = data.items.map(i => {
      const allItems = Object.values(DEMO_MENU).flat()
      const mi = allItems.find(m => m.id === i.menu_item_id)
      return { id: i.menu_item_id, menu_item_id: i.menu_item_id, name: mi?.name, quantity: i.quantity, price: mi?.price || 0, emoji: mi?.image_emoji || "🍔" }
    })
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const order = {
      id: ++demoOrderId, customer_id: data.customer_id, customer_name: "You",
      truck_id: data.truck_id, truck_name: truck?.name,
      station_id: data.station_id, station_name: station?.name,
      status: "PREORDERED", total_amount: total, pickup_time: data.pickup_time,
      created_at: new Date().toISOString(), items,
    }
    demoOrders.push(order)
    return order
  },
  updateOrderStatus: (id, status) => {
    demoOrders = demoOrders.map(o => o.id === id ? { ...o, status } : o)
    return demoOrders.find(o => o.id === id)
  },
  getMenu: (truckId) => demoMenuState[truckId] || [],
  addMenuItem: (data) => {
    const id = Math.max(...Object.values(demoMenuState).flat().map(i => i.id), 20) + 1
    const item = { ...data, id }
    demoMenuState[data.truck_id] = [...(demoMenuState[data.truck_id] || []), item]
    return item
  },
  updateMenuItem: (id, data) => {
    Object.keys(demoMenuState).forEach(k => {
      demoMenuState[k] = demoMenuState[k].map(i => i.id === id ? { ...i, ...data } : i)
    })
    return Object.values(demoMenuState).flat().find(i => i.id === id)
  },
  deleteMenuItem: (id) => {
    Object.keys(demoMenuState).forEach(k => {
      demoMenuState[k] = demoMenuState[k].filter(i => i.id !== id)
    })
  },
  simulateNextStop: (truckId) => {
    const routes = DEMO_ROUTES[truckId] || []
    const currentIdx = routes.findIndex(r => r.status === 'current')
    if (currentIdx >= 0) routes[currentIdx].status = 'completed'
    const nextIdx = routes.findIndex(r => r.status === 'planned')
    if (nextIdx === -1) return { message: "No more stops for today!", finished: true }
    routes[nextIdx].status = 'current'
    const newStation = routes[nextIdx]
    demoOrders = demoOrders.map(o =>
      o.truck_id === truckId && o.station_id === newStation.station_id && o.status === 'PREORDERED'
        ? { ...o, status: 'ARRIVING' } : o
    )
    return {
      message: `Truck moved to ${newStation.station_name}!`, finished: false,
      new_station: { id: newStation.station_id, name: newStation.station_name, arrival_time: newStation.arrival_time },
      orders_updated: demoOrders.filter(o => o.station_id === newStation.station_id && o.status === 'ARRIVING').length,
      ai_recommendation: `🤖 Demand Prediction Agent: ${newStation.station_name} is your next stop. Prepare accordingly!`,
    }
  },
  whatif: (truckId, stationId) => {
    const station = DEMO_STATIONS.find(s => s.id === stationId)
    const sds = Math.round(station ? station.popularity_score * 0.9 + Math.random() * 10 : 60)
    const level = sds >= 75 ? 'HIGH' : sds >= 50 ? 'MEDIUM' : 'LOW'
    const currentRevenue = 660
    const predicted = currentRevenue + Math.round(sds / 3.5) * 160
    const opp = Math.round(((predicted - currentRevenue) / currentRevenue) * 100)
    return {
      station_id: stationId, station_name: station?.name, sds_score: sds,
      demand_level: level, current_revenue: currentRevenue, predicted_revenue: predicted,
      opportunity_percent: opp, predicted_new_orders: Math.round(sds / 3.5),
      agent_message: `🤖 What-If Analysis: Moving to **${station?.name}** could generate ₹${predicted} total revenue. Opportunity: +${opp}%. SDS Score: ${sds}/100.`,
    }
  },
  holidays: [],
  addHoliday: (truckId, date, reason) => {
    const h = { id: Date.now(), truck_id: truckId, date, reason, is_active: true }
    demoStore.holidays.push(h)
    return h
  },
  getHolidays: (truckId) => demoStore.holidays.filter(h => h.truck_id === truckId && h.is_active),
  cancelHoliday: (id) => { demoStore.holidays = demoStore.holidays.map(h => h.id === id ? { ...h, is_active: false } : h) },
}
