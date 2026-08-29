import { useState, useEffect } from 'react'
import { generateComplaintReply } from '../lib/claude'
import { getComplaints, resolveComplaint, createComplaint, createGuest, getRooms } from '../lib/supabase'

const BD = {
  open:       { bg:'#FCEBEB', c:'#A32D2D', l:'Open'        },
  resolved:   { bg:'#E1F5EE', c:'#085041', l:'Resolved'    },
  inprogress: { bg:'#EEEDFE', c:'#3C3489', l:'In Progress' },
}

export default function Complaints() {
  const [list, setList]       = useState([])
  const [rooms, setRooms]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [gen, setGen]         = useState(null)
  const [filter, setFilter]   = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [f, setF]             = useState({ guest:'', roomId:'', phone:'', message:'' })
  const set = (k,v) => setF(p => ({...p,[k]:v}))

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [c, r] = await Promise.all([getComplaints(), getRooms()])
      setList(c)
      setRooms(r)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Complaints load nahi hue. Internet check karo ya page refresh karo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleReply(c) {
    setGen(c.id)
    try {
      const reply = await generateComplaintReply(c.message, c.guests && c.guests.name, c.rooms && c.rooms.room_number)
      setList(p => p.map(x => x.id===c.id ? {...x, ai_reply:reply} : x))
    } catch(e) {
      console.error(e)
      alert('AI reply generate nahi hua — Claude API key .env mein check karo.')
    }
    setGen(null)
  }

  async function handleResolve(c) {
    setList(p => p.map(x => x.id===c.id ? {...x, status:'resolved'} : x)) // optimistic
    try {
      await resolveComplaint(c.id, c.ai_reply || null)
    } catch (err) {
      console.error(err)
      alert('Resolve save nahi hua, dobara try karo.')
      load()
    }
  }

  async function handleAdd() {
    if (!f.guest || !f.roomId || !f.message) return
    setSaving(true)
    try {
      const guest = await createGuest({ name: f.guest, phone: f.phone })
      await createComplaint({
        guest_id: guest.id,
        room_id: f.roomId,
        message: f.message,
        status: 'open',
      })
      setShowAdd(false)
      setF({ guest:'', roomId:'', phone:'', message:'' })
      await load()
    } catch (err) {
      console.error(err)
      alert('Complaint save nahi hua, dobara try karo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#888780' }}>⏳ Complaints load ho rahe hain...</div>
  )

  if (error) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#A32D2D' }}>
      {error}
      <div style={{ marginTop:10 }}>
        <button onClick={load} style={{ padding:'7px 15px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', cursor:'pointer' }}>Phir try karo</button>
      </div>
    </div>
  )

  const filtered   = filter==='all' ? list : list.filter(c => c.status===filter)
  const openCount  = list.filter(c => c.status==='open').length

  return (
    <div style={{ padding:'20px 24px', maxWidth:720, margin:'0 auto' }}>

      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:24, width:400, maxWidth:'90vw' }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>New Complaint Add Karo</div>

            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>Guest ka naam</label>
              <input value={f.guest} onChange={e=>set('guest',e.target.value)} placeholder="Ramesh Patel"
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>Phone number</label>
              <input value={f.phone} onChange={e=>set('phone',e.target.value)} placeholder="98765 43210"
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>Room</label>
              <select value={f.roomId} onChange={e=>set('roomId',e.target.value)}
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', boxSizing:'border-box' }}>
                <option value="">Room chuno</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>#{r.room_number} · {r.room_type}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>Complaint</label>
              <textarea value={f.message} onChange={e=>set('message',e.target.value)} placeholder="Guest ki problem yahan likhein..." rows={3}
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex:1, padding:'9px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', background:'#fff', fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={handleAdd} disabled={!f.guest||!f.roomId||!f.message||saving}
                style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving?0.6:1 }}>
                {saving ? 'Saving...' : 'Add Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:'#1A1A18' }}>😤 Complaints</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#888780' }}>
            {openCount > 0 ? openCount+' complaint ka jawab dena hai' : 'Sab complaints resolve ho gayi! 🎉'}
          </p>
        </div>
        <button onClick={() => setShowAdd(true)} style={{ padding:'8px 16px', borderRadius:8, background:'#1A1A18', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>+ Add</button>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[
          { k:'all',      l:'Sab ('      +list.length+')' },
          { k:'open',     l:'Open ('     +list.filter(c=>c.status==='open').length+')'     },
          { k:'resolved', l:'Resolved (' +list.filter(c=>c.status==='resolved').length+')' },
        ].map(({ k,l }) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding:'5px 12px', borderRadius:20,
            border:'0.5px solid rgba(0,0,0,0.12)',
            background: filter===k ? '#1A1A18' : '#fff',
            color:      filter===k ? '#fff'    : '#888780',
            fontSize:12, cursor:'pointer',
          }}>{l}</button>
        ))}
      </div>

      {filtered.length === 0
        ? <div style={{ textAlign:'center', padding:40, color:'#888780', fontSize:14 }}>Koi complaint nahi ✅</div>
        : filtered.map(c => {
          const bs = BD[c.status] || { bg:'#F5F4F0', c:'#888780', l:c.status }
          return (
            <div key={c.id} style={{ background:'#fff', border:'0.5px solid '+(c.status==='open'?'rgba(163,45,45,0.2)':'rgba(0,0,0,0.08)'), borderRadius:12, padding:16, marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'#FAEEDA', color:'#633806', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13 }}>
                    {c.guests && c.guests.name ? c.guests.name.charAt(0) : 'G'}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13 }}>{c.guests && c.guests.name}</div>
                    <div style={{ fontSize:11, color:'#888780' }}>Room {c.rooms && c.rooms.room_number} · {c.guests && c.guests.phone}</div>
                  </div>
                </div>
                <span style={{ background:bs.bg, color:bs.c, fontSize:11, fontWeight:600, padding:'2px 9px', borderRadius:20 }}>{bs.l}</span>
              </div>

              <div style={{ background:'#FFF8F0', border:'0.5px solid rgba(239,159,39,0.2)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#1A1A18', marginBottom:10 }}>
                😤 "{c.message}"
              </div>

              {c.ai_reply && (
                <div style={{ background:'#EEEDFE', border:'0.5px solid rgba(127,119,221,0.3)', borderRadius:8, padding:'9px 12px', fontSize:13, color:'#2D2870', marginBottom:10, display:'flex', gap:8 }}>
                  <span style={{ fontSize:16 }}>🤖</span>
                  <div>
                    <div style={{ fontSize:11, fontWeight:600, opacity:0.6, marginBottom:3 }}>AI Reply (bheja gaya):</div>
                    {c.ai_reply}
                  </div>
                </div>
              )}

              {c.status === 'open' && (
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => handleReply(c)} disabled={gen===c.id} style={{ flex:1, padding:'7px 14px', borderRadius:8, border:'0.5px solid rgba(127,119,221,0.4)', background:'#EEEDFE', color:'#3C3489', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    {gen===c.id ? '⏳ AI likh raha hai...' : '🤖 AI Reply Generate'}
                  </button>
                  <button onClick={() => handleResolve(c)} style={{ padding:'7px 14px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>✅ Resolve</button>
                </div>
              )}
            </div>
          )
        })
      }
    </div>
  )
}
