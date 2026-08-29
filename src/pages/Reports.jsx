import { useState, useEffect } from 'react'
import { getBookings, getComplaints, getHousekeepingTasks, getRooms } from '../lib/supabase'

function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x }
function startOfWeek(d) { const x = startOfDay(d); const day = x.getDay(); const diff = day===0?6:day-1; x.setDate(x.getDate()-diff); return x }
function startOfMonth(d) { const x = startOfDay(d); x.setDate(1); return x }

function inRange(dateStr, from) {
  if (!dateStr) return false
  return new Date(dateStr) >= from
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1
  const ms = new Date(checkOut) - new Date(checkIn)
  return Math.max(1, Math.round(ms / (1000*60*60*24)))
}

function downloadCSV(rows, filename) {
  const header = ['Guest','Phone','Room','Check-in','Check-out','Nights','Amount','Status']
  const lines = rows.map(b => [
    b.guests?.name || '-',
    b.guests?.phone || '-',
    b.rooms?.room_number || '-',
    b.check_in || '-',
    b.check_out || '-',
    nightsBetween(b.check_in, b.check_out),
    b.total_amount || 0,
    b.status || '-',
  ].join(','))
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function StatCard({ icon, label, value }) {
  return (
    <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:12, padding:'14px 16px' }}>
      <div style={{ fontSize:11, color:'#888780', marginBottom:6 }}>{icon} {label}</div>
      <div style={{ fontSize:22, fontWeight:700, color:'#1A1A18', lineHeight:1 }}>{value}</div>
    </div>
  )
}

export default function Reports() {
  const [bookings, setBookings]       = useState([])
  const [complaints, setComplaints]   = useState([])
  const [housekeeping, setHousekeeping] = useState([])
  const [rooms, setRooms]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [range, setRange]             = useState('today')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [b, c, h, r] = await Promise.all([
        getBookings(), getComplaints(), getHousekeepingTasks(), getRooms(),
      ])
      setBookings(b); setComplaints(c); setHousekeeping(h); setRooms(r)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Reports load nahi hue. Internet check karo ya page refresh karo.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#888780' }}>⏳ Reports load ho rahe hain...</div>
  )
  if (error) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#A32D2D' }}>
      {error}
      <div style={{ marginTop:10 }}>
        <button onClick={load} style={{ padding:'7px 15px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', cursor:'pointer' }}>Phir try karo</button>
      </div>
    </div>
  )

  const now = new Date()
  const from = range==='today' ? startOfDay(now) : range==='week' ? startOfWeek(now) : startOfMonth(now)

  const filteredBookings    = bookings.filter(b => inRange(b.created_at || b.check_in, from))
  const filteredPaid        = filteredBookings.filter(b => b.payment_status === 'paid')
  const filteredComplaints  = complaints.filter(c => inRange(c.created_at, from))
  const filteredHK          = housekeeping.filter(t => inRange(t.created_at, from) && t.status === 'done')

  const totalRevenue = filteredPaid.reduce((s,b) => s + Number(b.paid_amount || b.total_amount || 0), 0)
  const totalNights  = filteredBookings.reduce((s,b) => s + nightsBetween(b.check_in, b.check_out), 0)
  const avgOccupancy = rooms.length ? Math.round((totalNights / (rooms.length * (range==='today'?1:range==='week'?7:30))) * 100) : 0

  const RANGES = [
    { k:'today', l:'Aaj' },
    { k:'week',  l:'Yeh Hafta' },
    { k:'month', l:'Yeh Mahina' },
  ]

  return (
    <div style={{ padding:'20px 24px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:'#1A1A18' }}>📊 Reports</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#888780' }}>Business summary aur export</p>
        </div>
        <button onClick={() => downloadCSV(filteredBookings, `report-${range}-${Date.now()}.csv`)}
          style={{ padding:'8px 16px', borderRadius:8, background:'#1A1A18', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>
          ⬇️ CSV Export
        </button>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {RANGES.map(({ k,l }) => (
          <button key={k} onClick={() => setRange(k)} style={{
            padding:'7px 16px', borderRadius:20, border:'0.5px solid rgba(0,0,0,0.12)',
            background: range===k ? '#1A1A18' : '#fff',
            color:      range===k ? '#fff'    : '#888780',
            fontSize:13, fontWeight:500, cursor:'pointer',
          }}>{l}</button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12, marginBottom:20 }}>
        <StatCard icon="📅" label="Bookings"    value={filteredBookings.length} />
        <StatCard icon="💰" label="Revenue"     value={`Rs.${totalRevenue.toLocaleString('en-IN')}`} />
        <StatCard icon="🛏️" label="Nights Sold" value={totalNights} />
        <StatCard icon="📈" label="Avg Occupancy" value={`${avgOccupancy}%`} />
        <StatCard icon="😤" label="Complaints"  value={filteredComplaints.length} />
        <StatCard icon="🧹" label="Tasks Done"  value={filteredHK.length} />
      </div>

      <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ padding:'12px 16px', borderBottom:'0.5px solid rgba(0,0,0,0.06)', fontWeight:600, fontSize:13, color:'#1A1A18' }}>
          Bookings ({filteredBookings.length})
        </div>
        {filteredBookings.length === 0 ? (
          <div style={{ padding:'30px', textAlign:'center', color:'#888780', fontSize:13 }}>Is period mein koi booking nahi hai</div>
        ) : (
          <div>
            {filteredBookings.map((b,i) => (
              <div key={b.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 16px', borderBottom:i<filteredBookings.length-1?'0.5px solid rgba(0,0,0,0.05)':'none', fontSize:13 }}>
                <div>
                  <div style={{ fontWeight:500 }}>{b.guests?.name || 'Guest'}</div>
                  <div style={{ fontSize:11, color:'#888780' }}>Room {b.rooms?.room_number || '-'} · {b.check_in} → {b.check_out}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontWeight:700, color:'#0F6E56' }}>Rs.{Number(b.total_amount||0).toLocaleString('en-IN')}</div>
                  <div style={{ fontSize:11, color:'#888780' }}>{b.payment_status === 'paid' ? '✅ Paid' : '⏳ Pending'}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
