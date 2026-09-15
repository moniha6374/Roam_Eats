import React, { useEffect, useState, useCallback } from 'react'
import { orders as ordersApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { RefreshCw, Package } from 'lucide-react'

const STATUS_STEPS = ['PREORDERED', 'PREPARING', 'ON_ROUTE', 'ARRIVING', 'READY', 'COMPLETED']

const STATUS_COLORS = {
  PREORDERED: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  PREPARING: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  ON_ROUTE: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  ARRIVING: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  READY: 'bg-green-500/20 text-green-300 border-green-500/40',
  COMPLETED: 'bg-slate-500/20 text-slate-400 border-slate-500/40',
}

export default function CustomerOrders() {
  const { user } = useAuth()
  const [orderList, setOrderList] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    ordersApi.list({ customer_id: user.id })
      .then(r => setOrderList(r.data))
      .finally(() => setLoading(false))
  }, [user.id])

  useEffect(() => {
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [load])

  const getStepIndex = (status) => STATUS_STEPS.indexOf(status)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-orange-400" /> My Orders
        </h1>
        <button onClick={load} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {orderList.length === 0 && !loading && (
        <div className="card-glass rounded-2xl p-12 text-center">
          <div className="text-5xl mb-4">🛒</div>
          <p className="text-slate-400">No orders yet. Discover food trucks and place a pre-order!</p>
        </div>
      )}

      {orderList.map(order => (
        <div key={order.id} className="card-glass rounded-2xl p-5 border border-white/10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-white font-bold">{order.truck_name}</h3>
              <p className="text-slate-400 text-sm">📍 {order.station_name} • {order.pickup_time}</p>
              <p className="text-slate-500 text-xs mt-0.5">Order #{order.id} • {new Date(order.created_at).toLocaleTimeString()}</p>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${STATUS_COLORS[order.status]}`}>
                {order.status}
              </span>
              <div className="text-orange-400 font-bold mt-1">₹{order.total_amount}</div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              {STATUS_STEPS.filter(s => s !== 'COMPLETED').map((s, i) => {
                const curIdx = getStepIndex(order.status)
                const stepIdx = getStepIndex(s)
                const done = stepIdx <= curIdx
                const current = s === order.status
                return (
                  <div key={s} className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs transition ${current ? 'bg-orange-500 border-orange-500 text-white' : done ? 'bg-green-500/30 border-green-500 text-green-400' : 'border-slate-600 text-slate-600'}`}>
                      {done && !current ? '✓' : i + 1}
                    </div>
                    {i < STATUS_STEPS.filter(s => s !== 'COMPLETED').length - 1 && (
                      <div className="hidden" />
                    )}
                  </div>
                )
              })}
            </div>
            <div className="flex gap-0">
              {STATUS_STEPS.filter(s => s !== 'COMPLETED').map((s, i, arr) => {
                const curIdx = getStepIndex(order.status)
                const stepIdx = getStepIndex(s)
                const done = stepIdx < curIdx
                return i < arr.length - 1 ? (
                  <div key={s} className={`h-1 flex-1 rounded ${done ? 'bg-green-500/50' : 'bg-slate-700'}`} />
                ) : null
              })}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-1">
            {order.items?.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-slate-300">{item.emoji} {item.qty}× {item.name}</span>
                <span className="text-slate-400">₹{item.price * item.qty}</span>
              </div>
            ))}
          </div>

          {order.status === 'ARRIVING' && (
            <div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-center gap-2">
              <span className="text-orange-400 text-sm font-medium">🚚 Truck is arriving at your station!</span>
            </div>
          )}
          {order.status === 'READY' && (
            <div className="mt-3 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-2">
              <span className="text-green-400 text-sm font-medium">✅ Your order is ready for pickup!</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
