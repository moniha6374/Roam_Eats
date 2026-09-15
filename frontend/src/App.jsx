import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import CustomerLayout from './pages/customer/CustomerLayout'
import CustomerHome from './pages/customer/CustomerHome'
import CustomerTrucks from './pages/customer/CustomerTrucks'
import CustomerOrders from './pages/customer/CustomerOrders'
import CustomerDiscover from './pages/customer/CustomerDiscover'
import OwnerLayout from './pages/owner/OwnerLayout'
import OwnerDashboard from './pages/owner/OwnerDashboard'
import OwnerTruck from './pages/owner/OwnerTruck'
import OwnerMenu from './pages/owner/OwnerMenu'
import OwnerOrders from './pages/owner/OwnerOrders'
import OwnerAICenter from './pages/owner/OwnerAICenter'
import OwnerAnalytics from './pages/owner/OwnerAnalytics'

function ProtectedRoute({ children, role }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/customer" element={
            <ProtectedRoute role="customer"><CustomerLayout /></ProtectedRoute>
          }>
            <Route index element={<CustomerHome />} />
            <Route path="discover" element={<CustomerDiscover />} />
            <Route path="trucks" element={<CustomerTrucks />} />
            <Route path="orders" element={<CustomerOrders />} />
          </Route>
          <Route path="/owner" element={
            <ProtectedRoute role="owner"><OwnerLayout /></ProtectedRoute>
          }>
            <Route index element={<OwnerDashboard />} />
            <Route path="truck" element={<OwnerTruck />} />
            <Route path="menu" element={<OwnerMenu />} />
            <Route path="orders" element={<OwnerOrders />} />
            <Route path="ai" element={<OwnerAICenter />} />
            <Route path="analytics" element={<OwnerAnalytics />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
