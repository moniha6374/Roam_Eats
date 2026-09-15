import React, { useEffect, useState } from 'react'
import { routes as routesApi, stations as stationsApi, simulation, ai as aiApi } from '../../api'
import { MapPin, Clock, Play, Zap, TrendingUp } from 'lucide-react'

const TRUCK_ID = 1

export default function OwnerTruck() {
  const [routeList, setRouteList] = useState([])
  const [stationList, setStationList] = useState([])
  const [simulating, setSimulating] = useState(false)
  const [simResult, setSimResult] = useState(null)
  const [whatifStation, setWhatifStation] = useState(null)
  const [whatifResult, setWhatifResult] = useState(null)
  const [whatifLoading, setWhatifLoading] = useState(false)

  const load = () => {
    routesApi.list(TRUCK_ID).then(r => setRouteList(r.data))
    stationsApi.list().then(r => setStationList(r.data))
  }

  useEffect(() => { load() }, [])

  const handleSimulate = async () => {
    setSimulating(true)
    try {
      const res = await simulation.nextStop(TRUCK_ID)
      setSimResult(res.data)
      setTimeout(load, 800)
    } catch { alert('Failed') }
    setSimulating(false)
  }

  const runWhatIf = async () => {
    if (!whatifStation) return
    setWhatifLoading(true)
    try {
      const res = await aiApi.whatif(TRUCK_ID, whatifStation)
      setWhatifResult(res.data)
    } catch { }
    setWhatifLoading(false)
  }

  const statusStyle = (s) => ({
    completed: { dot: 'bg-slate-600', text: 'text-slate-500', badge: 'bg-slate-700 text-slate-400', line: 'bg-slate-700' },
    current: { dot: 'bg-orange-500 animate-pulse', text: 'text-orange-400', badge: 'bg-orange-500/20 text-orange-300', line: 'bg-orange-500/30' },
    planned: { dot: 'bg-blue-500', text: 'text-blue-300', badge: 'bg-blue-500/20 text-blue-300', line: 'bg-blue-500/20' },
  }[s] || {})

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">My Truck & Route</h1>
        <button
          onClick={handleSimulate}
          disabled={simulating}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
        >
          <Play className="w-4 h-4" /> {simulating ? 'Moving...' : '▶ Simulate Next Stop'}
        </button>
      </div>

      {simResult && (
        <div className={`rounded-xl p-4 border ${simResult.finished ? 'bg-slate-800/40 border-slate-600' : 'bg-orange-900/20 border-orange-500/40'}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">{simResult.finished ? '🏁' : '🚚'}</span>
            <div>
              <p className="text-white font-semibold">{simResult.message}</p>
              {simResult.new_station && <p className="text-orange-300 text-sm mt-1">📍 {simResult.new_station.name} • {simResult.orders_updated} orders → ARRIVING</p>}
              {simResult.ai_recommendation && <p className="text-slate-400 text-xs mt-1 italic">{simResult.ai_recommendation}</p>}
            </div>
          </div>
        </div>
      )}

      {/* Journey Tracker */}
      <div className="card-glass rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-5 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-400" /> Today's Planned Journey
        </h2>
        <div className="relative">
          {routeList.map((r, i) => {
            const style = statusStyle(r.status)
            return (
              <div key={r.id} className="flex gap-4 mb-6">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 border-2 ${r.status === 'current' ? 'bg-orange-500/20 border-orange-500 text-orange-400' : r.status === 'completed' ? 'bg-slate-700 border-slate-600 text-slate-400' : 'bg-blue-500/10 border-blue-500 text-blue-400'}`}>
                    {r.status === 'current' ? '▶' : r.status === 'completed' ? '✓' : r.sequence}
                  </div>
                  {i < routeList.length - 1 && <div className={`w-0.5 flex-1 mt-2 ${style.line || 'bg-slate-700'}`} style={{ minHeight: '24px' }} />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className={`font-semibold ${style.text}`}>{r.station_name}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{r.arrival_time} – {r.departure_time}</span>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold ${style.badge}`}>
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* What-If Simulation */}
      <div className="card-glass rounded-2xl p-6 border border-purple-500/20">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-purple-400" />
          <h2 className="text-white font-semibold">What-If Station Simulator</h2>
          <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded-full">AI</span>
        </div>
        <p className="text-slate-400 text-sm mb-4">Simulate revenue impact of moving to a different station.</p>

        <div className="flex gap-3 flex-wrap">
          <select
            value={whatifStation || ''}
            onChange={e => setWhatifStation(Number(e.target.value))}
            className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-purple-500 min-w-48"
          >
            <option value="">Select a station...</option>
            {stationList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button
            onClick={runWhatIf}
            disabled={!whatifStation || whatifLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-40"
          >
            {whatifLoading ? 'Analyzing...' : '🔮 Analyze'}
          </button>
        </div>

        {whatifResult && (
          <div className="mt-5 bg-black/20 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold text-lg">{whatifResult.station_name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${whatifResult.demand_level === 'HIGH' ? 'bg-red-500/20 text-red-300' : whatifResult.demand_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-300'}`}>
                SDS: {whatifResult.sds_score}/100
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-slate-400 text-xs mb-1">Current Revenue</div>
                <div className="text-white font-bold text-lg">₹{whatifResult.current_revenue}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-xs mb-1">Predicted Revenue</div>
                <div className="text-green-400 font-bold text-lg">₹{whatifResult.predicted_revenue}</div>
              </div>
              <div className="text-center">
                <div className="text-slate-400 text-xs mb-1">Opportunity</div>
                <div className={`font-bold text-lg ${whatifResult.opportunity_percent > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  +{whatifResult.opportunity_percent}%
                </div>
              </div>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all" style={{ width: `${Math.min(whatifResult.opportunity_percent, 100)}%` }} />
            </div>
            <p className="text-slate-300 text-sm">{whatifResult.agent_message}</p>
          </div>
        )}
      </div>
    </div>
  )
}
