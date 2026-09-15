import React, { useEffect, useState } from 'react'
import { ai as aiApi, orders as ordersApi } from '../../api'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'
import { BarChart3 } from 'lucide-react'

const TRUCK_ID = 1
const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ef4444', '#eab308']

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div className="bg-slate-800 border border-white/20 rounded-lg p-3 text-sm">
      <p className="text-white font-semibold">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>)}
    </div>
  )
  return null
}

export default function OwnerAnalytics() {
  const [business, setBusiness] = useState(null)
  const [demand, setDemand] = useState(null)
  const [orders, setOrders] = useState([])

  useEffect(() => {
    Promise.all([
      aiApi.business(TRUCK_ID),
      aiApi.demand(TRUCK_ID),
      ordersApi.list({ truck_id: TRUCK_ID })
    ]).then(([b, d, o]) => {
      setBusiness(b.data)
      setDemand(d.data)
      setOrders(o.data)
    })
  }, [])

  const stationData = demand?.station_scores?.map(s => ({
    name: s.station_name.replace(' ', '\n'),
    SDS: s.sds_score,
    Preorders: s.preorder_count * 10,
    Historical: s.historical_demand,
  })) || []

  const itemDemand = business?.recommendations ? [] : []
  const allItems = orders.flatMap(o => o.items || [])
  const itemCounts = {}
  allItems.forEach(i => { itemCounts[i.name] = (itemCounts[i.name] || 0) + i.quantity })
  const pieData = Object.entries(itemCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6)

  const hourlyData = Array.from({ length: 8 }, (_, i) => ({
    hour: `${10 + i}:00`,
    orders: Math.floor(Math.random() * 15) + 5 + (i === 2 || i === 3 ? 15 : 0),
    revenue: Math.floor(Math.random() * 1500) + 500 + (i === 2 || i === 3 ? 2000 : 0),
  }))

  const sdsBreakdown = demand?.station_scores?.[0]?.breakdown
  const breakdownData = sdsBreakdown ? Object.entries(sdsBreakdown).map(([k, v]) => ({
    name: k.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    contribution: v.contribution,
    score: v.score,
    weight: v.weight
  })) : []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-orange-400" /> Analytics
      </h1>

      {/* Revenue Summary */}
      {business && (
        <div className="grid grid-cols-3 gap-4">
          <div className="card-glass rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-green-400">₹{business.total_revenue?.toFixed(0)}</div>
            <div className="text-slate-400 text-sm">Revenue Earned</div>
          </div>
          <div className="card-glass rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-purple-400">₹{business.projected_revenue?.toFixed(0)}</div>
            <div className="text-slate-400 text-sm">Projected Today</div>
          </div>
          <div className="card-glass rounded-2xl p-5 text-center">
            <div className="text-3xl font-bold text-orange-400">{business.total_orders_today}</div>
            <div className="text-slate-400 text-sm">Total Orders</div>
          </div>
        </div>
      )}

      {/* Station Demand Chart */}
      <div className="card-glass rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-5">Station Demand Score (SDS) Comparison</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stationData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="SDS" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Historical" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Item Popularity Pie */}
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-5">Menu Item Popularity</h2>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-48 text-slate-500">No order data yet</div>
          )}
        </div>

        {/* SDS Breakdown */}
        {breakdownData.length > 0 && (
          <div className="card-glass rounded-2xl p-6">
            <h2 className="text-white font-semibold mb-5">SDS Score Breakdown (Top Station)</h2>
            <div className="space-y-3">
              {breakdownData.map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-300">{item.name}</span>
                    <span className="text-white font-medium">{item.contribution} pts <span className="text-slate-500">({item.weight})</span></span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500" style={{ width: `${(item.contribution / item.score) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hourly Orders */}
      <div className="card-glass rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-5">Hourly Order Pattern (Simulated)</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={hourlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="hour" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="orders" stroke="#f97316" strokeWidth={2} dot={{ fill: '#f97316' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Business Recommendations */}
      {business?.recommendations && (
        <div className="card-glass rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-4">AI Business Recommendations</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {business.recommendations.map((rec, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{rec.icon}</span>
                  <div>
                    <div className="text-white font-semibold text-sm">{rec.title}</div>
                    <div className="text-slate-400 text-xs mt-1">{rec.insight}</div>
                    <div className="text-green-400 text-xs mt-1 font-medium">{rec.impact}</div>
                    <div className="text-slate-500 text-xs mt-1">→ {rec.action}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
