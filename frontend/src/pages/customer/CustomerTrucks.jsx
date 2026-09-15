import React, { useEffect, useState } from 'react'
import { trucks as trucksApi, menu as menuApi, routes as routesApi, orders as ordersApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { Star, MapPin, Clock, ShoppingCart, ChevronRight, AlertTriangle, CheckCircle } from 'lucide-react'
import LiveMap from '../../components/LiveMap'

export default function CustomerTrucks() {
  const { user } = useAuth()
  const [truckList, setTruckList] = useState([])
  const [selected, setSelected] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [truckRoutes, setTruckRoutes] = useState([])
  const [cart, setCart] = useState([])
  const [stationId, setStationId] = useState(null)
  const [pickupTime, setPickupTime] = useState('')
  const [ordering, setOrdering] = useState(false)
  const [orderDone, setOrderDone] = useState(null)
  const [activeTab, setActiveTab] = useState('menu') // 'menu' | 'map'

  useEffect(() => { trucksApi.list().then(r => setTruckList(r.data)) }, [])

  const openTruck = async (truck) => {
    setSelected(truck); setCart([]); setOrderDone(null); setActiveTab('menu')
    const [m, r] = await Promise.all([menuApi.get(truck.id), routesApi.list(truck.id)])
    setMenuItems(m.data); setTruckRoutes(r.data)
    const cur = r.data.find(x => x.status === 'current') || r.data[0]
    if (cur) { setStationId(cur.station_id); setPickupTime(cur.arrival_time) }
  }

  const addToCart = (item) => setCart(prev => {
    const e = prev.find(c => c.id === item.id)
    return e ? prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c) : [...prev, { ...item, qty: 1 }]
  })
  const removeFromCart = (item) => setCart(prev => {
    const e = prev.find(c => c.id === item.id)
    return !e || e.qty <= 1 ? prev.filter(c => c.id !== item.id) : prev.map(c => c.id === item.id ? { ...c, qty: c.qty - 1 } : c)
  })

  const placeOrder = async () => {
    setOrdering(true)
    try {
      const res = await ordersApi.create({
        customer_id: user.id, truck_id: selected.id, station_id: stationId, pickup_time: pickupTime,
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.qty }))
      })
      setOrderDone(res.data); setCart([])
    } catch { alert('Order failed') }
    setOrdering(false)
  }

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0)

  const statusStyle = (s) => ({
    completed: 'bg-slate-700 border-slate-600 text-slate-400',
    current: 'bg-orange-500/20 border-orange-500 text-orange-400 ring-2 ring-orange-500/30',
    planned: 'bg-blue-500/10 border-blue-500 text-blue-400',
  }[s] || 'border-slate-600')

  if (selected) return (
    <div className="max-w-4xl mx-auto space-y-5 slide-up">
      <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-sm flex items-center gap-1 transition">
        ← Back to trucks
      </button>

      {orderDone ? (
        <div className="card-glass rounded-3xl p-10 text-center border border-green-500/30">
          <div className="text-7xl mb-4 float">🎉</div>
          <h2 className="text-2xl font-black text-white mb-2">Order Confirmed!</h2>
          <p className="text-slate-400 mb-1">Order <span className="text-white font-bold">#{orderDone.id}</span></p>
          <p className="text-slate-300">📍 <span className="text-orange-400 font-semibold">{orderDone.station_name}</span> · ⏰ {orderDone.pickup_time}</p>
          <p className="text-2xl font-black text-green-400 mt-3">₹{orderDone.total_amount}</p>
          <div className="flex justify-center gap-3 mt-6">
            <button onClick={() => setOrderDone(null)} className="btn-brand text-white px-6 py-2.5 rounded-xl font-semibold">Order More</button>
            <button onClick={() => setSelected(null)} className="card-glass text-slate-300 px-6 py-2.5 rounded-xl border border-white/10">Back</button>
          </div>
        </div>
      ) : (
        <>
          {/* Truck header */}
          <div className="card-glass rounded-2xl p-5 border border-white/[0.07]">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{selected.image_url}</div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-white">{selected.name}</h2>
                <p className="text-slate-400 text-sm">{selected.cuisine_type} · {selected.description}</p>
                <div className="flex items-center gap-1 mt-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-current" /><span className="text-yellow-400 font-semibold text-sm">{selected.rating}</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setActiveTab('menu')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'menu' ? 'btn-brand text-white' : 'card-glass text-slate-400'}`}>🍽️ Menu</button>
                <button onClick={() => setActiveTab('map')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${activeTab === 'map' ? 'btn-brand text-white' : 'card-glass text-slate-400'}`}>🗺️ Live Map</button>
              </div>
            </div>
          </div>

          {activeTab === 'map' && (
            <div className="space-y-4">
              <LiveMap truckId={selected.id} showAllTrucks={false} height="380px" />
              {/* Journey */}
              <div className="card-glass rounded-2xl p-5 border border-white/[0.07]">
                <h3 className="text-white font-semibold mb-4">Today's Route</h3>
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {truckRoutes.map((r, i) => (
                    <React.Fragment key={r.id}>
                      <button onClick={() => { setStationId(r.station_id); setPickupTime(r.arrival_time); setActiveTab('menu') }}
                        className={`flex flex-col items-center gap-1.5 flex-shrink-0 p-3 rounded-xl border transition min-w-[100px] ${stationId === r.station_id ? 'border-orange-500 bg-orange-500/15' : statusStyle(r.status)}`}>
                        <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold ${statusStyle(r.status)}`}>
                          {r.status === 'current' ? '▶' : r.status === 'completed' ? '✓' : r.sequence}
                        </div>
                        <div className="text-xs font-medium text-white text-center leading-tight">{r.station_name}</div>
                        <div className="text-xs text-slate-500">{r.arrival_time}</div>
                      </button>
                      {i < truckRoutes.length - 1 && <div className="text-slate-600 text-lg flex-shrink-0">→</div>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'menu' && (
            <>
              {/* Station selector */}
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                {truckRoutes.map(r => (
                  <button key={r.id} onClick={() => { setStationId(r.station_id); setPickupTime(r.arrival_time) }}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition border ${stationId === r.station_id ? 'btn-brand text-white border-transparent' : 'card-glass text-slate-400 border-white/10 hover:text-white'}`}>
                    📍 {r.station_name} · {r.arrival_time}
                    {r.status === 'current' && <span className="ml-1 text-xs text-green-400">●</span>}
                  </button>
                ))}
              </div>

              {/* Menu grid */}
              <div className="grid md:grid-cols-2 gap-3">
                {menuItems.map(item => {
                  const inCart = cart.find(c => c.id === item.id)
                  return (
                    <div key={item.id} className={`card-glass rounded-2xl p-4 flex items-center justify-between border border-white/[0.06] transition ${!item.is_available ? 'opacity-50' : 'hover:bg-white/[0.06]'}`}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <span className="text-3xl">{item.image_emoji}</span>
                          {!item.is_available && (
                            <span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center">✕</span>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-semibold text-sm">{item.name}</span>
                            {item.is_vegetarian && <span className="text-xs text-green-400 bg-green-500/10 px-1.5 rounded">🌿</span>}
                          </div>
                          <div className="text-slate-500 text-xs">{item.category}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-orange-400 font-bold">₹{item.price}</span>
                            {!item.is_available && <span className="text-red-400 text-xs font-semibold flex items-center gap-0.5"><AlertTriangle className="w-3 h-3" /> Sold Out</span>}
                          </div>
                        </div>
                      </div>
                      {item.is_available && (
                        inCart ? (
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeFromCart(item)} className="w-7 h-7 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 font-bold flex items-center justify-center">−</button>
                            <span className="text-white font-bold w-4 text-center">{inCart.qty}</span>
                            <button onClick={() => addToCart(item)} className="w-7 h-7 bg-green-500/20 hover:bg-green-500/40 rounded-lg text-green-400 font-bold flex items-center justify-center">+</button>
                          </div>
                        ) : (
                          <button onClick={() => addToCart(item)} className="flex items-center gap-1 bg-orange-500/15 hover:bg-orange-500/30 text-orange-400 px-3 py-1.5 rounded-xl text-sm font-medium transition">
                            <ShoppingCart className="w-3.5 h-3.5" /> Add
                          </button>
                        )
                      )}
                    </div>
                  )
                })}
              </div>

              {cart.length > 0 && (
                <div className="sticky bottom-4 card-glass rounded-2xl p-4 border border-orange-500/30 shadow-2xl" style={{ background: 'rgba(230,81,0,0.1)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold">{cart.reduce((s,c)=>s+c.qty,0)} items · {truckRoutes.find(r=>r.station_id===stationId)?.station_name}</span>
                    <span className="text-orange-400 font-black text-xl">₹{cartTotal}</span>
                  </div>
                  <button onClick={placeOrder} disabled={ordering}
                    className="w-full btn-brand text-white font-black py-3.5 rounded-xl disabled:opacity-50 text-base">
                    {ordering ? '⏳ Placing...' : `🚀 Pre-Order Now — ₹${cartTotal}`}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto space-y-5 slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Food Trucks</h1>
        <span className="text-slate-500 text-sm">{truckList.length} trucks active</span>
      </div>
      <LiveMap showAllTrucks={true} height="300px" />
      <div className="grid md:grid-cols-2 gap-4">
        {truckList.map(truck => (
          <div key={truck.id} onClick={() => openTruck(truck)}
            className="card-glass-hover rounded-2xl p-5 cursor-pointer border border-white/[0.06] group">
            <div className="flex items-start justify-between mb-4">
              <div className="text-5xl">{truck.image_url}</div>
              <div className="flex items-center gap-1 text-yellow-400"><Star className="w-4 h-4 fill-current" /><span className="font-bold">{truck.rating}</span></div>
            </div>
            <h3 className="text-white font-black text-lg">{truck.name}</h3>
            <p className="text-slate-500 text-sm">{truck.cuisine_type} · {truck.description}</p>
            <div className="mt-3 space-y-1.5">
              {truck.current_station && (
                <div className="flex items-center gap-2 text-xs">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-slate-400">Now at <span className="text-white font-semibold">{truck.current_station}</span></span>
                </div>
              )}
              {truck.next_station && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Clock className="w-3 h-3 text-blue-400" />
                  <span className="text-blue-300">{truck.next_station}</span> at {truck.next_arrival}
                </div>
              )}
            </div>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-600">🥗 {truck.veg_count} veg · 🍽️ {truck.menu_count} items</span>
              <span className="text-green-400 text-xs font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
                Order <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
