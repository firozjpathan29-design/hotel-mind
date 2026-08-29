import { useState, useEffect } from 'react'
import { getBookings, getRooms } from '../lib/supabase'

function monthKey(d) {
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}`
}

function monthLabel(key) {
  const [y, m] = key.split('-')
  const dt = new Date(Number(y), Number(m)-1)
  return dt.toLocaleDateString('en-IN', { month:'short', year:'2-digit' })
}

function last6MonthKeys() {
  const keys = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1)
    keys.push(monthKey(d))
  }
  return keys
}

const STATUS_LABELS = {
  confirmed:   { l:'Confirmed',   c:'#0C447C' },
  checked_in:  { l:'Checked In',  c:'#085041' },
  checkedin:   { l:'Checked In',  c:'#085041' },
  checked_out: { l:'Checked Out', c:'#888780' },
  checkedout:  { l:'Checked Out', c:'#888780' },
  cancelled:   { l:'Cancelled',   c:'#A32D2D' },
}

function Card({ title, icon, children }) {
  return (
    <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:14, overflow:'hidden', marginBottom:16 }}>
      <div style={{ padding:'12px 16px', borderBottom:'0.5px solid rgba(0,0,0,0.06)', fontWeight:600, fontSize:13, color:'#1A1A18', display:'flex', alignItems:'center', gap:7 }}>
        <span>{icon}</span>{title}
      </div>
      <div style={{ padding:16 }}>{children}</div>
    </div>
  )
}

export default function Analytics() {
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [b, r] = await Promise.all([getBookings(), getRooms()])
      setBookings(b)
      setRooms(r)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Analytics load nahi hua. Internet check karo ya page refresh karo.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#888780' }}>⏳ Analytics load ho raha hai...</div>
  )
  if (error) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#A32D2D' }}>
      {error}
      <div style={{ marginTop:10 }}>
        <button onClick={load} style={{ padding:'7px 15px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', cursor:'pointer' }}>Phir try karo</button>
      </div>
    </div>
  )

  // Revenue trend (last 6 months, paid bookings)
  const monthKeys = last6MonthKeys()
  const revenueByMonth = {}
  monthKeys.forEach(k => revenueByMonth[k] = 0)
  bookings.filter(b => b.payment_status === 'paid').forEach(b => {
    const k = monthKey(b.paid_at || b.created_at || b.check_in)
    if (k in revenueByMonth) revenueByMonth[k] += Number(b.paid_amount || b.total_amount || 0)
  })
  const maxRevenue = Math.max(1, ...Object.values(revenueByMonth))

  // Room type performance
  const roomTypeStats = {}
  rooms.forEach(r => {
    if (!roomTypeStats[r.room_type]) roomTypeStats[r.room_type] = { rooms:0, bookings:0, revenue:0 }
    roomTypeStats[r.room_type].rooms++
  })
  bookings.forEach(b => {
    const type = b.rooms?.room_type
    if (!type) return
    if (!roomTypeStats[type]) roomTypeStats[type] = { rooms:0, bookings:0, revenue:0 }
    roomTypeStats[type].bookings++
    roomTypeStats[type].revenue += Number(b.total_amount || 0)
  })

  // Status breakdown
  const statusCounts = {}
  bookings.forEach(b => { statusCounts[b.status] = (statusCounts[b.status] || 0) + 1 })

  // Top guests by spend
  const guestMap = {}
  bookings.forEach(b => {
    const name = b.guests?.name
    if (!name) return
    if (!guestMap[name]) guestMap[name] = { visits:0, spend:0 }
    guestMap[name].visits++
    guestMap[name].spend += Number(b.total_amount || 0)
  })
  const topGuests = Object.entries(guestMap)
    .sort((a,b) => b[1].spend - a[1].spend)
    .slice(0, 5)

  const totalRevenue = bookings.filter(b => b.payment_status==='paid').reduce((s,b) => s + Number(b.paid_amount || b.total_amount || 0), 0)
  const totalBookings = bookings.length
  const occupiedNow = rooms.filter(r => r.status === 'occupied').length

  return (
    <div style={{ padding:'20px 24px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:18 }}>
        <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:'#1A1A18' }}>📈 Analytics</h1>
        <p style={{ margin:'4px 0 0', fontSize:13, color:'#888780' }}>Business performance overview</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:18 }}>
        {[
          { l:'Total Revenue',  v:`Rs.${totalRevenue.toLocaleString('en-IN')}`, bg:'#E1F5EE', c:'#085041' },
          { l:'Total Bookings', v:totalBookings, bg:'#E6F1FB', c:'#0C447C' },
          { l:'Rooms Occupied', v:`${occupiedNow}/${rooms.length}`, bg:'#FAEEDA', c:'#633806' },
        ].map(s => (
          <div key={s.l} style={{ background:s.bg, borderRadius:10, padding:'14px', textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:700, color:s.c }}>{s.v}</div>
            <div style={{ fontSize:11, color:s.c, opacity:0.7, marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <Card title="Revenue Trend (pichle 6 mahine)" icon="💰">
        <div style={{ display:'flex', alignItems:'flex-end', gap:10, height:140 }}>
          {monthKeys.map(k => {
            const val = revenueByMonth[k]
            const heightPct = Math.max(4, (val / maxRevenue) * 100)
            return (
              <div key={k} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
                <div style={{ fontSize:11, fontWeight:600, color:'#1A1A18' }}>
                  {val > 0 ? `Rs.${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}` : '-'}
                </div>
                <div style={{ width:'100%', height:`${heightPct}%`, minHeight:4, background:'#1D9E75', borderRadius:'6px 6px 0 0', transition:'height 0.3s' }} />
                <div style={{ fontSize:11, color:'#888780' }}>{monthLabel(k)}</div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card title="Room Type Performance" icon="🛏️">
        {Object.keys(roomTypeStats).length === 0 ? (
          <div style={{ color:'#888780', fontSize:13 }}>Abhi data nahi hai</div>
        ) : (
          <div>
            {Object.entries(roomTypeStats).map(([type, s], i, arr) => (
              <div key={type} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:i<arr.length-1?'0.5px solid rgba(0,0,0,0.05)':'none', fontSize:13 }}>
                <div>
                  <div style={{ fontWeight:600 }}>{type}</div>
                  <div style={{ fontSize:11, color:'#888780' }}>{s.rooms} rooms · {s.bookings} bookings</div>
                </div>
                <div style={{ fontWeight:700, color:'#0F6E56' }}>Rs.{s.revenue.toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Booking Status Breakdown" icon="📋">
        {Object.keys(statusCounts).length === 0 ? (
          <div style={{ color:'#888780', fontSize:13 }}>Abhi data nahi hai</div>
        ) : (
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {Object.entries(statusCounts).map(([status, count]) => {
              const sl = STATUS_LABELS[status] || { l:status, c:'#888780' }
              return (
                <div key={status} style={{ flex:'1 1 100px', background:'#F5F4F0', borderRadius:10, padding:'10px 14px', textAlign:'center' }}>
                  <div style={{ fontSize:18, fontWeight:700, color:sl.c }}>{count}</div>
                  <div style={{ fontSize:11, color:'#888780' }}>{sl.l}</div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card title="Top Guests (by spend)" icon="👑">
        {topGuests.length === 0 ? (
          <div style={{ color:'#888780', fontSize:13 }}>Abhi koi guest data nahi hai</div>
        ) : (
          <div>
            {topGuests.map(([name, s], i, arr) => (
              <div key={name} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:i<arr.length-1?'0.5px solid rgba(0,0,0,0.05)':'none', fontSize:13 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontWeight:700, color:'#888780', width:18 }}>#{i+1}</span>
                  <span style={{ fontWeight:600 }}>{name}</span>
                  <span style={{ fontSize:11, color:'#888780' }}>· {s.visits} visits</span>
                </div>
                <div style={{ fontWeight:700, color:'#0F6E56' }}>Rs.{s.spend.toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
