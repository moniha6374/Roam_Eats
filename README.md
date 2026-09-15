# 🚚 FoodTrack AI — Predictive Station Intelligence

> AI-powered station-based food truck ecosystem with multi-agent intelligence, predictive demand scoring, and smart pre-ordering.

---

## 🚀 Quick Start

### Requirements
- Python 3.10+
- Node.js 18+

### 1. Start Backend (FastAPI)
```bash
cd backend
pip install fastapi uvicorn sqlalchemy pydantic python-jose passlib python-multipart aiofiles
python -m uvicorn main:app --reload --port 8000
```

### 2. Start Frontend (React + Vite)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

### 3. Open in Browser
- **App**: http://localhost:5173
- **API Docs**: http://localhost:8000/docs

---

## 🔑 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@demo.com | demo123 |
| Truck Owner | owner@demo.com | demo123 |

---

## 🎯 Demo Flow

1. **Login as customer** → customer@demo.com / demo123
2. **Go to AI Finder** → Select "Vegetarian" + "1:00 PM"
3. **AI recommends** Green Bites at IT Park (Station 2) at 12:30
4. **Place pre-order** → Order confirmed with status tracker
5. **Login as owner** → owner@demo.com / demo123
6. **Dashboard shows** new preorder + updated SDS score
7. **AI Command Center** → Agents show demand alerts
8. **Click "Simulate Next Stop"** → Truck moves to next station
9. **Customer orders** update to ARRIVING status
10. **What-If Simulator** → Try different stations for revenue analysis

---

## 🤖 Multi-Agent AI System

| Agent | Responsibility |
|-------|---------------|
| Customer Discovery Agent | Recommends trucks based on preference + time |
| Demand Prediction Agent | Calculates Station Demand Score (SDS) |
| Route Optimization Agent | Optimizes station sequence by weighted score |
| Order Management Agent | Monitors orders, detects demand spikes |
| Business Advisor Agent | Generates strategic recommendations |

## 🧮 Station Demand Score (SDS)

```
SDS = 0.30 × HistoricalDemand
    + 0.25 × CurrentPreorders
    + 0.15 × TimeDemand
    + 0.15 × StationPopularity
    + 0.10 × RouteAccessibility
    + 0.05 × FoodCategoryTrend

Score: 0–100 | HIGH ≥ 75 | MEDIUM 50–74 | LOW < 50
```

---

## 🏗️ Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts + Lucide
- **Backend**: FastAPI + SQLAlchemy
- **Database**: SQLite (auto-created on startup)
- **AI**: Deterministic multi-agent reasoning engine

## 📡 Key API Endpoints

```
POST /auth/login          — Authentication
GET  /trucks              — List all trucks with live status
GET  /ai/discover         — Customer Discovery Agent
GET  /ai/demand           — Demand Prediction Agent + SDS
GET  /ai/recommendations  — All 4 agents combined
GET  /ai/whatif           — What-If station simulation
POST /ai/chat             — AI chat assistant
POST /simulation/next-stop — Advance truck to next station
GET  /owner/dashboard     — Owner analytics + demand heatmap
```
