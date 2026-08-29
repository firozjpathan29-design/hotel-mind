
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats, getDashboardLists } from '../lib/supabase'
function useDashboardData() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      const [stats, lists] = await Promise.all([
        getDashboardStats(),
        getDashboardLists(),
      ])

      const occ = stats.totalRooms ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0
      const aiTip = occ >= 70
        ? `Aaj occupancy ${occ}% hai — badhiya chal rahi hai! Pricing thodi badha sakte ho weekend ke liye.`
        : `Aaj occupancy sirf ${occ}% hai. Available rooms ke liye WhatsApp blast bhejo discount ke saath.`

      setData({ stats, ...lists, aiTip })
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Dashboard data load nahi hua. Internet check karo ya page refresh karo.')
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, reload: load }
}

const BADGES = {
  confirmed:  { bg:'#E6F1FB', c:'#0C447C', l:'Confirmed'    },
  late:       { bg:'#FCEBEB', c:'#A32D2D', l:'Late checkout' },
  done:       { bg:'#E1F5EE', c:'#085041', l:'Done'          },
  pending:    { bg:'#FAEEDA', c:'#633806', l:'Pending'       },
  inprogress: { bg:'#EEEDFE', c:'#3C3489', l:'In progress'   },
  checkedin:  { bg:'#E1F5EE', c:'#085041', l:'Checked in'    },
  checked_in: { bg:'#E1F5EE', c:'#085041', l:'Checked in'    },
  high:       { bg:'#FCEBEB', c:'#A32D2D', l:'High'          },
  medium:     { bg:'#FAEEDA', c:'#633806', l:'Medium'        },
  low:        { bg:'#EAF3DE', c:'#27500A', l:'Low'           },
}

function Badge({ s }) {
  const b = BADGES[s] || { bg:'#F1EFE8', c:'#5F5E5A', l:s }
  return <span style={{ background:b.bg, color:b.c, fontSize:11, fontWeight:500, padding:'2px 9px', borderRadius:20, whiteSpace:'nowrap' }}>{b.l}</span>
}

function StatCard({ icon, label, value, sub, ok=true }) {
  return (
    <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:12, padding:'14px 16px' }}>
      <div style={{ fontSize:11, color:'#888780', marginBottom:6 }}>{icon} {label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:'#1A1A18', lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontSize:11, marginTop:5, color:ok?'#0F6E56':'#A32D2D' }}>{sub}</div>}
    </div>
  )
}

function Card({ title, icon, children }) {
  return (
    <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:14, overflow:'hidden' }}>
      <div style={{ display:'flex', alignItems:'center', padding:'12px 16px', borderBottom:'0.5px solid rgba(0,0,0,0.06)', fontWeight:600, fontSize:13, color:'#1A1A18', gap:7 }}>
        <span>{icon}</span>{title}
      </div>
      <div style={{ padding:'0 16px' }}>{children}</div>
    </div>
  )
}

function Row({ children, last }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:last?'none':'0.5px solid rgba(0,0,0,0.05)', gap:8, fontSize:13 }}>
      {children}
    </div>
  )
}

// "2026-06-25" jaisi date ko "Aaj" / "Kal" / "25 Jun" mein convert karta hai
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const today = new Date(); today.setHours(0,0,0,0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  const d = new Date(dateStr)
  if (d.toDateString() === today.toDateString()) return 'Aaj'
  if (d.toDateString() === tomorrow.toDateString()) return 'Kal'
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' })
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1
  const ms = new Date(checkOut) - new Date(checkIn)
  return Math.max(1, Math.round(ms / (1000*60*60*24)))
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { data, loading, error, reload } = useDashboardData()
  const [aiVisible, setAiVisible] = useState(true)

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#F5F4F0', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'#888780' }}>
      <div style={{ fontSize:30 }}>⏳</div>Loading...
    </div>
  )

  if (error) return (
    <div style={{ minHeight:'100vh', background:'#F5F4F0', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:12, color:'#A32D2D' }}>
      {error}
      <button onClick={reload} style={{ padding:'7px 15px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', cursor:'pointer' }}>Phir try karo</button>
    </div>
  )

  const { stats, checkouts, housekeeping, recentBookings, aiTip } = data
  const occ = stats.totalRooms ? Math.round((stats.occupiedRooms / stats.totalRooms) * 100) : 0

  return (
    <div style={{ minHeight:'100vh', background:'#F5F4F0', fontFamily:'system-ui,sans-serif' }}>
      <div style={{ background:'#fff', borderBottom:'0.5px solid rgba(0,0,0,0.08)', padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:15, color:'#1A1A18' }}>HotelMind AI</div>
          <div style={{ fontSize:11, color:'#888780' }}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</div>
        </div>
       <button onClick={() => navigate('/bookings')} style={{ padding:'7px 15px', fontSize:13, fontWeight:600, background:'#1A1A18', color:'#fff', border:'none', borderRadius:8, cursor:'pointer' }}>+ New Booking</button>
      </div>

      <div style={{ padding:'20px 24px', maxWidth:1080, margin:'0 auto' }}>
        {aiVisible && (
          <div style={{ background:'#EEEDFE', border:'0.5px solid #AFA9EC', borderRadius:12, padding:'11px 14px', display:'flex', alignItems:'flex-start', gap:10, marginBottom:18 }}>
            <span style={{ fontSize:18 }}>🤖</span>
            <div style={{ flex:1, fontSize:13, color:'#3C3489', lineHeight:1.6 }}><strong>AI ki salah: </strong>{aiTip}</div>
            <button onClick={() => setAiVisible(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#7F77DD', fontSize:18 }}>×</button>
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:18 }}>
          <StatCard icon="📅" label="Aaj bookings"  value={stats.todayBookings} />
          <StatCard icon="🛏️" label="Occupancy"     value={`${stats.occupiedRooms}/${stats.totalRooms}`} sub={`${occ}% filled`} ok={occ>=70} />
          <StatCard icon="💰" label="Aaj revenue"   value={`Rs.${stats.todayRevenue.toLocaleString('en-IN')}`} />
          <StatCard icon="🚪" label="Checkouts"     value={stats.checkoutsToday}  sub="Aaj" />
          <StatCard icon="😤" label="Complaints"    value={stats.openComplaints}  sub={stats.openComplaints>0?'Action chahiye':'Sab clear!'} ok={stats.openComplaints===0} />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
          <Card title="Aaj ke checkouts" icon="🚪">
            {checkouts.length === 0 && <div style={{ padding:'14px 0', color:'#888780', fontSize:13 }}>Aaj koi checkout nahi hai</div>}
            {checkouts.map((c,i) => (
              <Row key={c.id} last={i===checkouts.length-1}>
                <div>
                  <div style={{ fontWeight:500 }}>{c.guests?.name || 'Guest'}</div>
                  <div style={{ fontSize:12, color:'#888780' }}>Room {c.rooms?.room_number || '-'}</div>
                </div>
                <Badge s={c.status} />
              </Row>
            ))}
          </Card>
          <Card title="Nayi bookings" icon="📋">
            {recentBookings.length === 0 && <div style={{ padding:'14px 0', color:'#888780', fontSize:13 }}>Abhi tak koi booking nahi hai</div>}
            {recentBookings.map((b,i) => (
              <Row key={b.id} last={i===recentBookings.length-1}>
                <div>
                  <div style={{ fontWeight:500 }}>{b.guests?.name || 'Guest'}</div>
                  <div style={{ fontSize:12, color:'#888780' }}>Room {b.rooms?.room_number || '-'} · {formatDate(b.check_in)} · {nightsBetween(b.check_in, b.check_out)} raat</div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>Rs.{(b.total_amount || 0).toLocaleString('en-IN')}</span>
                  <Badge s={b.status} />
                </div>
              </Row>
            ))}
          </Card>
        </div>

        <Card title="Housekeeping tasks" icon="🧹">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:10, padding:'12px 0' }}>
            {housekeeping.length === 0 && <div style={{ padding:'14px 0', color:'#888780', fontSize:13 }}>Abhi koi housekeeping task nahi hai</div>}
            {housekeeping.map(h => (
              <div key={h.id} style={{ border:'0.5px solid rgba(0,0,0,0.07)', borderRadius:10, padding:'11px 13px', background:h.status==='done'?'#F8FFF8':'#fff', opacity:h.status==='done'?0.65:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>Room {h.rooms?.room_number || '-'}</span>
                  <Badge s={h.priority} />
                </div>
                <div style={{ fontSize:13, marginBottom:8 }}>{h.task}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, color:'#888780' }}>👤 {h.assigned || '-'}</span>
                  <Badge s={h.status} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
