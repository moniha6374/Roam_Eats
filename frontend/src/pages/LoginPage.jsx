import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { auth } from '../api'
import { Brain, MapPin, TrendingUp, Zap, Eye, EyeOff, UserPlus, LogIn, ChevronRight } from 'lucide-react'
import RoameatsLogo from '../components/RoameatsLogo'

const DEMO_ACCOUNTS = [
  { label: '👤 Customer — Arjun Kumar', email: 'customer@demo.com', password: 'demo123', role: 'customer', desc: 'Browse & pre-order food' },
  { label: '🚚 Owner — Ravi Trucks', email: 'owner@demo.com', password: 'demo123', role: 'owner', desc: 'Manage truck & AI insights' },
]

const FEATURES = [
  { icon: <Brain className="w-5 h-5" />, label: 'Multi-Agent AI', desc: '5 specialized agents working in real-time' },
  { icon: <TrendingUp className="w-5 h-5" />, label: 'Station Demand Score', desc: 'Predictive intelligence for every stop' },
  { icon: <MapPin className="w-5 h-5" />, label: 'Live Truck Tracking', desc: 'Real-time map with route simulation' },
  { icon: <Zap className="w-5 h-5" />, label: 'Smart Pre-ordering', desc: 'Order before the truck arrives' },
]

export default function LoginPage() {
  const [tab, setTab] = useState('login')
  const [showPass, setShowPass] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regRole, setRegRole] = useState('customer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const go = (data) => navigate(data.role === 'owner' ? '/owner' : '/customer')

  const handleLogin = async (e) => {
    e?.preventDefault()
    if (!loginEmail || !loginPassword) { setError('Please enter email and password.'); return }
    setLoading(true); setError('')
    try { const r = await auth.login(loginEmail, loginPassword); login(r.data); go(r.data) }
    catch (err) { setError(err?.response?.data?.detail || 'Invalid email or password.') }
    finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e?.preventDefault()
    if (!regName.trim()) { setError('Please enter your name.'); return }
    if (!regEmail.trim()) { setError('Please enter your email.'); return }
    if (regPassword.length < 4) { setError('Password must be at least 4 characters.'); return }
    setLoading(true); setError('')
    try { const r = await auth.register(regName.trim(), regEmail.trim(), regPassword, regRole); login(r.data); go(r.data) }
    catch (err) { setError(err?.response?.data?.detail || 'Registration failed. Try a different email.') }
    finally { setLoading(false) }
  }

  const quickLogin = async (acc) => {
    setLoading(true); setError('')
    try { const r = await auth.login(acc.email, acc.password); login(r.data); go(r.data) }
    catch { setError('Login failed. Make sure the backend is running.') }
    finally { setLoading(false) }
  }

  const switchTab = (t) => { setTab(t); setError('') }

  return (
    <div className="min-h-screen gradient-bg flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

        <div className="relative z-10">
          <RoameatsLogo size={52} textSize="text-2xl" />
          <p className="text-slate-400 mt-2 text-sm ml-1">Predictive Station Intelligence</p>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-5xl font-black text-white leading-tight">
            Find your food<br />
            <span className="brand-gradient-text">before the truck arrives.</span>
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            AI-powered ecosystem connecting hungry customers with roaming food trucks through predictive intelligence.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(f => (
              <div key={f.label} className="card-glass rounded-2xl p-4 hover:bg-white/[0.06] transition">
                <div className="w-9 h-9 brand-gradient rounded-xl flex items-center justify-center text-white mb-3">
                  {f.icon}
                </div>
                <div className="text-white font-semibold text-sm">{f.label}</div>
                <div className="text-slate-500 text-xs mt-0.5">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          {['🍛 Biryani', '🌯 Wraps', '🍔 Burgers', '🥘 Curries'].map(t => (
            <span key={t} className="text-xs text-slate-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">{t}</span>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <RoameatsLogo size={44} textSize="text-xl" />
          </div>

          {/* Card */}
          <div className="card-glass rounded-3xl p-8 shadow-2xl border border-white/10">
            {/* Tabs */}
            <div className="flex rounded-2xl bg-white/5 p-1 mb-7 gap-1">
              {[
                { id: 'login', icon: <LogIn className="w-4 h-4" />, label: 'Sign In' },
                { id: 'register', icon: <UserPlus className="w-4 h-4" />, label: 'Create Account' },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => switchTab(t.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${tab === t.id ? 'btn-brand text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 mb-5 text-sm flex items-start gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            {/* LOGIN */}
            {tab === 'login' && (
              <>
                <form onSubmit={handleLogin} className="space-y-4 mb-6">
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-1.5 block">Email address</label>
                    <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)}
                      placeholder="you@example.com" className="input-dark" />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-1.5 block">Password</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                        placeholder="Enter your password" className="input-dark pr-12" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full btn-brand text-white font-bold py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Signing in...</span> : <>Sign In <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </form>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-slate-600 text-xs font-medium">OR USE DEMO</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>

                <div className="space-y-2.5">
                  {DEMO_ACCOUNTS.map(acc => (
                    <button key={acc.email} onClick={() => quickLogin(acc)} disabled={loading}
                      className="w-full card-glass-hover rounded-2xl px-4 py-3.5 flex items-center justify-between group border border-white/8 hover:border-green-500/30 transition">
                      <div className="text-left">
                        <div className="text-white font-semibold text-sm group-hover:text-green-300 transition">{acc.label}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{acc.desc}</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-green-400 transition" />
                    </button>
                  ))}
                </div>

                <p className="text-slate-600 text-xs text-center mt-5">
                  New here?{' '}
                  <button onClick={() => switchTab('register')} className="text-green-400 hover:text-green-300 font-medium transition">Create a free account →</button>
                </p>
              </>
            )}

            {/* REGISTER */}
            {tab === 'register' && (
              <>
                <form onSubmit={handleRegister} className="space-y-4 mb-4">
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-1.5 block">Full Name</label>
                    <input type="text" value={regName} onChange={e => setRegName(e.target.value)}
                      placeholder="e.g. Senthil Kumar" className="input-dark" />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-1.5 block">Email address</label>
                    <input type="email" value={regEmail} onChange={e => setRegEmail(e.target.value)}
                      placeholder="you@example.com" className="input-dark" />
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-1.5 block">Password</label>
                    <div className="relative">
                      <input type={showPass ? 'text' : 'password'} value={regPassword} onChange={e => setRegPassword(e.target.value)}
                        placeholder="Minimum 4 characters" className="input-dark pr-12" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-300 text-sm font-medium mb-2 block">I want to</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { value: 'customer', emoji: '👤', label: 'Order Food', desc: 'Browse & pre-order' },
                        { value: 'owner', emoji: '🚚', label: 'Own a Truck', desc: 'Manage & sell' },
                      ].map(opt => (
                        <button key={opt.value} type="button" onClick={() => setRegRole(opt.value)}
                          className={`p-3.5 rounded-xl border text-left transition ${regRole === opt.value ? 'border-green-500/60 bg-green-500/10' : 'border-white/10 hover:border-white/25 bg-white/3'}`}>
                          <div className="text-xl mb-1">{opt.emoji}</div>
                          <div className="text-white font-semibold text-sm">{opt.label}</div>
                          <div className="text-slate-500 text-xs">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full btn-brand text-white font-bold py-3.5 rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</span> : <>Create Account & Enter <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </form>
                <p className="text-slate-600 text-xs text-center">
                  Already have an account?{' '}
                  <button onClick={() => switchTab('login')} className="text-green-400 hover:text-green-300 font-medium transition">Sign in →</button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
