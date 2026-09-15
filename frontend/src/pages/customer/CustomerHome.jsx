import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { trucks as trucksApi, stations as stationsApi, notifications as notifApi } from '../../api'
import { MapPin, Clock, Star, TrendingUp, Flame, Zap, ArrowRight, ChevronRight, AlertTriangle, Bell } from 'lucide-react'
import LiveMap from '../../components/LiveMap'

function DemandBadge({ level }) {
  const styles = {
    HIGH: 'badge-high',
    MEDIUM: 'badge-medium',
    LOW: 'badge-low',
  }
  return (
    <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${styles[level] || styles.LOW}`}>
      {level === 'HIGH' && '🔥 '}{level}
    </span>
  )
}

export default function CustomerHome() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [truckList, setTruckList] = useState([])
  const [stationList, setStationList] = useState([])
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      trucksApi.list(),
      stationsApi.list(),
      notifApi.customer(user.id)
    ]).then(([t, s, n]) => {
      setTruckList(t.data)
      setStationList(s.data)
      setNotifs(n.data.notifications || [])
    }).finally(() => setLoading(false))
  }, [user.id])

  const getDemandLevel = (p) => p >= 80 ? 'HIGH' : p >= 60 ? 'MEDIUM' : 'LOW'

  return (
    <div className="max-w-6xl mx-auto space-y-8 slide-up">

      {/* Notifications Banner */}
      {notifs.filter(n => n.severity === 'HIGH').length > 0 && (
        <div className="space-y-2">
          {notifs.filter(n => n.severity === 'HIGH').map((n, i) => (
            <div key={i} className={`flex items-start gap-3 rounded-2xl px-4 py-3 border ${n.type === 'SOLD_OUT' ? 'bg-red-500/10 border-red-500/30' : n.type === 'ARRIVING' ? 'bg-orange-500/10 border-orange-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
              <span className="text-xl flex-shrink-0">{n.icon}</span>
              <div>
                <div className="text-white font-semibold text-sm">{n.title}</div>
                <div className="text-slate-300 text-xs">{n.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] p-8" style={{ background: 'linear-gradient(135deg, rgba(124,179,66,0.08) 0%, rgba(230,81,0,0.06) 100%)' }}>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-green-500/5" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 font-semibold text-sm">AI Active — {truckList.length} trucks online</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-3 leading-tight">
            Hey <span className="brand-gradient-text">{user?.name?.split(' ')[0]}!</span><br />
            Hungry? Your truck is nearby.
          </h1>
          <p className="text-slate-400 text-base mb-6 max-w-lg">
            Pre-order now and pick up the moment your truck arrives. No waiting, no guessing.
          </p>
          <div className="flex gap-3 flex-wrap">
            <button onClick={() => navigate('/customer/discover')}
              className="btn-brand flex items-center gap-2 text-white font-bold px-6 py-3 rounded-xl">
              <Zap className="w-4 h-4" /> Find Food with AI
            </button>
            <button onClick={() => navigate('/customer/trucks')}
              className="card-glass flex items-center gap-2 text-white px-6 py-3 rounded-xl hover:bg-white/10 transition border border-white/10">
              Live Map <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="absolute right-8 top-6 text-7xl opacity-10 float">🚚</div>
      </div>

      {/* Live Map */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-green-400" /> Live Truck Locations
          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30 ml-2">LIVE</span>
        </h2>
        <LiveMap showAllTrucks={true} height="380px" />
      </div>

      {/* Stations */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-orange-400" /> Active Stations
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {stationList.map(s => (
            <div key={s.id} className="card-glass-hover rounded-2xl p-4 cursor-pointer border border-white/[0.06]">
              <div className="text-2xl mb-2">📍</div>
              <div className="text-white font-semibold text-sm leading-tight">{s.name}</div>
              <div className="text-slate-500 text-xs mt-1 truncate">{s.location}</div>
              <div className="mt-2"><DemandBadge level={getDemandLevel(s.popularity_score)} /></div>
            </div>
          ))}
        </div>
      </div>

      {/* Trucks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-400" /> Food Trucks
          </h2>
          <button onClick={() => navigate('/customer/trucks')} className="text-green-400 hover:text-green-300 text-sm flex items-center gap-1 transition">
            View all <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {loading ? [1,2,3].map(i => <div key={i} className="card-glass rounded-2xl h-52 animate-pulse" />) :
            truckList.map(truck => (
              <div key={truck.id} onClick={() => navigate('/customer/trucks')}
                className="card-glass-hover rounded-2xl p-5 cursor-pointer border border-white/[0.06] group">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-5xl">{truck.image_url}</div>
                  <div className="flex items-center gap-1 text-yellow-400 text-sm">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="font-semibold">{truck.rating}</span>
                  </div>
                </div>
                <h3 className="text-white font-bold text-lg">{truck.name}</h3>
                <p className="text-slate-500 text-sm">{truck.cuisine_type}</p>
                <div className="mt-3 space-y-1.5">
                  {truck.current_station && (
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                      Now at <span className="text-white font-medium ml-0.5">{truck.current_station}</span>
                    </div>
                  )}
                  {truck.next_station && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span className="text-blue-300">{truck.next_station}</span> · {truck.next_arrival}
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-600">🥗 {truck.veg_count} veg</span>
                  <span className="text-green-400 text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Pre-order <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* AI Tip */}
      <div className="card-glass rounded-2xl p-5 border border-purple-500/20" style={{ background: 'rgba(139,92,246,0.05)' }}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span className="text-purple-300 font-semibold text-sm">AI Station Insight</span>
        </div>
        <p className="text-white font-medium text-sm">IT Park has the highest demand score right now (SDS: 87/100).</p>
        <p className="text-slate-500 text-xs mt-1">Spice Route & Green Bites are both heading there. Pre-order now to skip the queue.</p>
        <button onClick={() => navigate('/customer/discover')} className="mt-3 text-purple-400 hover:text-purple-300 text-xs flex items-center gap-1 transition">
          Get AI recommendation <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
