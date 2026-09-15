import React, { useEffect, useState, useCallback } from 'react'
import { owner as ownerApi, simulation } from '../../api'
import { TrendingUp, Package, DollarSign, MapPin, ChevronRight, Zap, RefreshCw, AlertTriangle, Play } from 'lucide-react'
import LiveMap from '../../components/LiveMap'

const TRUCK_ID = 1

function SDSBar({ score, label, status }) {
  const color = score >= 75 ? 'from-red-500 to-orange-500' : score >= 50 ? 'from-yellow-500 to-amber-500' : 'from-blue-500 to-teal-500'
  const badgeColor = score >= 75 ? 'bg-red-500/20 text-red-300' : score >= 50 ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-slate-300 font-medium text-sm">{label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${badgeColor}`}>{status}</span>
          <span className={`font-bold ${score >= 75 ? 'text-red-400' : score >= 50 ? 'text-yellow-400' : 'text-blue-400'}`}>{score}/100</span>
        </div>
      </div>
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

export default function OwnerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [simResult, setSimResult] = useState(null)

  const load = useCallback(() => {
    ownerApi.dashboard(TRUCK_ID).then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 15000)
    return () => clearInterval(interval)
  }, [load])

  const handleSimulate = async () => {
    setSimulating(true)
    try {
      const res = await simulation.nextStop(TRUCK_ID)
      setSimResult(res.data)
      setTimeout(load, 1000)
    } catch (e) { alert('Simulation error') }
    setSimulating(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="text-4xl mb-4 animate-spin">⚙️</div>
        <p className="text-slate-400">Loading AI dashboard...</p>
      </div>
    </div>
  )

  if (!data) return <div className="text-slate-400">Failed to load dashboard.</div>

  const stats = data.stats
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            {data.truck.image_url} {data.truck.name} — Owner Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">{data.truck.cuisine_type} • AI-Powered Intelligence</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-2 card-glass px-4 py-2 rounded-xl text-slate-300 hover:text-white text-sm transition">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> {simulating ? 'Simulating...' : 'Simulate Next Stop'}
          </button>
        </div>
      </div>

      {simResult && (
        <div className={`rounded-xl p-4 border ${simResult.finished ? 'bg-slate-700/20 border-slate-500/40' : 'bg-orange-900/20 border-orange-500/40'}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{simResult.finished ? '🏁' : '🚚'}</span>
            <div>
              <p className="text-white font-semibold">{simResult.message}</p>
              {simResult.new_station && <p className="text-orange-300 text-sm">Arrived at: {simResult.new_station.name} • {simResult.orders_updated} orders updated to ARRIVING</p>}
              {simResult.ai_recommendation && <p className="text-slate-300 text-sm mt-1">{simResult.ai_recommendation}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.total_orders, icon: <Package className="w-5 h-5" />, color: 'from-blue-500/20 to-blue-600/20 border-blue-500/30', text: 'text-blue-400' },
          { label: 'Active Pre-orders', value: stats.active_orders, icon: <Zap className="w-5 h-5" />, color: 'from-orange-500/20 to-red-500/20 border-orange-500/30', text: 'text-orange-400' },
          { label: 'Revenue Today', value: `₹${stats.total_revenue.toFixed(0)}`, icon: <DollarSign className="w-5 h-5" />, color: 'from-green-500/20 to-emerald-500/20 border-green-500/30', text: 'text-green-400' },
          { label: 'Projected', value: `₹${stats.projected_revenue.toFixed(0)}`, icon: <TrendingUp className="w-5 h-5" />, color: 'from-purple-500/20 to-violet-500/20 border-purple-500/30', text: 'text-purple-400' },
        ].map(s => (
          <div key={s.label} className={`card-glass rounded-2xl p-5 bg-gradient-to-br ${s.color} border`}>
            <div className={`${s.text} mb-2`}>{s.icon}</div>
            <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
            <div className="text-slate-400 text-sm">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Current Location */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="card-glass rounded-2xl p-5 border border-orange-500/20">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 font-semibold text-sm">LIVE POSITION</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-slate-400 text-sm">Currently at</p>
              <p className="text-white font-bold text-xl">{data.current_station}</p>
            </div>
          </div>
          {data.next_station && (
            <div className="mt-4 flex items-center gap-3 text-sm">
              <ChevronRight className="w-4 h-4 text-blue-400" />
              <span className="text-slate-400">Next: <span className="text-blue-300 font-medium">{data.next_station}</span> at {data.next_arrival}</span>
            </div>
          )}
        </div>

        <div className="card-glass rounded-2xl p-5 border border-yellow-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-semibold text-sm">ALERTS ({data.alerts?.length || 0})</span>
          </div>
          {data.alerts?.length === 0 ? (
            <p className="text-slate-500 text-sm">No active alerts</p>
          ) : (
            <div className="space-y-2">
              {data.alerts?.slice(0, 3).map((a, i) => (
                <div key={i} className="text-sm">
                  <span className="text-white">{a.icon} {a.message}</span>
                  <p className="text-slate-400 text-xs mt-0.5">→ {a.action}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Station Demand Heatmap */}
      <div className="card-glass rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-5 h-5 text-orange-400" />
          <h2 className="text-white font-bold text-lg">Station Demand Heatmap</h2>
          <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded-full">Demand Prediction Agent</span>
        </div>
        <div className="space-y-4">
          {data.station_demand?.sort((a,b) => b.sds_score - a.sds_score).map(s => (
            <div key={s.station_id}>
              <SDSBar score={s.sds_score} label={`${s.station_name} — ${s.arrival_time}`} status={s.demand_level} />
              <div className="flex gap-4 mt-1 text-xs text-slate-500">
                <span>📦 {s.preorder_count} preorders</span>
                <span>📊 Historical: {s.historical_demand}/100</span>
                <span>⏰ Peak: {s.expected_peak}</span>
                <span className={`font-medium ${s.status === 'current' ? 'text-orange-400' : s.status === 'planned' ? 'text-blue-400' : 'text-slate-500'}`}>● {s.status}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-white/10">
          <div className="grid grid-cols-3 gap-3 text-xs text-center">
            <div className="bg-blue-500/10 rounded-lg p-2">
              <div className="text-blue-400 font-bold">LOW</div>
              <div className="text-slate-500">SDS &lt; 50</div>
            </div>
            <div className="bg-yellow-500/10 rounded-lg p-2">
              <div className="text-yellow-400 font-bold">MEDIUM</div>
              <div className="text-slate-500">SDS 50–74</div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-2">
              <div className="text-red-400 font-bold">🔥 HIGH</div>
              <div className="text-slate-500">SDS ≥ 75</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Map */}
      <div className="card-glass rounded-2xl p-5 border border-white/[0.07]">
        <h2 className="text-white font-bold mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-green-400" /> Live Truck Position
        </h2>
        <LiveMap truckId={TRUCK_ID} showAllTrucks={false} height="320px" />
      </div>

      {/* SDS Formula */}
      <div className="card-glass rounded-2xl p-5 border border-purple-500/20 bg-purple-900/5">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 font-semibold text-sm">Station Demand Score Algorithm</span>
        </div>
        <div className="font-mono text-sm text-slate-300 bg-black/30 rounded-xl p-4">
          SDS = <span className="text-orange-400">0.30</span> × HistoricalDemand + <span className="text-orange-400">0.25</span> × CurrentPreorders +<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-400">0.15</span> × TimeDemand + <span className="text-orange-400">0.15</span> × StationPopularity +<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-400">0.10</span> × RouteAccessibility + <span className="text-orange-400">0.05</span> × FoodCategoryTrend
        </div>
        <p className="text-slate-500 text-xs mt-2">Score normalized between 0–100. Used for route prioritization and preparation recommendations.</p>
      </div>
    </div>
  )
}
