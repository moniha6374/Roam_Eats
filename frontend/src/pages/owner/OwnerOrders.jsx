import React, { useEffect, useState, useCallback } from 'react'
import { orders as ordersApi } from '../../api'
import { RefreshCw, ChevronDown } from 'lucide-react'

const TRUCK_ID = 1
const STATUS_OPTIONS = ['PREORDERED', 'PREPARING', 'ON_ROUTE', 'ARRIVING', 'READY', 'COMPLETED']
const STATUS_COLORS = {
  PREORDERED: 'bg-blue-500/20 text-blue-300',
  PREPARING: 'bg-yellow-500/20 text-yellow-300',
  ON_ROUTE: 'bg-purple-500/20 text-purple-300',
  ARRIVING: 'bg-orange-500/20 text-orange-300',
  READY: 'bg-green-500/20 text-green-300',
  COMPLETED: 'bg-slate-600/20 text-slate-400',
}

export default function OwnerOrders() {
  const [orderList, setOrderList] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [updating, setUpdating] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    ordersApi.list({ truck_id: TRUCK_ID })
      .then(r => setOrderList(r.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  const updateStatus = async (id, status) => {
    setUpdating(id)
    try {
      await ordersApi.updateStatus(id, status)
      load()
    } catch { }
    setUpdating(null)
  }

  const getNextStatus = (s) => {
    const idx = STATUS_OPTIONS.indexOf(s)
    return idx < STATUS_OPTIONS.length - 1 ? STATUS_OPTIONS[idx + 1] : null
  }

  const filtered = filter === 'ALL' ? orderList : orderList.filter(o => o.status === filter)
  const counts = STATUS_OPTIONS.reduce((acc, s) => { acc[s] = orderList.filter(o => o.status === s).length; return acc }, {})

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Orders Management</h1>
        <button onClick={load} className="flex items-center gap-2 card-glass px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Stats strip */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('ALL')} className={`px-3 py-1.5 rounded-lg text-sm transition ${filter === 'ALL' ? 'bg-white/20 text-white' : 'text-slate-400 hover:text-white'}`}>
          All ({orderList.length})
        </button>
        {STATUS_OPTIONS.map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-sm transition ${filter === s ? 'bg-white/20 text-white' : 'text-slate-500 hover:text-white'}`}>
            {s} ({counts[s]})
          </button>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="card-glass rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-400">No orders found for this filter.</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(order => {
          const nextStatus = getNextStatus(order.status)
          return (
            <div key={order.id} className="card-glass rounded-xl p-4">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold">Order #{order.id}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[order.status]}`}>{order.status}</span>
                  </div>
                  <div className="text-slate-400 text-sm mt-0.5">
                    👤 {order.customer_name} • 📍 {order.station_name} • ⏰ {order.pickup_time}
                  </div>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {order.items?.map(item => (
                      <span key={item.id} className="text-xs bg-white/5 text-slate-300 px-2 py-0.5 rounded-lg">
                        {item.emoji} {item.qty}× {item.name}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-orange-400 font-bold">₹{order.total_amount}</span>
                  {nextStatus && (
                    <button
                      onClick={() => updateStatus(order.id, nextStatus)}
                      disabled={updating === order.id}
                      className="text-xs bg-emerald-600/80 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-medium transition disabled:opacity-50"
                    >
                      {updating === order.id ? '...' : `→ ${nextStatus}`}
                    </button>
                  )}
                  <select
                    value={order.status}
                    onChange={e => updateStatus(order.id, e.target.value)}
                    disabled={updating === order.id}
                    className="text-xs bg-slate-800 border border-white/20 text-slate-300 rounded-lg px-2 py-1.5 focus:outline-none"
                  >
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
