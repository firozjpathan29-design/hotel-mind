import { useState, useEffect } from 'react'
import { getBookings, createBooking, createGuest, getRooms } from '../lib/supabase'

const BL = {
  confirmed:   { bg:'#E6F1FB', c:'#0C447C', t:'Confirmed'  },
  checkedin:   { bg:'#E1F5EE', c:'#085041', t:'Checked In' },
  checked_in:  { bg:'#E1F5EE', c:'#085041', t:'Checked In' },
  checkedout:  { bg:'#F5F4F0', c:'#888780', t:'Checked Out'},
  checked_out: { bg:'#F5F4F0', c:'#888780', t:'Checked Out'},
  cancelled:   { bg:'#FCEBEB', c:'#A32D2D', t:'Cancelled'  },
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1
  const ms = new Date(checkOut) - new Date(checkIn)
  return Math.max(1, Math.round(ms / (1000*60*60*24)))
}

export default function Bookings() {
  const [list, setList]       = useState([])
  const [rooms, setRooms]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [show, setShow]       = useState(false)
  const [saving, setSaving]   = useState(false)
  const [f, setF] = useState({ guest:'', phone:'', roomId:'', checkIn:'', checkOut:'', amount:'' })
  const s = (k,v) => setF(p => ({...p,[k]:v}))

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [b, r] = await Promise.all([getBookings(), getRooms()])
      setList(b)
      setRooms(r)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Bookings load nahi hue. Internet check karo ya page refresh karo.')
    } finally {
      setLoading(false)
    }
  }

  async function addBooking() {
    if (!f.guest || !f.roomId || !f.checkIn || !f.checkOut) return
    setSaving(true)
    try {
      const guest = await createGuest({ name: f.guest, phone: f.phone })
      await createBooking({
        guest_id: guest.id,
        room_id: f.roomId,
        check_in: f.checkIn,
        check_out: f.checkOut,
        total_amount: Number(f.amount) || 0,
        status: 'confirmed',
      })
      setShow(false)
      setF({ guest:'', phone:'', roomId:'', checkIn:'', checkOut:'', amount:'' })
      await load()
    } catch (err) {
      console.error(err)
      alert('Booking save nahi hui, dobara try karo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#888780' }}>⏳ Bookings load ho rahe hain...</div>
  )

  if (error) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#A32D2D' }}>
      {error}
      <div style={{ marginTop:10 }}>
        <button onClick={load} style={{ padding:'7px 15px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', cursor:'pointer' }}>Phir try karo</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding:'20px 24px', maxWidth:900, margin:'0 auto' }}>
      {show && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:24, width:440, maxWidth:'90vw' }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>New Booking</div>

            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>Guest naam</label>
              <input value={f.guest} onChange={e=>s('guest',e.target.value)} placeholder="Ramesh Patel"
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>Phone</label>
              <input value={f.phone} onChange={e=>s('phone',e.target.value)} placeholder="98765 43210"
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>Room</label>
              <select value={f.roomId} onChange={e=>s('roomId',e.target.value)}
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', boxSizing:'border-box' }}>
                <option value="">Room chuno</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>#{r.room_number} · {r.room_type} · Rs.{r.price_per_night}/raat {r.status!=='available' ? `(${r.status})` : ''}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>Amount (Rs.)</label>
              <input value={f.amount} onChange={e=>s('amount',e.target.value)} placeholder="2400"
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:14 }}>
              {[{ k:'checkIn',l:'Check-in'},{ k:'checkOut',l:'Check-out'}].map(({ k,l }) => (
                <div key={k}>
                  <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>{l}</label>
                  <input type="date" value={f[k]} onChange={e=>s(k,e.target.value)}
                    style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none' }}/>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShow(false)} style={{ flex:1, padding:'9px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', background:'#fff', fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={addBooking} disabled={!f.guest||!f.roomId||saving}
                style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving?0.6:1 }}>
                {saving ? 'Saving...' : 'Add Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:'#1A1A18' }}>📋 Bookings</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#888780' }}>{list.filter(b=>b.status==='checked_in'||b.status==='checkedin').length} checked in</p>
        </div>
        <button onClick={() => setShow(true)} style={{ padding:'8px 16px', borderRadius:8, background:'#1A1A18', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>+ New Booking</button>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'#888780' }}>Abhi tak koi booking nahi hai. "+ New Booking" se shuru karo.</div>
      ) : (
        <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:14, overflow:'hidden' }}>
          {list.map((b,i) => {
            const bs = BL[b.status] || { bg:'#F5F4F0', c:'#888780', t:b.status }
            const guestName = b.guests?.name || 'Guest'
            return (
              <div key={b.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:i<list.length-1?'0.5px solid rgba(0,0,0,0.05)':'none', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'#EEEDFE', color:'#3C3489', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, flexShrink:0 }}>
                    {guestName.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{guestName}</div>
                    <div style={{ fontSize:11, color:'#888780' }}>{b.guests?.phone || '-'} · Room {b.rooms?.room_number || '-'} ({b.rooms?.room_type || '-'})</div>
                    <div style={{ fontSize:11, color:'#888780' }}>{b.check_in} → {b.check_out} · {nightsBetween(b.check_in, b.check_out)} raat</div>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                  <span style={{ fontWeight:700, fontSize:13, color:'#0F6E56' }}>Rs.{Number(b.total_amount || 0).toLocaleString('en-IN')}</span>
                  <span style={{ background:bs.bg, color:bs.c, fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20 }}>{bs.t}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
