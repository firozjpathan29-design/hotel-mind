import { useState, useEffect } from 'react'
import { getRooms, updateRoomStatus } from '../lib/supabase'

const ST = {
  available:   { bg:'#E1F5EE', c:'#085041', dot:'#1D9E75', label:'Available'   },
  occupied:    { bg:'#FAEEDA', c:'#633806', dot:'#EF9F27', label:'Occupied'    },
  cleaning:    { bg:'#FCEBEB', c:'#A32D2D', dot:'#E24B4A', label:'Cleaning'    },
  maintenance: { bg:'#EEEDFE', c:'#3C3489', dot:'#7F77DD', label:'Maintenance' },
}

export default function Rooms() {
  const [rooms, setRooms]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filter, setFilter]   = useState('all')

  useEffect(() => {
    loadRooms()
  }, [])

  async function loadRooms() {
    try {
      setLoading(true)
      const data = await getRooms()
      setRooms(data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Rooms load nahi hue. Internet check karo ya page refresh karo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(roomId, newStatus) {
    // UI turant update karo (optimistic)
    setRooms(prev => prev.map(x => x.id === roomId ? { ...x, status: newStatus } : x))
    try {
      await updateRoomStatus(roomId, newStatus)
    } catch (err) {
      console.error(err)
      alert('Status save nahi hua, dobara try karo.')
      loadRooms() // revert with real data
    }
  }

  const filtered = filter === 'all' ? rooms : rooms.filter(r => r.status === filter)
  const cnt = {
    available: rooms.filter(r => r.status==='available').length,
    occupied:  rooms.filter(r => r.status==='occupied').length,
    cleaning:  rooms.filter(r => r.status==='cleaning').length,
  }

  if (loading) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#888780' }}>⏳ Rooms load ho rahe hain...</div>
  )

  if (error) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#A32D2D' }}>
      {error}
      <div style={{ marginTop:10 }}>
        <button onClick={loadRooms} style={{ padding:'7px 15px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', cursor:'pointer' }}>Phir try karo</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding:'20px 24px', maxWidth:1080, margin:'0 auto' }}>
      <div style={{ marginBottom:20 }}>
        <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:'#1A1A18' }}>🛏️ Rooms</h1>
        <p style={{ margin:'4px 0 0', fontSize:13, color:'#888780' }}>{cnt.available} available · {cnt.occupied} occupied · {cnt.cleaning} cleaning</p>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
        {[
          { k:'available', l:'Available', bg:'#E1F5EE', c:'#085041' },
          { k:'occupied',  l:'Occupied',  bg:'#FAEEDA', c:'#633806' },
          { k:'cleaning',  l:'Cleaning',  bg:'#FCEBEB', c:'#A32D2D' },
        ].map(s => (
          <div key={s.k} style={{ background:s.bg, borderRadius:10, padding:'10px', textAlign:'center', cursor:'pointer' }}
            onClick={() => setFilter(filter===s.k ? 'all' : s.k)}>
            <div style={{ fontSize:20, fontWeight:700, color:s.c }}>{cnt[s.k]}</div>
            <div style={{ fontSize:11, color:s.c, opacity:0.7 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {rooms.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'#888780' }}>Koi rooms nahi mile. Supabase mein rooms add karo.</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:10 }}>
          {filtered.map(r => {
            const s = ST[r.status] || ST.available
            return (
              <div key={r.id} style={{ background:'#fff', border:`1.5px solid ${s.dot}33`, borderRadius:12, padding:'12px 14px' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                  <span style={{ fontWeight:700, fontSize:15 }}>#{r.room_number}</span>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:s.dot }} />
                </div>
                <div style={{ fontSize:12, color:'#888780', marginBottom:3 }}>{r.room_type}</div>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:9 }}>Rs.{r.price_per_night}/raat</div>
                <select
                  value={r.status}
                  onChange={e => handleStatusChange(r.id, e.target.value)}
                  style={{ width:'100%', padding:'5px 8px', borderRadius:6, border:`0.5px solid ${s.dot}66`, background:s.bg, color:s.c, fontSize:11, fontWeight:600, cursor:'pointer' }}
                >
                  <option value="available">Available</option>
                  <option value="occupied">Occupied</option>
                  <option value="cleaning">Cleaning</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
