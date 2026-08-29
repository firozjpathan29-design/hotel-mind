import { useState, useEffect } from 'react'
import { getGuests, createGuest } from '../lib/supabase'

function computeStats(guest) {
  const bookings = guest.bookings || []
  const visits = bookings.length
  const totalSpend = bookings.reduce((s, b) => s + (b.total_amount || 0), 0)
  const sorted = [...bookings].sort((a, b) => new Date(b.check_in) - new Date(a.check_in))
  const lastVisit = sorted[0]?.check_in || null
  const vip = visits >= 3 || totalSpend >= 15000
  return { visits, totalSpend, lastVisit, vip }
}

function formatLastVisit(dateStr) {
  if (!dateStr) return 'Pehli baar'
  const today = new Date(); today.setHours(0,0,0,0)
  const d = new Date(dateStr)
  if (d.toDateString() === today.toDateString()) return 'Aaj'
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
}

export default function Guests() {
  const [list, setList]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [search, setSearch]   = useState('')
  const [show, setShow]       = useState(false)
  const [saving, setSaving]   = useState(false)
  const [f, setF]             = useState({ name:'', phone:'', email:'' })

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const data = await getGuests()
      setList(data)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Guests load nahi hue. Internet check karo ya page refresh karo.')
    } finally {
      setLoading(false)
    }
  }

  const filtered = list.filter(g =>
    g.name.toLowerCase().includes(search.toLowerCase()) || (g.phone || '').includes(search)
  )

  async function addGuest() {
    if (!f.name || !f.phone) return
    setSaving(true)
    try {
      await createGuest({ name: f.name, phone: f.phone, email: f.email || null })
      setShow(false)
      setF({ name:'', phone:'', email:'' })
      await load()
    } catch (err) {
      console.error(err)
      alert('Guest save nahi hua, dobara try karo.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#888780' }}>⏳ Guests load ho rahe hain...</div>
  )

  if (error) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#A32D2D' }}>
      {error}
      <div style={{ marginTop:10 }}>
        <button onClick={load} style={{ padding:'7px 15px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', cursor:'pointer' }}>Phir try karo</button>
      </div>
    </div>
  )

  const vipCount = list.filter(g => computeStats(g).vip).length

  return (
    <div style={{ padding:'20px 24px', maxWidth:800, margin:'0 auto' }}>
      {show && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:24, width:360, maxWidth:'90vw' }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>New Guest</div>
            {[
              { k:'name',  l:'Naam',  ph:'Ramesh Patel'  },
              { k:'phone', l:'Phone', ph:'98765 43210'   },
              { k:'email', l:'Email', ph:'(optional)'    },
            ].map(({ k,l,ph }) => (
              <div key={k} style={{ marginBottom:10 }}>
                <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>{l}</label>
                <input value={f[k]} onChange={e=>setF(p=>({...p,[k]:e.target.value}))} placeholder={ph}
                  style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', boxSizing:'border-box' }}/>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:4 }}>
              <button onClick={() => setShow(false)} style={{ flex:1, padding:'9px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', background:'#fff', fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={addGuest} disabled={!f.name||!f.phone||saving}
                style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving?0.6:1 }}>
                {saving ? 'Saving...' : 'Add Guest'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:'#1A1A18' }}>👥 Guests</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#888780' }}>{list.length} total · {vipCount} VIP</p>
        </div>
        <button onClick={() => setShow(true)} style={{ padding:'8px 16px', borderRadius:8, background:'#1A1A18', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>+ Add Guest</button>
      </div>

      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Naam ya phone se dhundho..."
        style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', marginBottom:12, boxSizing:'border-box', background:'#fff' }}/>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'#888780' }}>Koi guest nahi mila.</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(g => {
            const { visits, totalSpend, lastVisit, vip } = computeStats(g)
            return (
              <div key={g.id} style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:12, padding:'13px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:vip?'#FAEEDA':'#EEEDFE', color:vip?'#633806':'#3C3489', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:14 }}>
                    {g.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
                      {g.name}
                      {vip && <span style={{ fontSize:10, fontWeight:700, padding:'1px 6px', borderRadius:20, background:'#FAEEDA', color:'#633806' }}>VIP</span>}
                    </div>
                    <div style={{ fontSize:11, color:'#888780' }}>{g.phone}{g.email ? ' · '+g.email : ''}</div>
                    <div style={{ fontSize:11, color:'#888780' }}>{visits} visits · Last: {formatLastVisit(lastVisit)}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#0F6E56' }}>Rs.{totalSpend.toLocaleString('en-IN')}</div>
                  <div style={{ fontSize:11, color:'#888780' }}>Total spend</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
