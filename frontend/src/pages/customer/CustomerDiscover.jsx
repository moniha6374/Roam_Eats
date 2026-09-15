import React, { useState } from 'react'
import { ai, menu as menuApi, orders as ordersApi } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { Sparkles, Brain, MapPin, Clock, Star, Check, ShoppingCart, ChevronDown, ChevronUp } from 'lucide-react'

const FOOD_OPTIONS = ['Vegetarian', 'Biryani', 'Burger', 'South Indian', 'Dosa', 'Wrap', 'Fast Food']
const TIME_OPTIONS = ['11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']

function AgentStep({ step, label, done }) {
  return (
    <div className={`flex items-center gap-2 text-sm transition-all ${done ? 'text-green-400' : 'text-slate-500'}`}>
      <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-500/20 border-green-500' : 'border-slate-600'}`}>
        {done ? <Check className="w-3 h-3" /> : <span className="text-xs">{step}</span>}
      </div>
      {label}
    </div>
  )
}

export default function CustomerDiscover() {
  const { user } = useAuth()
  const [preference, setPreference] = useState('')
  const [timePreference, setTimePreference] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [agentSteps, setAgentSteps] = useState([])
  const [selectedTruck, setSelectedTruck] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [cart, setCart] = useState([])
  const [ordering, setOrdering] = useState(false)
  const [orderConfirm, setOrderConfirm] = useState(null)
  const [showBreakdown, setShowBreakdown] = useState({})

  const runDiscovery = async () => {
    if (!preference && !timePreference) return
    setLoading(true)
    setResult(null)
    setAgentSteps([])
    setSelectedTruck(null)
    setOrderConfirm(null)

    const steps = [
      'Analyzing customer preferences...',
      'Scanning active truck routes...',
      'Computing recommendation scores...',
      'Applying station demand weights...',
      'Ranking results by opportunity score...',
    ]
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 300))
      setAgentSteps(prev => [...prev, steps[i]])
    }

    try {
      const res = await ai.discover({
        preference,
        time_preference: timePreference.replace(' AM', '').replace(' PM', '').replace(':00 ', ':').replace('1:00', '13:00').replace('2:00', '14:00').replace('3:00', '15:00').replace('4:00', '16:00').replace('11:00', '11').replace('12:00', '12'),
      })
      setResult(res.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const loadMenu = async (truckId) => {
    const res = await menuApi.get(truckId)
    setMenuItems(res.data)
  }

  const selectTruck = async (rec) => {
    setSelectedTruck(rec)
    setCart([])
    await loadMenu(rec.truck_id)
  }

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const removeFromCart = (item) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (!existing || existing.qty <= 1) return prev.filter(c => c.id !== item.id)
      return prev.map(c => c.id === item.id ? { ...c, qty: c.qty - 1 } : c)
    })
  }

  const placeOrder = async () => {
    if (!selectedTruck || cart.length === 0) return
    setOrdering(true)
    try {
      const res = await ordersApi.create({
        customer_id: user.id,
        truck_id: selectedTruck.truck_id,
        station_id: selectedTruck.recommended_station_id,
        pickup_time: selectedTruck.arrival_time,
        items: cart.map(c => ({ menu_item_id: c.id, quantity: c.qty }))
      })
      setOrderConfirm(res.data)
      setCart([])
    } catch (e) {
      alert('Order failed. Please try again.')
    }
    setOrdering(false)
  }

  const cartTotal = cart.reduce((s, c) => s + c.price * c.qty, 0)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          AI Food Finder
        </h1>
        <p className="text-slate-400 mt-1">Tell the AI what you want — it'll find the best truck, station and time for you.</p>
      </div>

      {/* Search */}
      <div className="card-glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Brain className="w-5 h-5 text-purple-400" />
          <span className="text-white font-semibold">Customer Discovery Agent</span>
          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">AI</span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-slate-300 text-sm mb-2">Food Preference</label>
            <div className="flex flex-wrap gap-2">
              {FOOD_OPTIONS.map(opt => (
                <button
                  key={opt}
                  onClick={() => setPreference(preference === opt ? '' : opt)}
                  className={`px-3 py-1.5 rounded-lg text-sm transition border ${
                    preference === opt
                      ? 'bg-purple-500/30 border-purple-500 text-purple-300'
                      : 'border-white/20 text-slate-400 hover:text-white hover:border-white/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={preference}
              onChange={e => setPreference(e.target.value)}
              placeholder="Or type custom preference..."
              className="mt-2 w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-2">Preferred Time</label>
            <div className="grid grid-cols-3 gap-2">
              {TIME_OPTIONS.map(t => (
                <button
                  key={t}
                  onClick={() => setTimePreference(timePreference === t ? '' : t)}
                  className={`px-2 py-2 rounded-lg text-sm transition border ${
                    timePreference === t
                      ? 'bg-orange-500/30 border-orange-500 text-orange-300'
                      : 'border-white/20 text-slate-400 hover:text-white'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={runDiscovery}
          disabled={loading || (!preference && !timePreference)}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-40"
        >
          {loading ? '🤖 AI Agent Working...' : '🤖 Find My Best Match'}
        </button>

        {/* Agent Steps */}
        {agentSteps.length > 0 && (
          <div className="mt-4 bg-black/20 rounded-xl p-4 space-y-2">
            <div className="text-xs text-slate-500 font-semibold mb-3 uppercase tracking-wide">Agent Reasoning</div>
            {agentSteps.map((step, i) => (
              <AgentStep key={i} step={i + 1} label={step} done={true} />
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {result && !selectedTruck && (
        <div className="space-y-4">
          {/* AI Message */}
          <div className="card-glass rounded-xl p-4 border border-purple-500/30 bg-purple-900/10">
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-purple-200 text-sm leading-relaxed">{result.agent_message}</p>
            </div>
          </div>

          <h3 className="text-white font-semibold">AI-Ranked Recommendations</h3>
          {result.recommendations.map((rec, i) => (
            <div
              key={rec.truck_id}
              onClick={() => selectTruck(rec)}
              className={`card-glass rounded-2xl p-5 cursor-pointer hover:bg-white/10 transition border ${i === 0 ? 'border-orange-500/50 bg-orange-900/10' : 'border-white/10'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{rec.image_url || '🚚'}</div>
                  <div>
                    {i === 0 && (
                      <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full border border-orange-500/30 mb-2 inline-block">
                        🏆 Top Recommendation
                      </span>
                    )}
                    <h3 className="text-white font-bold text-lg">{rec.truck_name}</h3>
                    <p className="text-slate-400 text-sm">{rec.cuisine_type}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-yellow-400 text-sm">{rec.rating}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-400">{rec.recommendation_score}</div>
                  <div className="text-slate-500 text-xs">Score/100</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-orange-400" />
                  <span className="text-slate-300">{rec.recommended_station}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300">Arrives {rec.arrival_time}</span>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {rec.reasons.slice(0, 3).map((r, ri) => (
                  <span key={ri} className="text-xs bg-white/5 text-slate-300 px-2 py-1 rounded-lg">✓ {r}</span>
                ))}
              </div>

              <div className="mt-3 flex justify-between items-center text-sm">
                <span className="text-slate-500">🥗 {rec.vegetarian_options} veg options • ⏱ {rec.waiting_time_min}min wait</span>
                <span className="text-orange-400 font-medium">Select & Order →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Selected Truck — Menu & Order */}
      {selectedTruck && !orderConfirm && (
        <div className="space-y-4">
          <button onClick={() => setSelectedTruck(null)} className="text-slate-400 hover:text-white text-sm flex items-center gap-1">
            ← Back to results
          </button>

          <div className="card-glass rounded-2xl p-5 border border-orange-500/30">
            <div className="flex items-center gap-4">
              <div className="text-5xl">{selectedTruck.image_url}</div>
              <div>
                <h2 className="text-white font-bold text-xl">{selectedTruck.truck_name}</h2>
                <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-orange-400" />{selectedTruck.recommended_station}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-blue-400" />Arrives {selectedTruck.arrival_time}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {menuItems.filter(m => m.is_available).map(item => {
              const inCart = cart.find(c => c.id === item.id)
              return (
                <div key={item.id} className="card-glass rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.image_emoji}</span>
                    <div>
                      <div className="text-white font-medium text-sm">{item.name}</div>
                      <div className="text-slate-400 text-xs">{item.category} {item.is_vegetarian ? '• 🌿 Veg' : ''}</div>
                      <div className="text-orange-400 font-semibold mt-0.5">₹{item.price}</div>
                    </div>
                  </div>
                  {inCart ? (
                    <div className="flex items-center gap-2">
                      <button onClick={() => removeFromCart(item)} className="w-7 h-7 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400 flex items-center justify-center font-bold">−</button>
                      <span className="text-white font-bold w-5 text-center">{inCart.qty}</span>
                      <button onClick={() => addToCart(item)} className="w-7 h-7 bg-orange-500/20 hover:bg-orange-500/40 rounded-lg text-orange-400 flex items-center justify-center font-bold">+</button>
                    </div>
                  ) : (
                    <button onClick={() => addToCart(item)} className="flex items-center gap-1 bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 px-3 py-1.5 rounded-lg text-sm transition">
                      <ShoppingCart className="w-3 h-3" /> Add
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {cart.length > 0 && (
            <div className="sticky bottom-4 card-glass rounded-2xl p-4 border border-orange-500/40 bg-orange-900/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold">{cart.reduce((s,c)=>s+c.qty,0)} items in cart</span>
                <span className="text-orange-400 font-bold text-lg">₹{cartTotal}</span>
              </div>
              <div className="space-y-1 mb-3">
                {cart.map(c => (
                  <div key={c.id} className="flex justify-between text-sm text-slate-300">
                    <span>{c.qty}× {c.name}</span>
                    <span>₹{c.price * c.qty}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={placeOrder}
                disabled={ordering}
                className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50"
              >
                {ordering ? 'Placing Order...' : `🚀 Place Pre-Order — ₹${cartTotal}`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Order Confirmation */}
      {orderConfirm && (
        <div className="card-glass rounded-2xl p-8 text-center border border-green-500/40 bg-green-900/10">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Order Confirmed!</h2>
          <div className="space-y-2 mb-6 text-slate-300">
            <p>Order #{orderConfirm.id} • <strong className="text-white">{orderConfirm.truck_name}</strong></p>
            <p>📍 Pickup at <strong className="text-orange-400">{orderConfirm.station_name}</strong> at <strong className="text-orange-400">{orderConfirm.pickup_time}</strong></p>
            <p className="text-xl font-bold text-white mt-2">Total: ₹{orderConfirm.total_amount}</p>
          </div>

          {/* Status Track */}
          <div className="flex items-center justify-between max-w-md mx-auto mb-6">
            {['PREORDERED', 'PREPARING', 'ON ROUTE', 'ARRIVING', 'READY'].map((s, i) => (
              <div key={s} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 ${i === 0 ? 'bg-orange-500 border-orange-500 text-white' : 'border-white/20 text-slate-500'}`}>
                  {i === 0 ? '✓' : i + 1}
                </div>
                <span className={`text-xs ${i === 0 ? 'text-orange-400' : 'text-slate-600'}`}>{s}</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => { setOrderConfirm(null); setSelectedTruck(null); setResult(null) }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-semibold transition"
          >
            Place Another Order
          </button>
        </div>
      )}
    </div>
  )
}
