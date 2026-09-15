import React, { useEffect, useState, useRef } from 'react'
import { ai as aiApi } from '../../api'
import { Brain, TrendingUp, MapPin, Clock, ShoppingBag, Lightbulb, Send, RefreshCw, Check } from 'lucide-react'

const TRUCK_ID = 1

function AgentCard({ title, badge, icon, color, children, reasoning }) {
  const [showReasoning, setShowReasoning] = useState(false)
  return (
    <div className={`card-glass rounded-2xl p-5 border ${color}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.replace('border-', 'bg-').replace('/30', '/20')}`}>
            {icon}
          </div>
          <span className="text-white font-semibold">{title}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">{badge}</span>
          {reasoning && (
            <button onClick={() => setShowReasoning(!showReasoning)} className="text-xs text-slate-500 hover:text-slate-300 transition">
              {showReasoning ? 'Hide' : 'Reasoning'}
            </button>
          )}
        </div>
      </div>
      {children}
      {showReasoning && reasoning && (
        <div className="mt-4 bg-black/20 rounded-xl p-3">
          <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-semibold">Agent Reasoning Steps</div>
          <div className="space-y-1">
            {reasoning.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function OwnerAICenter() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', text: "Hello! I'm your AI Business Assistant. Ask me about station demand, food preparation, route optimization, or today's insights." }
  ])
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)

  const load = () => {
    setLoading(true)
    aiApi.recommendations(TRUCK_ID).then(r => setData(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory])

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatHistory(prev => [...prev, { role: 'user', text: msg }])
    setChatLoading(true)
    try {
      const res = await aiApi.chat({ truck_id: TRUCK_ID, message: msg })
      setChatHistory(prev => [...prev, { role: 'assistant', text: res.data.response }])
    } catch {
      setChatHistory(prev => [...prev, { role: 'assistant', text: 'Sorry, AI assistant is unavailable right now.' }])
    }
    setChatLoading(false)
  }

  const QUICK_PROMPTS = [
    "Which station should I prioritize?",
    "How many biryanis should I prepare?",
    "Show today's business insights",
    "What is the optimal route?",
  ]

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Brain className="w-12 h-12 text-purple-400 mx-auto mb-3 animate-pulse" />
        <p className="text-slate-400">AI Agents analyzing data...</p>
      </div>
    </div>
  )

  const demand = data?.demand
  const route = data?.route
  const orders = data?.orders
  const business = data?.business

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" /> AI Operations Center
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Multi-agent AI system — 5 specialized agents working in real-time</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 card-glass px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh Agents
        </button>
      </div>

      {/* Agent Pipeline Visual */}
      <div className="card-glass rounded-2xl p-5 bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/20">
        <div className="text-purple-300 font-semibold text-sm mb-4">🤖 Multi-Agent Pipeline</div>
        <div className="flex items-center gap-2 flex-wrap">
          {['📦 Orders + Stations + Routes', '→', '📊 Demand Prediction Agent', '→', '🧮 Station Demand Score', '→', '🗺️ Route Optimization Agent', '→', '📋 Owner Dashboard'].map((step, i) => (
            <span key={i} className={step === '→' ? 'text-slate-500 text-xl' : 'bg-white/5 border border-white/10 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium'}>
              {step}
            </span>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Demand Prediction Agent */}
        <AgentCard title="Demand Prediction Agent" badge="ACTIVE" icon={<TrendingUp className="w-4 h-4 text-orange-400" />} color="border-orange-500/30" reasoning={demand?.reasoning}>
          <p className="text-slate-300 text-sm mb-4">{demand?.agent_message}</p>
          {demand?.station_scores?.slice(0, 3).map(s => (
            <div key={s.station_id} className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-white font-medium">{s.station_name}</span>
                <span className={s.demand_level === 'HIGH' ? 'text-red-400 font-bold' : s.demand_level === 'MEDIUM' ? 'text-yellow-400' : 'text-blue-400'}>{s.sds_score}/100</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-700 ${s.demand_level === 'HIGH' ? 'bg-gradient-to-r from-red-500 to-orange-500' : s.demand_level === 'MEDIUM' ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-blue-500 to-teal-500'}`} style={{ width: `${s.sds_score}%` }} />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{s.preparation_recommendation}</div>
            </div>
          ))}
        </AgentCard>

        {/* Route Optimization Agent */}
        <AgentCard title="Route Optimization Agent" badge="ACTIVE" icon={<MapPin className="w-4 h-4 text-blue-400" />} color="border-blue-500/30" reasoning={route?.reasoning}>
          <p className="text-slate-300 text-sm mb-4">{route?.agent_message}</p>
          {route?.best_next_station && (
            <div className="bg-blue-500/10 rounded-xl p-3 mb-3">
              <div className="text-blue-300 font-semibold text-sm">Recommended Next Stop</div>
              <div className="text-white font-bold text-lg">{route.best_next_station.station_name}</div>
              <div className="text-slate-400 text-xs">Weighted Score: {route.best_next_station.weighted_route_score} • Arrive: {route.best_next_station.arrival_time}</div>
            </div>
          )}
          {route?.needs_reorder && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2 text-yellow-300 text-xs">
              ⚠️ Route reordering recommended for +15% efficiency
            </div>
          )}
        </AgentCard>

        {/* Order Management Agent */}
        <AgentCard title="Order Management Agent" badge="ACTIVE" icon={<ShoppingBag className="w-4 h-4 text-green-400" />} color="border-green-500/30" reasoning={orders?.reasoning}>
          <p className="text-slate-300 text-sm mb-4">{orders?.agent_message}</p>
          <div className="space-y-2">
            {orders?.alerts?.map((alert, i) => (
              <div key={i} className={`text-sm p-2 rounded-lg ${alert.severity === 'HIGH' ? 'bg-red-500/10 border border-red-500/30' : alert.severity === 'MEDIUM' ? 'bg-yellow-500/10 border border-yellow-500/30' : 'bg-blue-500/10 border border-blue-500/30'}`}>
                <span className="font-medium text-white">{alert.icon} {alert.message}</span>
                <div className="text-slate-400 text-xs mt-0.5">→ {alert.action}</div>
              </div>
            ))}
            {orders?.alerts?.length === 0 && <p className="text-slate-500 text-sm">No active alerts</p>}
          </div>
        </AgentCard>

        {/* Business Advisor Agent */}
        <AgentCard title="Business Advisor Agent" badge="ACTIVE" icon={<Lightbulb className="w-4 h-4 text-yellow-400" />} color="border-yellow-500/30" reasoning={business?.reasoning}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-green-400 font-bold text-lg">₹{business?.total_revenue?.toFixed(0)}</div>
              <div className="text-slate-400 text-xs">Earned</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-purple-400 font-bold text-lg">₹{business?.projected_revenue?.toFixed(0)}</div>
              <div className="text-slate-400 text-xs">Projected</div>
            </div>
          </div>
          <div className="space-y-2">
            {business?.recommendations?.slice(0, 3).map((rec, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 text-sm">
                <div className="text-white font-medium">{rec.icon} {rec.title}</div>
                <div className="text-slate-400 text-xs mt-0.5">{rec.insight}</div>
                <div className="text-green-400 text-xs mt-0.5 font-medium">{rec.impact}</div>
              </div>
            ))}
          </div>
        </AgentCard>
      </div>

      {/* AI Chat Assistant */}
      <div className="card-glass rounded-2xl border border-purple-500/20">
        <div className="p-4 border-b border-white/10 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          <Brain className="w-4 h-4 text-purple-400" />
          <span className="text-white font-semibold">AI Business Assistant</span>
          <span className="text-xs text-slate-500 ml-auto">Powered by deterministic AI reasoning</span>
        </div>

        <div className="h-64 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-white/10 text-slate-200'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 rounded-2xl px-4 py-2.5">
                <div className="flex gap-1">
                  {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: `${i*0.1}s`}} />)}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-3 border-t border-white/10">
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_PROMPTS.map(p => (
              <button key={p} onClick={() => { setChatInput(p); setTimeout(() => document.getElementById('chat-input')?.focus(), 100) }} className="text-xs bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white px-2.5 py-1 rounded-lg transition">
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              id="chat-input"
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendChat()}
              placeholder="Ask about demand, preparation, route..."
              className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-purple-500"
            />
            <button onClick={sendChat} disabled={chatLoading} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl transition disabled:opacity-40">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
