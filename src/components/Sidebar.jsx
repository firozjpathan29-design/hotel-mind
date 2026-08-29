// src/components/Sidebar.jsx — Final (all pages)
import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/auth'

const NAV = [
  { to: '/',              icon: '🏠', label: 'Dashboard'       },
  { to: '/rooms',         icon: '🛏️', label: 'Rooms'           },
  { to: '/bookings',      icon: '📋', label: 'Bookings'        },
  { to: '/guests',        icon: '👥', label: 'Guests'          },
  { to: '/complaints',    icon: '😤', label: 'Complaints'      },
  { to: '/housekeeping',  icon: '🧹', label: 'Housekeeping'    },
  { to: '/billing',       icon: '💳', label: 'Billing'         },
  { to: '/analytics',     icon: '📊', label: 'Analytics'       },
  { to: '/pricing',       icon: '💡', label: 'Pricing AI'      },
  { to: '/guest-intel',   icon: '🎯', label: 'Guest Intel'     },
  { to: '/reports',       icon: '📈', label: 'Reports'         },
  { to: '/settings',      icon: '⚙️', label: 'Settings'        },
  { to: '/subscription',  icon: '💎', label: 'Subscription'    },
]

export default function Sidebar() {
  const navigate = useNavigate()

  async function handleLogout() {
    if (window.confirm('Logout karna chahte ho?')) {
      try {
        await signOut()
        navigate('/')
        window.location.reload()
      } catch(e) {
        alert('Logout fail hua.')
      }
    }
  }

  return (
    <aside style={{
      width: 200, minHeight: '100vh', background: '#1A1A18',
      display: 'flex', flexDirection: 'column',
      padding: '20px 0', flexShrink: 0,
      position: 'sticky', top: 0, height: '100vh',
    }}>
      <div style={{ padding: '0 16px 16px', borderBottom: '0.5px solid rgba(255,255,255,0.08)' }}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>HotelMind AI</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>Gujarat Hotel OS</div>
      </div>

      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV.map(function({ to, icon, label }) {
          return (
            <NavLink key={to} to={to} end={to === '/'} style={function({ isActive }) {
              return {
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 12px', borderRadius: 8, marginBottom: 2,
                textDecoration: 'none', fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.5)',
                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
              }
            }}>
              <span style={{ fontSize: 15 }}>{icon}</span>
              {label}
            </NavLink>
          )
        })}
      </nav>

      <div style={{ padding: '10px 8px', borderTop: '0.5px solid rgba(255,255,255,0.08)' }}>
        <button onClick={handleLogout} style={{
          width: '100%', padding: '8px 12px', borderRadius: 8,
          border: 'none', background: 'rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.5)', fontSize: 13,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
        }}
        onMouseEnter={function(e) { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#FCA5A5' }}
        onMouseLeave={function(e) { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
        >
          <span style={{ fontSize: 15 }}>🚪</span> Logout
        </button>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 8, paddingLeft: 4 }}>
          Powered by Claude AI
        </div>
      </div>
    </aside>
  )
}
