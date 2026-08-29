// src/pages/Login.jsx — Phase 5
import { useState } from 'react'
import { signIn } from '../lib/auth'

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [showPass, setShowPass] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    if (!email || !password) { setError('Email aur password dono chahiye!'); return }
    setLoading(true)
    setError('')
    try {
      await signIn(email, password)
      onLogin && onLogin()
    } catch(err) {
      setError('Login fail hua. Email/password check karo.')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F4F0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14,
            background: '#1A1A18',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, margin: '0 auto 12px',
          }}>🏨</div>
          <div style={{ fontWeight: 700, fontSize: 22, color: '#1A1A18' }}>HotelMind AI</div>
          <div style={{ fontSize: 13, color: '#888780', marginTop: 4 }}>Gujarat Hotel OS — Staff Login</div>
        </div>

        {/* Login card */}
        <div style={{
          background: '#fff',
          border: '0.5px solid rgba(0,0,0,0.08)',
          borderRadius: 16,
          padding: 28,
        }}>
          <div style={{ fontWeight: 600, fontSize: 16, color: '#1A1A18', marginBottom: 20 }}>
            Login karo
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FCEBEB', border: '0.5px solid rgba(163,45,45,0.2)',
              borderRadius: 8, padding: '10px 14px',
              fontSize: 13, color: '#A32D2D', marginBottom: 16,
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: '#888780', display: 'block', marginBottom: 6 }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="hotel@example.com"
              onKeyDown={e => e.key === 'Enter' && handleLogin(e)}
              style={{
                width: '100%', padding: '10px 14px',
                borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)',
                fontSize: 13, outline: 'none', boxSizing: 'border-box',
                background: '#FAFAF8',
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, color: '#888780', display: 'block', marginBottom: 6 }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === 'Enter' && handleLogin(e)}
                style={{
                  width: '100%', padding: '10px 40px 10px 14px',
                  borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.15)',
                  fontSize: 13, outline: 'none', boxSizing: 'border-box',
                  background: '#FAFAF8',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 16, color: '#888780',
                }}
              >{showPass ? '🙈' : '👁️'}</button>
            </div>
          </div>

          {/* Login button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            style={{
              width: '100%', padding: '11px',
              borderRadius: 8, border: 'none',
              background: loading ? '#ccc' : '#1A1A18',
              color: '#fff', fontSize: 14, fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            {loading ? <><span>⏳</span> Login ho raha hai...</> : 'Login Karo →'}
          </button>

          {/* Demo hint */}
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: '#EEEDFE', borderRadius: 8,
            fontSize: 12, color: '#3C3489', lineHeight: 1.6,
          }}>
            💡 <strong>Test ke liye:</strong> Supabase mein jaake Authentication → Users → Add user karo. Wahan email/password set karo aur yahan login karo.
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: '#B4B2A9' }}>
          HotelMind AI · Powered by Claude · Supabase Auth
        </div>
      </div>
    </div>
  )
}
