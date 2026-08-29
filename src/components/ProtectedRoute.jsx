// src/components/ProtectedRoute.jsx — Phase 5
import { useEffect, useState } from 'react'
import { getUser } from '../lib/auth'

export default function ProtectedRoute({ children, loginPage }) {
  const [user, setUser]       = useState(undefined) // undefined = loading
  const [loading, setLoading] = useState(true)

  useEffect(function() {
    getUser().then(function(u) {
      setUser(u)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F5F4F0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 12, color: '#888780',
      }}>
        <div style={{ fontSize: 30 }}>⏳</div>
        <div style={{ fontSize: 14 }}>Checking login...</div>
      </div>
    )
  }

  if (!user) return loginPage
  return children
}
