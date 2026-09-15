import React, { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Home, Truck, ShoppingBag, Sparkles, LogOut, Menu, X } from 'lucide-react'
import RoameatsLogo from '../../components/RoameatsLogo'
import NotificationBell from '../../components/NotificationBell'

const navItems = [
  { to: '/customer', icon: <Home className="w-5 h-5" />, label: 'Home', end: true },
  { to: '/customer/discover', icon: <Sparkles className="w-5 h-5" />, label: 'AI Finder' },
  { to: '/customer/trucks', icon: <Truck className="w-5 h-5" />, label: 'Trucks & Map' },
  { to: '/customer/orders', icon: <ShoppingBag className="w-5 h-5" />, label: 'My Orders' },
]

export default function CustomerLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Sidebar */}
      <aside className={`fixed md:static inset-y-0 left-0 z-50 w-64 bg-[#080b14]/98 border-r border-white/[0.07] flex flex-col transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-5 border-b border-white/[0.07]">
          <RoameatsLogo size={36} textSize="text-lg" />
          <div className="text-green-400/60 text-xs mt-1 ml-1">Customer Portal</div>
        </div>

        <div className="p-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3 bg-white/[0.04] rounded-xl px-3 py-2.5">
            <div className="w-8 h-8 brand-gradient rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || 'C'}
            </div>
            <div className="min-w-0">
              <div className="text-white font-semibold text-sm truncate">{user?.name}</div>
              <div className="text-slate-500 text-xs truncate">{user?.email}</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition font-medium text-sm ${isActive ? 'sidebar-active text-green-300' : 'text-slate-500 hover:text-white hover:bg-white/[0.05]'}`}>
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
        {/* Top bar */}
        <header className="flex items-center justify-between px-4 py-3 border-b border-white/[0.07] bg-[#080b14]/80 backdrop-blur sticky top-0 z-30">
          <button onClick={() => setMobileOpen(true)} className="md:hidden text-slate-400 hover:text-white p-1">
            <Menu className="w-5 h-5" />
          </button>
          <div className="md:hidden"><RoameatsLogo size={28} textSize="text-base" /></div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            {user?.id && <NotificationBell customerId={user.id} />}
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
