import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { trucks as trucksApi } from '../api'

// Fix default marker icon issue with Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

// Custom truck marker
const createTruckIcon = (emoji, isActive) => L.divIcon({
  html: `<div style="
    background: ${isActive ? 'linear-gradient(135deg,#f97316,#dc2626)' : '#334155'};
    border: 3px solid ${isActive ? '#fff' : '#475569'};
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    width: 42px; height: 42px;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 15px rgba(249,115,22,0.5);
  ">
    <span style="transform:rotate(45deg);font-size:20px;">${emoji}</span>
  </div>`,
  className: '',
  iconSize: [42, 42],
  iconAnchor: [21, 42],
  popupAnchor: [0, -44],
})

const createStationIcon = (status) => L.divIcon({
  html: `<div style="
    background: ${status === 'current' ? '#f97316' : status === 'planned' ? '#3b82f6' : '#475569'};
    border: 2px solid white;
    border-radius: 50%;
    width: 14px; height: 14px;
    box-shadow: 0 0 8px rgba(0,0,0,0.4);
  "></div>`,
  className: '',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
  popupAnchor: [0, -10],
})

function MapUpdater({ center }) {
  const map = useMap()
  useEffect(() => {
    if (center) map.setView(center, 13, { animate: true })
  }, [center, map])
  return null
}

export default function LiveMap({ truckId = null, height = '420px', showAllTrucks = true }) {
  const [truckData, setTruckData] = useState(null)
  const [allTrucks, setAllTrucks] = useState([])
  const [loading, setLoading] = useState(true)
  const CENTER = [11.0168, 76.9558] // Coimbatore

  const load = async () => {
    try {
      if (truckId) {
        const res = await trucksApi.location(truckId)
        setTruckData(res.data)
      }
      if (showAllTrucks) {
        const res = await trucksApi.allLocations()
        setAllTrucks(res.data)
      }
    } catch (e) {
      console.error('Map load error', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 12000)
    return () => clearInterval(interval)
  }, [truckId])

  const routeCoords = truckData?.full_route?.map(r => [r.lat, r.lng]) || []
  const currentCenter = truckData?.current_station
    ? [truckData.current_station.lat, truckData.current_station.lng]
    : null

  if (loading) return (
    <div className="flex items-center justify-center bg-slate-800/50 rounded-2xl border border-white/10" style={{ height }}>
      <div className="text-center">
        <div className="text-4xl mb-2 animate-bounce">🗺️</div>
        <p className="text-slate-400 text-sm">Loading live map...</p>
      </div>
    </div>
  )

  return (
    <div className="relative rounded-2xl overflow-hidden border border-white/10" style={{ height }}>
      {/* Live badge */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-1.5 bg-black/70 backdrop-blur px-3 py-1.5 rounded-full border border-white/20">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-white text-xs font-semibold">LIVE MAP</span>
      </div>
      {/* Refresh badge */}
      <div className="absolute top-3 right-3 z-[1000] bg-black/70 backdrop-blur px-2 py-1 rounded-full border border-white/20 text-slate-400 text-xs">
        Auto-refresh 12s
      </div>

      <MapContainer
        center={currentCenter || CENTER}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {currentCenter && <MapUpdater center={currentCenter} />}

        {/* Route polyline */}
        {routeCoords.length > 1 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{ color: '#f97316', weight: 3, dashArray: '8 6', opacity: 0.8 }}
          />
        )}

        {/* Single truck route stations */}
        {truckData?.full_route?.map((stop, i) => (
          <Marker
            key={i}
            position={[stop.lat, stop.lng]}
            icon={createStationIcon(stop.status)}
          >
            <Popup>
              <div className="text-center p-1">
                <div className="font-bold text-sm">{stop.station_name}</div>
                <div className="text-xs text-gray-500">{stop.arrival_time}</div>
                <div className={`text-xs font-semibold mt-1 ${stop.status === 'current' ? 'text-orange-500' : stop.status === 'planned' ? 'text-blue-500' : 'text-gray-400'}`}>
                  {stop.status.toUpperCase()}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Active truck marker */}
        {truckData?.current_station?.lat && (
          <Marker
            position={[truckData.current_station.lat, truckData.current_station.lng]}
            icon={createTruckIcon(truckData.image_url || '🚚', true)}
          >
            <Popup>
              <div className="p-2 min-w-[160px]">
                <div className="font-bold text-base">{truckData.truck_name}</div>
                <div className="text-orange-600 font-semibold text-sm">📍 {truckData.current_station.name}</div>
                {truckData.next_station && (
                  <div className="text-blue-600 text-xs mt-1">
                    ➡️ Next: {truckData.next_station.name} @ {truckData.next_station.arrival_time}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}

        {/* All trucks (when showAllTrucks) */}
        {showAllTrucks && allTrucks.map(t => (
          <Marker
            key={t.truck_id}
            position={[t.lat, t.lng]}
            icon={createTruckIcon(t.image_url || '🚚', true)}
          >
            <Popup>
              <div className="p-2 min-w-[180px]">
                <div className="font-bold text-base">{t.truck_name}</div>
                <div className="text-gray-500 text-xs">{t.cuisine_type}</div>
                <div className="text-orange-600 font-semibold text-sm mt-1">📍 {t.station_name}</div>
                <div className="text-gray-500 text-xs">Arrives: {t.arrival_time} · Leaves: {t.departure_time}</div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-yellow-500 text-xs">⭐ {t.rating}</span>
                  <span className="text-xs text-gray-500 ml-2">📦 {t.active_orders} orders</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-black/70 backdrop-blur px-3 py-2 rounded-xl border border-white/20 flex gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2.5 h-2.5 bg-orange-500 rounded-full inline-block" />Current
        </span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block" />Planned
        </span>
        <span className="flex items-center gap-1.5 text-slate-300">
          <span className="w-2.5 h-2.5 bg-slate-500 rounded-full inline-block" />Done
        </span>
      </div>
    </div>
  )
}
