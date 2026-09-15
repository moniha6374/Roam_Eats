import axios from 'axios'
import {
  DEMO_USERS, DEMO_TRUCKS, DEMO_STATIONS, DEMO_ROUTES, DEMO_AI_DISCOVER,
  DEMO_OWNER_DASHBOARD, DEMO_AI_RECOMMENDATIONS, demoStore,
} from './mockData'

// If VITE_API_URL is set (production with real backend), use it. Otherwise demo mode.
const BASE_URL = import.meta.env.VITE_API_URL || null
const IS_DEMO = !BASE_URL

const http = BASE_URL ? axios.create({ baseURL: BASE_URL, timeout: 15000 }) : null

// Helper: wrap demo data in axios-like response
const mock = (data) => Promise.resolve({ data })
const delay = (ms = 400) => new Promise(r => setTimeout(r, ms))

// ─── AUTH ─────────────────────────────────────────────────────────────────────
export const auth = {
  login: async (email, password) => {
    if (IS_DEMO) {
      await delay(500)
      const user = DEMO_USERS.find(u => u.email === email && u.password === password)
      if (!user) throw { response: { data: { detail: 'Invalid email or password.' } } }
      return mock(user)
    }
    return http.post('/auth/login', { email, password })
  },
  register: async (name, email, password, role) => {
    if (IS_DEMO) {
      await delay(600)
      if (DEMO_USERS.find(u => u.email === email)) throw { response: { data: { detail: 'Email already registered.' } } }
      const user = { id: Date.now(), name, email, password, role, token: `demo-${Date.now()}` }
      DEMO_USERS.push(user)
      return mock(user)
    }
    return http.post('/auth/register', { name, email, password, role })
  },
}

// ─── TRUCKS ───────────────────────────────────────────────────────────────────
export const trucks = {
  list: async () => IS_DEMO ? (await delay(300), mock(DEMO_TRUCKS)) : http.get('/trucks'),
  get: async (id) => {
    if (IS_DEMO) {
      await delay(300)
      const t = DEMO_TRUCKS.find(x => x.id === id)
      return mock({ ...t, menu_items: demoStore.getMenu(id), routes_today: DEMO_ROUTES[id] || [] })
    }
    return http.get(`/trucks/${id}`)
  },
  location: async (id) => {
    if (IS_DEMO) {
      await delay(200)
      const routes = DEMO_ROUTES[id] || []
      const cur = routes.find(r => r.status === 'current') || routes[0]
      const next = routes.find(r => r.status === 'planned')
      const t = DEMO_TRUCKS.find(x => x.id === id)
      const DEMO_STATIONS = (await import('./mockData')).DEMO_STATIONS
      const curSt = DEMO_STATIONS.find(s => s.id === cur?.station_id) || DEMO_STATIONS[0]
      const nextSt = next ? DEMO_STATIONS.find(s => s.id === next.station_id) : null
      return mock({
        truck_id: id, truck_name: t?.name, image_url: t?.image_url,
        current_station: { id: curSt.id, name: curSt.name, lat: curSt.latitude, lng: curSt.longitude },
        next_station: nextSt ? { id: nextSt.id, name: nextSt.name, lat: nextSt.latitude, lng: nextSt.longitude, arrival_time: next.arrival_time } : null,
        full_route: routes.map(r => {
          const s = DEMO_STATIONS.find(st => st.id === r.station_id)
          return { station_name: r.station_name, lat: s?.latitude, lng: s?.longitude, arrival_time: r.arrival_time, status: r.status, sequence: r.sequence }
        }),
      })
    }
    return http.get(`/trucks/${id}/location`)
  },
  allLocations: async () => {
    if (IS_DEMO) {
      await delay(200)
      const { DEMO_STATIONS: ST } = await import('./mockData')
      return mock(DEMO_TRUCKS.map(t => {
        const routes = DEMO_ROUTES[t.id] || []
        const cur = routes.find(r => r.status === 'current')
        const s = cur ? ST.find(st => st.id === cur.station_id) : null
        return s ? { truck_id: t.id, truck_name: t.name, cuisine_type: t.cuisine_type, image_url: t.image_url, rating: t.rating, lat: s.latitude, lng: s.longitude, station_name: s.name, arrival_time: cur.arrival_time, departure_time: cur.departure_time, active_orders: 3 } : null
      }).filter(Boolean))
    }
    return http.get('/map/all-trucks')
  },
  setHoliday: async (id, date, reason) => IS_DEMO ? (await delay(300), mock(demoStore.addHoliday(id, date, reason))) : http.post(`/trucks/${id}/holiday`, { date, reason }),
  getHolidays: async (id) => IS_DEMO ? (await delay(200), mock(demoStore.getHolidays(id))) : http.get(`/trucks/${id}/holidays`),
  cancelHoliday: async (truckId, hId) => IS_DEMO ? (await delay(200), demoStore.cancelHoliday(hId), mock({ message: 'Cancelled' })) : http.delete(`/trucks/${truckId}/holiday/${hId}`),
}

// ─── STATIONS ─────────────────────────────────────────────────────────────────
export const stations = {
  list: async () => IS_DEMO ? (await delay(200), mock(DEMO_STATIONS)) : http.get('/stations'),
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────
export const routes = {
  list: async (truck_id) => IS_DEMO ? (await delay(200), mock(truck_id ? DEMO_ROUTES[truck_id] || [] : Object.values(DEMO_ROUTES).flat())) : http.get('/routes', { params: { truck_id } }),
  update: async (id, data) => IS_DEMO ? mock(data) : http.patch(`/routes/${id}`, data),
}

// ─── MENU ─────────────────────────────────────────────────────────────────────
export const menu = {
  get: async (truck_id) => IS_DEMO ? (await delay(200), mock(demoStore.getMenu(truck_id))) : http.get(`/menu/${truck_id}`),
  add: async (data) => IS_DEMO ? (await delay(300), mock(demoStore.addMenuItem(data))) : http.post('/menu', data),
  update: async (id, data) => IS_DEMO ? (await delay(200), mock(demoStore.updateMenuItem(id, data))) : http.patch(`/menu/${id}`, data),
  delete: async (id) => IS_DEMO ? (await delay(200), demoStore.deleteMenuItem(id), mock({ message: 'Deleted' })) : http.delete(`/menu/${id}`),
  markSoldOut: async (id) => {
    if (IS_DEMO) {
      await delay(200)
      const item = demoStore.updateMenuItem(id, { is_available: false })
      return mock({ item_id: id, item_name: item?.name, notification: `⚠️ ${item?.name} is now sold out. Customers will be notified.` })
    }
    return http.patch(`/menu/${id}/soldout`)
  },
  markAvailable: async (id) => IS_DEMO ? (await delay(200), mock(demoStore.updateMenuItem(id, { is_available: true }))) : http.patch(`/menu/${id}/available`),
}

// ─── ORDERS ───────────────────────────────────────────────────────────────────
export const orders = {
  create: async (data) => IS_DEMO ? (await delay(600), mock(demoStore.createOrder(data))) : http.post('/orders', data),
  list: async (params) => IS_DEMO ? (await delay(300), mock(demoStore.getOrders(params?.customer_id, params?.truck_id))) : http.get('/orders', { params }),
  get: async (id) => IS_DEMO ? (await delay(200), mock(demoStore.getOrders().find(o => o.id === id))) : http.get(`/orders/${id}`),
  updateStatus: async (id, status) => IS_DEMO ? (await delay(200), mock(demoStore.updateOrderStatus(id, status))) : http.patch(`/orders/${id}/status`, { status }),
}

// ─── OWNER ────────────────────────────────────────────────────────────────────
export const owner = {
  dashboard: async (truck_id) => IS_DEMO ? (await delay(400), mock(DEMO_OWNER_DASHBOARD)) : http.get('/owner/dashboard', { params: { truck_id } }),
}

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
export const notifications = {
  customer: async (customer_id) => {
    if (IS_DEMO) {
      await delay(200)
      const myOrders = demoStore.getOrders(customer_id)
      const notifs = []
      myOrders.forEach(o => {
        if (o.status === 'ARRIVING') notifs.push({ type: 'ARRIVING', icon: '🚚', title: 'Truck Arriving!', message: `${o.truck_name} is arriving at ${o.station_name}!`, detail: `Order #${o.id} is almost ready.`, severity: 'HIGH', timestamp: new Date().toLocaleTimeString() })
        if (o.status === 'READY') notifs.push({ type: 'READY', icon: '✅', title: 'Order Ready!', message: `Order #${o.id} is ready for pickup!`, detail: `Pick up from ${o.station_name}.`, severity: 'HIGH', timestamp: new Date().toLocaleTimeString() })
      })
      return mock({ notifications: notifs, count: notifs.length })
    }
    return http.get(`/notifications/customer/${customer_id}`)
  },
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export const ai = {
  demand: async (truck_id) => IS_DEMO ? (await delay(500), mock(DEMO_AI_RECOMMENDATIONS.demand)) : http.get('/ai/demand', { params: { truck_id } }),
  recommendations: async (truck_id) => IS_DEMO ? (await delay(600), mock(DEMO_AI_RECOMMENDATIONS)) : http.get('/ai/recommendations', { params: { truck_id } }),
  discover: async (params) => {
    if (IS_DEMO) { await delay(700); return mock(DEMO_AI_DISCOVER(params.preference, params.time_preference)) }
    return http.get('/ai/discover', { params })
  },
  whatif: async (truck_id, station_id) => IS_DEMO ? (await delay(500), mock(demoStore.whatif(truck_id, station_id))) : http.get('/ai/whatif', { params: { truck_id, station_id } }),
  business: async (truck_id) => IS_DEMO ? (await delay(400), mock(DEMO_AI_RECOMMENDATIONS.business)) : http.get('/ai/business', { params: { truck_id } }),
  chat: async (data) => {
    if (IS_DEMO) {
      await delay(800)
      const msg = data.message?.toLowerCase() || ''
      let response = ''
      if (msg.includes('station') || msg.includes('priorit')) response = '**IT Park** should be your top priority! SDS Score: 87/100 (HIGH DEMAND). Expected peak: 13:00 - 14:00. There are currently 8 preorders waiting there.'
      else if (msg.includes('biryani') || msg.includes('food') || msg.includes('popular')) response = '**Chicken Biryani** has the highest demand with 4 portions ordered. Prepare 14 portions for the next stop!'
      else if (msg.includes('prepare') || msg.includes('how many') || msg.includes('quantity')) response = 'For IT Park (SDS: 87), prepare approximately **18 meals**. Increase biryani/main course by 25%. Expected peak: 13:00–14:00.'
      else if (msg.includes('revenue') || msg.includes('business') || msg.includes('today')) response = 'Today\'s summary:\n• Total Orders: 10\n• Revenue Earned: ₹660\n• Projected Total: ₹1410\n• Top item: Chicken Biryani (4 portions)'
      else if (msg.includes('route') || msg.includes('next') || msg.includes('move')) response = 'Recommended next stop: **IT Park** (Weighted Score: 43.5). Arrive by 12:45 for peak demand. Your current route is optimal!'
      else response = 'Here\'s your current status:\n• Active orders: 5\n• Top station: IT Park (SDS: 87)\n• Revenue today: ₹660\n\nAsk me about: station priority, food preparation, revenue insights, or route optimization!'
      return mock({ response, agent: 'AI Assistant', timestamp: new Date().toLocaleTimeString() })
    }
    return http.post('/ai/chat', data)
  },
}

// ─── SIMULATION ───────────────────────────────────────────────────────────────
export const simulation = {
  nextStop: async (truck_id) => IS_DEMO ? (await delay(500), mock(demoStore.simulateNextStop(truck_id))) : http.post('/simulation/next-stop', { truck_id }),
}

export default { auth, trucks, stations, routes, menu, orders, owner, notifications, ai, simulation }
