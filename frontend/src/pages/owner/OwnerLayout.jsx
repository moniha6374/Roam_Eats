import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { LayoutDashboard, Truck, UtensilsCrossed, Package, Brain, BarChart3, LogOut, Menu } from 'lucide-react'
import RoameatsLogo from '../../components/RoameatsLogo'

const navItems = [
  { to: '/owner', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Dashboard', end: true },
  { to: '/owner/truck', icon: <Truck className="w-5 h-5" />, label: 'Truck & Route' },
  { to: '/owner/menu', icon: <UtensilsCrossed className="w-5 h-5" />, label: 'Menu' },
  { to: '/owner/orders', icon: <Package className="w-5 h-5" />, label: 'Orders' },
  { to: '/owner/ai', icon: <Brain className="w-5 h-5" />, label: 'AI Command Center' },
  { to: '/owner/analytics', icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics' },
]

export default function OwnerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen gradient-bg flex">
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#080b14]/98 border-r border-white/[0.07] flex flex-col transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-5 border-b border-white/[0.07]">
          <RoameatsLogo size={36} textSize="text-lg" />
          <div className="text-orange-400/60 text-xs mt-1 ml-1">Owner Portal</div>
        </div>

        <div className="p-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'O'}
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm truncate">{user?.name}</div>
              <div className="text-orange-400/70 text-xs">Truck Owner</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm ${isActive ? 'bg-gradient-to-r from-orange-500/15 to-transparent border border-orange-500/25 text-orange-300' : 'text-slate-500 hover:text-white hover:bg-white/[0.05]'}`}>
              {item.icon} {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-white/[0.07]">
          <button onClick={() => { logout(); navigate('/login') }}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition w-full text-sm font-medium">
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>
      </aside>

      {mobileOpen && <div className="fixed inset-0 bg-black/70 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07] bg-[#080b14]/80 backdrop-blur sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-slate-400 hover:text-white"><Menu className="w-5 h-5" /></button>
          <div className="md:hidden"><RoameatsLogo size={28} textSize="text-base" /></div>
          <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /> Live
          </div>
          <div className="text-slate-500 text-xs">{new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'short' })}</div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6"><Outlet /></main>
      </div>
    </div>
  )
}
