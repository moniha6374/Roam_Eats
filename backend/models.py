from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()

class UserRole(str, enum.Enum):
    customer = "customer"
    owner = "owner"

class OrderStatus(str, enum.Enum):
    preordered = "PREORDERED"
    preparing = "PREPARING"
    on_route = "ON_ROUTE"
    arriving = "ARRIVING"
    ready = "READY"
    completed = "COMPLETED"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True)
    password = Column(String, nullable=False)
    role = Column(String, default="customer")
    created_at = Column(DateTime, default=datetime.utcnow)
    orders = relationship("Order", back_populates="customer")

class FoodTruck(Base):
    __tablename__ = "food_trucks"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    cuisine_type = Column(String)
    description = Column(String)
    image_url = Column(String, default="🚚")
    is_active = Column(Boolean, default=True)
    current_station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    rating = Column(Float, default=4.5)
    owner = relationship("User")
    menu_items = relationship("MenuItem", back_populates="truck")
    routes = relationship("Route", back_populates="truck")

class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(Integer, primary_key=True, index=True)
    truck_id = Column(Integer, ForeignKey("food_trucks.id"))
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String)
    description = Column(String)
    is_available = Column(Boolean, default=True)
    is_vegetarian = Column(Boolean, default=False)
    image_emoji = Column(String, default="🍔")
    truck = relationship("FoodTruck", back_populates="menu_items")
    order_items = relationship("OrderItem", back_populates="menu_item")

class Station(Base):
    __tablename__ = "stations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String)
    latitude = Column(Float, default=11.0)
    longitude = Column(Float, default=77.0)
    popularity_score = Column(Float, default=50.0)
    description = Column(String)

class Route(Base):
    __tablename__ = "routes"
    id = Column(Integer, primary_key=True, index=True)
    truck_id = Column(Integer, ForeignKey("food_trucks.id"))
    station_id = Column(Integer, ForeignKey("stations.id"))
    arrival_time = Column(String)
    departure_time = Column(String)
    sequence = Column(Integer)
    date = Column(String)
    status = Column(String, default="planned")  # planned, current, completed
    truck = relationship("FoodTruck", back_populates="routes")
    station = relationship("Station")

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("users.id"))
    truck_id = Column(Integer, ForeignKey("food_trucks.id"))
    station_id = Column(Integer, ForeignKey("stations.id"))
    status = Column(String, default="PREORDERED")
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    pickup_time = Column(String)
    notes = Column(Text)
    customer = relationship("User", back_populates="orders")
    truck = relationship("FoodTruck")
    station = relationship("Station")
    items = relationship("OrderItem", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    menu_item_id = Column(Integer, ForeignKey("menu_items.id"))
    quantity = Column(Integer, default=1)
    price = Column(Float)
    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")

class DemandPrediction(Base):
    __tablename__ = "demand_predictions"
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"))
    truck_id = Column(Integer, ForeignKey("food_trucks.id"))
    date = Column(String)
    hour = Column(Integer)
    predicted_orders = Column(Integer)
    historical_demand = Column(Float)
    sds_score = Column(Float)
    station = relationship("Station")

class TruckHoliday(Base):
    __tablename__ = "truck_holidays"
    id = Column(Integer, primary_key=True, index=True)
    truck_id = Column(Integer, ForeignKey("food_trucks.id"))
    date = Column(String, nullable=False)           # YYYY-MM-DD
    reason = Column(String, default="Day off")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    truck = relationship("FoodTruck")
