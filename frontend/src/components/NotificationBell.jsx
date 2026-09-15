import React, { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { notifications as notifApi } from '../api'

export default function NotificationBell({ customerId }) {
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const ref = useRef(null)

  const load = async () => {
    try {
      const res = await notifApi.customer(customerId)
      setNotifs(res.data.notifications || [])
      setUnread(res.data.count || 0)
    } catch {}
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [customerId])

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const severityColor = (s) => ({
    HIGH: 'border-l-red-500 bg-red-500/5',
    MEDIUM: 'border-l-yellow-500 bg-yellow-500/5',
    LOW: 'border-l-blue-500 bg-blue-500/5',
    INFO: 'border-l-purple-500 bg-purple-500/5',
  }[s] || 'border-l-slate-500 bg-slate-500/5')

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen(!open); setUnread(0) }}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition text-slate-300 hover:text-white"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 bg-slate-900 border border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-white font-semibold text-sm">Notifications</span>
            <button onClick={load} className="text-slate-500 hover:text-white text-xs transition">Refresh</button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="p-6 text-center">
                <div className="text-3xl mb-2">🔔</div>
                <p className="text-slate-500 text-sm">All caught up! No notifications.</p>
              </div>
            ) : (
              notifs.map((n, i) => (
                <div key={i} className={`px-4 py-3 border-b border-white/5 border-l-4 ${severityColor(n.severity)}`}>
                  <div className="flex gap-2">
                    <span className="text-lg flex-shrink-0 mt-0.5">{n.icon}</span>
                    <div>
                      <div className="text-white font-semibold text-sm">{n.title}</div>
                      <div className="text-slate-300 text-xs mt-0.5">{n.message}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{n.detail}</div>
                      <div className="text-slate-600 text-xs mt-1">{n.timestamp}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
