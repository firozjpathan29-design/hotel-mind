// src/App.jsx — FINAL COMPLETE (all pages)
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import Sidebar        from './components/Sidebar'
import AIChat         from './components/AIChat'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Dashboard    from './pages/Dashboard'
import Rooms        from './pages/Rooms'
import Bookings     from './pages/Bookings'
import Guests       from './pages/Guests'
import Complaints   from './pages/Complaints'
import Housekeeping from './pages/Housekeeping'
import Billing      from './pages/Billing'
import Analytics    from './pages/Analytics'
import Pricing      from './pages/Pricing'
import GuestIntel   from './pages/GuestIntel'
import Reports      from './pages/Reports'
import Settings     from './pages/Settings'
import Subscription from './pages/Subscription'
import Login        from './pages/Login'

function MainApp() {
  const [chat, setChat] = useState(false)
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F5F4F0' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>
        <Routes>
          <Route path="/"             element={<Dashboard />}    />
          <Route path="/rooms"        element={<Rooms />}        />
          <Route path="/bookings"     element={<Bookings />}     />
          <Route path="/guests"       element={<Guests />}       />
          <Route path="/complaints"   element={<Complaints />}   />
          <Route path="/housekeeping" element={<Housekeeping />} />
          <Route path="/billing"      element={<Billing />}      />
          <Route path="/analytics"    element={<Analytics />}    />
          <Route path="/pricing"      element={<Pricing />}      />
          <Route path="/guest-intel"  element={<GuestIntel />}   />
          <Route path="/reports"      element={<Reports />}      />
          <Route path="/settings"     element={<Settings />}     />
          <Route path="/subscription" element={<Subscription />} />
        </Routes>
      </main>
      <button onClick={() => setChat(true)} style={{
        position: 'fixed', bottom: 24, right: 24,
        width: 52, height: 52, borderRadius: '50%',
        background: '#1A1A18', color: '#fff',
        border: 'none', fontSize: 22, cursor: 'pointer',
        boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
        zIndex: chat ? -1 : 100,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>🤖</button>
      <AIChat isOpen={chat} onClose={() => setChat(false)} />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ProtectedRoute loginPage={<Login />}>
        <MainApp />
      </ProtectedRoute>
    </BrowserRouter>
  )
}
