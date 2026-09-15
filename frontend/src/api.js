import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
})

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password, role) => api.post('/auth/register', { name, email, password, role }),
}

export const trucks = {
  list: () => api.get('/trucks'),
  get: (id) => api.get(`/trucks/${id}`),
  location: (id) => api.get(`/trucks/${id}/location`),
  allLocations: () => api.get('/map/all-trucks'),
  setHoliday: (id, date, reason) => api.post(`/trucks/${id}/holiday`, { date, reason }),
  getHolidays: (id) => api.get(`/trucks/${id}/holidays`),
  cancelHoliday: (truckId, holidayId) => api.delete(`/trucks/${truckId}/holiday/${holidayId}`),
}

export const stations = {
  list: () => api.get('/stations'),
}

export const routes = {
  list: (truck_id) => api.get('/routes', { params: { truck_id } }),
  update: (id, data) => api.patch(`/routes/${id}`, data),
}

export const menu = {
  get: (truck_id) => api.get(`/menu/${truck_id}`),
  add: (data) => api.post('/menu', data),
  update: (id, data) => api.patch(`/menu/${id}`, data),
  delete: (id) => api.delete(`/menu/${id}`),
  markSoldOut: (id) => api.patch(`/menu/${id}/soldout`),
  markAvailable: (id) => api.patch(`/menu/${id}/available`),
}

export const orders = {
  create: (data) => api.post('/orders', data),
  list: (params) => api.get('/orders', { params }),
  get: (id) => api.get(`/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/orders/${id}/status`, { status }),
}

export const owner = {
  dashboard: (truck_id) => api.get('/owner/dashboard', { params: { truck_id } }),
}

export const notifications = {
  customer: (customer_id) => api.get(`/notifications/customer/${customer_id}`),
}

export const ai = {
  demand: (truck_id) => api.get('/ai/demand', { params: { truck_id } }),
  recommendations: (truck_id) => api.get('/ai/recommendations', { params: { truck_id } }),
  discover: (params) => api.get('/ai/discover', { params }),
  whatif: (truck_id, station_id) => api.get('/ai/whatif', { params: { truck_id, station_id } }),
  business: (truck_id) => api.get('/ai/business', { params: { truck_id } }),
  chat: (data) => api.post('/ai/chat', data),
}

export const simulation = {
  nextStop: (truck_id) => api.post('/simulation/next-stop', { truck_id }),
}

export default api
