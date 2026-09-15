import React, { useEffect, useState } from 'react'
import { menu as menuApi, trucks as trucksApi } from '../../api'
import { Plus, Edit, Trash2, Check, X, Leaf, AlertTriangle, CalendarOff, Trash } from 'lucide-react'

const TRUCK_ID = 1
const CATEGORIES = ['Main Course', 'Snack', 'Side', 'Beverage', 'Breakfast', 'Fast Food']
const EMOJIS = ['🍛','🍲','🥘','🌯','🍔','🍟','🍚','🫓','🥭','🍞','☕','🍋','🥛','🍩','🧆','🫕','🥗','🫔']
const defaultForm = { name:'', price:'', category:'Main Course', description:'', is_vegetarian:false, is_available:true, image_emoji:'🍛' }

export default function OwnerMenu() {
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  // Holiday
  const [holidays, setHolidays] = useState([])
  const [showHoliday, setShowHoliday] = useState(false)
  const [holidayDate, setHolidayDate] = useState('')
  const [holidayReason, setHolidayReason] = useState('')
  const [activeTab, setActiveTab] = useState('menu')

  const load = () => menuApi.get(TRUCK_ID).then(r => setItems(r.data))
  const loadHolidays = () => trucksApi.getHolidays(TRUCK_ID).then(r => setHolidays(r.data))
  useEffect(() => { load(); loadHolidays() }, [])

  const handleSubmit = async () => {
    if (!form.name || !form.price) return
    setLoading(true)
    try {
      const data = { ...form, price: parseFloat(form.price), truck_id: TRUCK_ID }
      editId ? await menuApi.update(editId, data) : await menuApi.add(data)
      setShowForm(false); setForm(defaultForm); setEditId(null); load()
    } catch { alert('Failed') }
    setLoading(false)
  }

  const handleEdit = (item) => {
    setEditId(item.id)
    setForm({ name:item.name, price:item.price, category:item.category, description:item.description||'', is_vegetarian:item.is_vegetarian, is_available:item.is_available, image_emoji:item.image_emoji })
    setShowForm(true)
  }

  const handleDelete = async (id) => { if (!confirm('Delete?')) return; await menuApi.delete(id); load() }

  const markSoldOut = async (item) => {
    if (item.is_available) {
      const res = await menuApi.markSoldOut(item.id)
      alert(`${res.data.notification}`)
    } else {
      await menuApi.markAvailable(item.id)
    }
    load()
  }

  const addHoliday = async () => {
    if (!holidayDate) return
    try {
      const res = await trucksApi.setHoliday(TRUCK_ID, holidayDate, holidayReason || 'Day off')
      alert(res.data.message)
      setShowHoliday(false); setHolidayDate(''); setHolidayReason(''); loadHolidays()
    } catch (e) { alert(e?.response?.data?.detail || 'Failed') }
  }

  const cancelHoliday = async (id) => {
    await trucksApi.cancelHoliday(TRUCK_ID, id); loadHolidays()
  }

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const gi = items.filter(i => i.category === cat)
    if (gi.length) acc[cat] = gi
    return acc
  }, {})

  const soldOutCount = items.filter(i => !i.is_available).length

  return (
    <div className="max-w-4xl mx-auto space-y-5 slide-up">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-white">Menu & Availability</h1>
        <div className="flex gap-2">
          <button onClick={() => { setShowForm(true); setEditId(null); setForm(defaultForm) }}
            className="btn-brand flex items-center gap-2 text-white px-4 py-2 rounded-xl font-semibold text-sm">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl bg-white/5 p-1 gap-1 max-w-xs">
        {[
          { id: 'menu', label: `🍽️ Menu (${items.length})` },
          { id: 'holiday', label: `📅 Holidays (${holidays.length})` },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${activeTab === t.id ? 'btn-brand text-white' : 'text-slate-400 hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {soldOutCount > 0 && activeTab === 'menu' && (
        <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-red-300 text-sm font-medium">{soldOutCount} item(s) marked as sold out. Customers are notified.</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && activeTab === 'menu' && (
        <div className="card-glass rounded-2xl p-6 border border-green-500/20 slide-up">
          <h3 className="text-white font-bold mb-5">{editId ? 'Edit Item' : 'Add New Item'}</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1.5 block uppercase tracking-wide">Name *</label>
              <input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} className="input-dark" placeholder="Item name" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1.5 block uppercase tracking-wide">Price (₹) *</label>
              <input type="number" value={form.price} onChange={e=>setForm(p=>({...p,price:e.target.value}))} className="input-dark" placeholder="120" />
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1.5 block uppercase tracking-wide">Category</label>
              <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="input-dark bg-slate-900">
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs font-semibold mb-1.5 block uppercase tracking-wide">Pick Emoji</label>
              <div className="flex flex-wrap gap-1.5">
                {EMOJIS.map(e=>(
                  <button key={e} type="button" onClick={()=>setForm(p=>({...p,image_emoji:e}))}
                    className={`w-9 h-9 rounded-lg text-xl flex items-center justify-center transition border ${form.image_emoji===e ? 'bg-green-500/20 border-green-500/50 scale-110' : 'border-white/10 hover:bg-white/10'}`}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="text-slate-400 text-xs font-semibold mb-1.5 block uppercase tracking-wide">Description</label>
              <input value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} className="input-dark" placeholder="Brief description" />
            </div>
            <div className="flex items-center gap-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_vegetarian} onChange={e=>setForm(p=>({...p,is_vegetarian:e.target.checked}))} className="w-4 h-4 accent-green-500" />
                <span className="text-slate-300 text-sm flex items-center gap-1"><Leaf className="w-3.5 h-3.5 text-green-400" /> Vegetarian</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.is_available} onChange={e=>setForm(p=>({...p,is_available:e.target.checked}))} className="w-4 h-4 accent-orange-500" />
                <span className="text-slate-300 text-sm">Available</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleSubmit} disabled={loading}
              className="btn-brand flex items-center gap-2 text-white px-6 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50">
              <Check className="w-4 h-4" /> {editId ? 'Update' : 'Add Item'}
            </button>
            <button onClick={()=>{setShowForm(false);setEditId(null)}}
              className="card-glass flex items-center gap-2 text-slate-300 px-4 py-2.5 rounded-xl text-sm border border-white/10">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* MENU TAB */}
      {activeTab === 'menu' && (
        <div className="space-y-5">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">{cat}</h3>
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-slate-600 text-xs">{catItems.length} items</span>
              </div>
              <div className="space-y-2">
                {catItems.map(item => (
                  <div key={item.id} className={`card-glass rounded-2xl p-4 flex items-center justify-between border border-white/[0.06] transition ${!item.is_available ? 'opacity-60' : 'hover:bg-white/[0.04]'}`}>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <span className="text-3xl">{item.image_emoji}</span>
                        {!item.is_available && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold border border-black">✕</span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">{item.name}</span>
                          {item.is_vegetarian && <span className="text-xs bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-lg border border-green-500/20">🌿 Veg</span>}
                          {!item.is_available && <span className="text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-lg border border-red-500/20">Sold Out</span>}
                        </div>
                        <div className="text-slate-600 text-xs mt-0.5">{item.description}</div>
                        <div className="text-orange-400 font-black mt-0.5">₹{item.price}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => markSoldOut(item)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition border ${item.is_available ? 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-green-500/10 hover:text-green-400 hover:border-green-500/20'}`}>
                        {item.is_available ? '✓ Available' : '⚠ Sold Out'}
                      </button>
                      <button onClick={() => handleEdit(item)} className="w-8 h-8 hover:bg-blue-500/20 rounded-lg text-blue-400 transition flex items-center justify-center">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="w-8 h-8 hover:bg-red-500/20 rounded-lg text-red-400 transition flex items-center justify-center">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HOLIDAY TAB */}
      {activeTab === 'holiday' && (
        <div className="space-y-4">
          <div className="card-glass rounded-2xl p-5 border border-orange-500/20">
            <h3 className="text-white font-bold mb-1 flex items-center gap-2"><CalendarOff className="w-4 h-4 text-orange-400" /> Set a Holiday / Leave Day</h3>
            <p className="text-slate-500 text-xs mb-4">When you set a holiday, all customers who have preorders will be automatically notified.</p>
            <div className="grid md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="text-slate-400 text-xs mb-1 block">Date</label>
                <input type="date" value={holidayDate} onChange={e=>setHolidayDate(e.target.value)} className="input-dark" />
              </div>
              <div className="md:col-span-1">
                <label className="text-slate-400 text-xs mb-1 block">Reason (optional)</label>
                <input type="text" value={holidayReason} onChange={e=>setHolidayReason(e.target.value)} className="input-dark" placeholder="e.g. Vehicle maintenance" />
              </div>
              <div className="flex items-end">
                <button onClick={addHoliday} disabled={!holidayDate}
                  className="w-full btn-brand text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40">
                  Set Holiday
                </button>
              </div>
            </div>
          </div>

          {holidays.length === 0 ? (
            <div className="card-glass rounded-2xl p-10 text-center border border-white/[0.06]">
              <div className="text-4xl mb-2">📅</div>
              <p className="text-slate-500">No holidays set. Your truck is open every day!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {holidays.map(h => (
                <div key={h.id} className="card-glass rounded-xl p-4 flex items-center justify-between border border-yellow-500/20 bg-yellow-500/5">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🚫</span>
                    <div>
                      <div className="text-white font-semibold">{h.date}</div>
                      <div className="text-slate-400 text-sm">{h.reason}</div>
                      <div className="text-yellow-400 text-xs mt-0.5">Customers will be notified</div>
                    </div>
                  </div>
                  <button onClick={() => cancelHoliday(h.id)}
                    className="flex items-center gap-1.5 bg-red-500/10 hover:bg-red-500/25 text-red-400 px-3 py-1.5 rounded-lg text-sm transition">
                    <Trash className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
