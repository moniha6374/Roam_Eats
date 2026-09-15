from database import SessionLocal, create_tables
from models import User, FoodTruck, MenuItem, Station, Route, Order, OrderItem, DemandPrediction
from datetime import datetime

def seed():
    create_tables()
    db = SessionLocal()
    
    # Check if already seeded
    if db.query(User).count() > 0:
        db.close()
        return

    # Users
    users = [
        User(id=1, name="Arjun Kumar", email="customer@demo.com", password="demo123", role="customer"),
        User(id=2, name="Priya Sharma", email="customer2@demo.com", password="demo123", role="customer"),
        User(id=3, name="Ravi Trucks", email="owner@demo.com", password="demo123", role="owner"),
        User(id=4, name="Meena Foods", email="owner2@demo.com", password="demo123", role="owner"),
    ]
    db.add_all(users)
    db.flush()

    # Stations
    stations = [
        Station(id=1, name="Railway Station", location="Central Railway Station, Coimbatore", latitude=11.0168, longitude=76.9558, popularity_score=72, description="High footfall transit hub"),
        Station(id=2, name="IT Park", location="TIDEL Park, Singanallur", latitude=11.0107, longitude=77.0231, popularity_score=88, description="Tech professionals zone"),
        Station(id=3, name="College Area", location="PSG College, Peelamedu", latitude=11.0262, longitude=77.0233, popularity_score=65, description="Student-heavy area"),
        Station(id=4, name="Bus Stand", location="Gandhipuram Bus Stand", latitude=11.0177, longitude=76.9721, popularity_score=78, description="Major transit point"),
        Station(id=5, name="Medical District", location="KMCH Hospital Area", latitude=11.0245, longitude=76.9913, popularity_score=55, description="Hospital staff and visitors"),
    ]
    db.add_all(stations)
    db.flush()

    # Food Trucks
    trucks = [
        FoodTruck(id=1, name="Spice Route", owner_id=3, cuisine_type="South Indian", description="Authentic South Indian biryani and curries", image_url="🍛", current_station_id=1, rating=4.7),
        FoodTruck(id=2, name="Green Bites", owner_id=3, cuisine_type="Vegetarian", description="Pure vegetarian fast food and wraps", image_url="🥗", current_station_id=2, rating=4.5),
        FoodTruck(id=3, name="Street Beats", owner_id=4, cuisine_type="Fast Food", description="Burgers, wraps and beverages", image_url="🍔", current_station_id=3, rating=4.3),
    ]
    db.add_all(trucks)
    db.flush()

    # Menu Items
    menu_items = [
        # Spice Route
        MenuItem(id=1, truck_id=1, name="Chicken Biryani", price=150, category="Main Course", description="Aromatic basmati rice with tender chicken", is_available=True, is_vegetarian=False, image_emoji="🍛"),
        MenuItem(id=2, truck_id=1, name="Mutton Biryani", price=180, category="Main Course", description="Slow-cooked mutton biryani", is_available=True, is_vegetarian=False, image_emoji="🍲"),
        MenuItem(id=3, truck_id=1, name="Veg Biryani", price=120, category="Main Course", description="Fragrant vegetable biryani", is_available=True, is_vegetarian=True, image_emoji="🥘"),
        MenuItem(id=4, truck_id=1, name="Raita", price=30, category="Side", description="Fresh yogurt raita", is_available=True, is_vegetarian=True, image_emoji="🥛"),
        MenuItem(id=5, truck_id=1, name="Lemon Juice", price=50, category="Beverage", description="Fresh squeezed lemon", is_available=True, is_vegetarian=True, image_emoji="🍋"),
        # Green Bites
        MenuItem(id=6, truck_id=2, name="Paneer Wrap", price=120, category="Snack", description="Grilled paneer with spiced chutney wrap", is_available=True, is_vegetarian=True, image_emoji="🌯"),
        MenuItem(id=7, truck_id=2, name="Veg Fried Rice", price=100, category="Main Course", description="Stir-fried rice with vegetables", is_available=True, is_vegetarian=True, image_emoji="🍚"),
        MenuItem(id=8, truck_id=2, name="Masala Dosa", price=80, category="Breakfast", description="Crispy dosa with potato masala", is_available=True, is_vegetarian=True, image_emoji="🫓"),
        MenuItem(id=9, truck_id=2, name="Mango Lassi", price=60, category="Beverage", description="Sweet mango yogurt drink", is_available=True, is_vegetarian=True, image_emoji="🥭"),
        MenuItem(id=10, truck_id=2, name="Pav Bhaji", price=90, category="Snack", description="Spiced vegetable curry with bread", is_available=True, is_vegetarian=True, image_emoji="🍞"),
        # Street Beats
        MenuItem(id=11, truck_id=3, name="Veg Burger", price=80, category="Fast Food", description="Crispy veg patty burger", is_available=True, is_vegetarian=True, image_emoji="🍔"),
        MenuItem(id=12, truck_id=3, name="Chicken Burger", price=110, category="Fast Food", description="Juicy grilled chicken burger", is_available=True, is_vegetarian=False, image_emoji="🍔"),
        MenuItem(id=13, truck_id=3, name="French Fries", price=60, category="Side", description="Golden crispy fries", is_available=True, is_vegetarian=True, image_emoji="🍟"),
        MenuItem(id=14, truck_id=3, name="Cold Coffee", price=70, category="Beverage", description="Chilled coffee with ice cream", is_available=True, is_vegetarian=True, image_emoji="☕"),
    ]
    db.add_all(menu_items)
    db.flush()

    # Routes for today
    today = datetime.now().strftime("%Y-%m-%d")
    routes = [
        # Spice Route
        Route(id=1, truck_id=1, station_id=1, arrival_time="11:30", departure_time="12:30", sequence=1, date=today, status="completed"),
        Route(id=2, truck_id=1, station_id=2, arrival_time="12:45", departure_time="14:00", sequence=2, date=today, status="current"),
        Route(id=3, truck_id=1, station_id=4, arrival_time="14:30", departure_time="16:00", sequence=3, date=today, status="planned"),
        Route(id=4, truck_id=1, station_id=5, arrival_time="16:30", departure_time="18:00", sequence=4, date=today, status="planned"),
        # Green Bites
        Route(id=5, truck_id=2, station_id=3, arrival_time="11:00", departure_time="12:00", sequence=1, date=today, status="completed"),
        Route(id=6, truck_id=2, station_id=2, arrival_time="12:30", departure_time="14:00", sequence=2, date=today, status="current"),
        Route(id=7, truck_id=2, station_id=1, arrival_time="14:30", departure_time="16:00", sequence=3, date=today, status="planned"),
        # Street Beats
        Route(id=8, truck_id=3, station_id=3, arrival_time="12:00", departure_time="13:30", sequence=1, date=today, status="current"),
        Route(id=9, truck_id=3, station_id=4, arrival_time="14:00", departure_time="15:30", sequence=2, date=today, status="planned"),
        Route(id=10, truck_id=3, station_id=5, arrival_time="16:00", departure_time="17:30", sequence=3, date=today, status="planned"),
    ]
    db.add_all(routes)
    db.flush()

    # Historical Orders (completed)
    orders = [
        Order(id=1, customer_id=1, truck_id=1, station_id=1, status="COMPLETED", total_amount=330, created_at=datetime.now(), pickup_time="11:45"),
        Order(id=2, customer_id=2, truck_id=1, station_id=1, status="COMPLETED", total_amount=180, created_at=datetime.now(), pickup_time="12:00"),
        Order(id=3, customer_id=1, truck_id=2, station_id=3, status="COMPLETED", total_amount=200, created_at=datetime.now(), pickup_time="11:30"),
        Order(id=4, customer_id=2, truck_id=3, station_id=3, status="COMPLETED", total_amount=190, created_at=datetime.now(), pickup_time="12:30"),
        Order(id=5, customer_id=1, truck_id=1, station_id=2, status="PREPARING", total_amount=300, created_at=datetime.now(), pickup_time="13:00"),
        Order(id=6, customer_id=2, truck_id=2, station_id=2, status="PREORDERED", total_amount=240, created_at=datetime.now(), pickup_time="12:50"),
        Order(id=7, customer_id=1, truck_id=2, station_id=2, status="PREORDERED", total_amount=120, created_at=datetime.now(), pickup_time="12:45"),
        Order(id=8, customer_id=2, truck_id=1, station_id=2, status="PREORDERED", total_amount=150, created_at=datetime.now(), pickup_time="13:00"),
        Order(id=9, customer_id=1, truck_id=3, station_id=4, status="PREORDERED", total_amount=190, created_at=datetime.now(), pickup_time="14:15"),
        Order(id=10, customer_id=2, truck_id=1, station_id=4, status="PREORDERED", total_amount=180, created_at=datetime.now(), pickup_time="14:30"),
    ]
    db.add_all(orders)
    db.flush()

    order_items = [
        OrderItem(order_id=1, menu_item_id=1, quantity=2, price=150),
        OrderItem(order_id=1, menu_item_id=5, quantity=1, price=50),
        OrderItem(order_id=2, menu_item_id=2, quantity=1, price=180),
        OrderItem(order_id=3, menu_item_id=6, quantity=1, price=120),
        OrderItem(order_id=3, menu_item_id=7, quantity=1, price=100),
        OrderItem(order_id=4, menu_item_id=12, quantity=1, price=110),
        OrderItem(order_id=4, menu_item_id=13, quantity=1, price=60),
        OrderItem(order_id=5, menu_item_id=1, quantity=2, price=150),
        OrderItem(order_id=6, menu_item_id=6, quantity=2, price=120),
        OrderItem(order_id=7, menu_item_id=6, quantity=1, price=120),
        OrderItem(order_id=8, menu_item_id=1, quantity=1, price=150),
        OrderItem(order_id=9, menu_item_id=11, quantity=1, price=80),
        OrderItem(order_id=9, menu_item_id=13, quantity=1, price=60),
        OrderItem(order_id=10, menu_item_id=2, quantity=1, price=180),
    ]
    db.add_all(order_items)
    db.flush()

    # Demand Predictions
    preds = [
        DemandPrediction(station_id=1, truck_id=1, date=today, hour=12, predicted_orders=18, historical_demand=72, sds_score=68),
        DemandPrediction(station_id=2, truck_id=1, date=today, hour=13, predicted_orders=28, historical_demand=88, sds_score=87),
        DemandPrediction(station_id=3, truck_id=2, date=today, hour=12, predicted_orders=15, historical_demand=65, sds_score=71),
        DemandPrediction(station_id=4, truck_id=1, date=today, hour=14, predicted_orders=22, historical_demand=78, sds_score=74),
        DemandPrediction(station_id=5, truck_id=3, date=today, hour=16, predicted_orders=10, historical_demand=55, sds_score=42),
    ]
    db.add_all(preds)

    db.commit()
    db.close()
    print("✅ Database seeded successfully!")

if __name__ == "__main__":
    seed()
