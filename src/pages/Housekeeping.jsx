import { useState, useEffect } from 'react'
import { suggestHousekeepingTasks } from '../lib/claude'
import { getHousekeepingTasks, createTask, updateTaskStatus, reassignTask, getRooms } from '../lib/supabase'

const STAFF = ['Raju', 'Sita', 'Mohan', 'Geeta', 'Ramesh']

const SC = {
  pending:    { bg:'#FAEEDA', c:'#633806', l:'Pending',     next:'inprogress', nl:'Shuru Karo' },
  inprogress: { bg:'#EEEDFE', c:'#3C3489', l:'In Progress', next:'done',       nl:'Done Karo'  },
  done:       { bg:'#E1F5EE', c:'#085041', l:'Done',        next:null                          },
}
const PC = {
  high:   { bg:'#FCEBEB', c:'#A32D2D', l:'🔴 High'   },
  medium: { bg:'#FAEEDA', c:'#633806', l:'🟡 Medium' },
  low:    { bg:'#EAF3DE', c:'#27500A', l:'🟢 Low'    },
}

export default function Housekeeping() {
  const [tasks, setTasks]     = useState([])
  const [rooms, setRooms]     = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [filter, setFilter]   = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [aiLoad, setAiLoad]   = useState(false)
  const [f, setF]             = useState({ roomId:'', task:'', priority:'medium', assigned:STAFF[0] })
  const fs = (k,v) => setF(p => ({...p,[k]:v}))

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [t, r] = await Promise.all([getHousekeepingTasks(), getRooms()])
      setTasks(t)
      setRooms(r)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Tasks load nahi hue. Internet check karo ya page refresh karo.')
    } finally {
      setLoading(false)
    }
  }

  async function changeStatus(id, newStatus) {
    setTasks(p => p.map(t => t.id===id ? {...t, status:newStatus} : t)) // optimistic
    try {
      await updateTaskStatus(id, newStatus)
    } catch (err) {
      console.error(err)
      alert('Status save nahi hua, dobara try karo.')
      load()
    }
  }

  async function reassign(id, staff) {
    setTasks(p => p.map(t => t.id===id ? {...t, assigned:staff} : t)) // optimistic
    try {
      await reassignTask(id, staff)
    } catch (err) {
      console.error(err)
      alert('Reassign save nahi hua, dobara try karo.')
      load()
    }
  }

  async function addTask() {
    if (!f.roomId || !f.task) return
    setSaving(true)
    try {
      await createTask({
        room_id: f.roomId,
        task: f.task,
        priority: f.priority,
        assigned: f.assigned,
        status: 'pending',
      })
      setShowAdd(false)
      setF({ roomId:'', task:'', priority:'medium', assigned:STAFF[0] })
      await load()
    } catch (err) {
      console.error(err)
      alert('Task save nahi hua, dobara try karo.')
    } finally {
      setSaving(false)
    }
  }

  async function handleAI() {
    setAiLoad(true)
    try {
      const cleaningRooms = rooms.filter(r => r.status === 'cleaning' || r.status === 'occupied').slice(0, 2)
      if (cleaningRooms.length === 0) {
        alert('Abhi koi room cleaning/occupied nahi hai AI suggestions ke liye.')
        return
      }
      const suggestions = await suggestHousekeepingTasks(
        cleaningRooms.map(r => ({ room: r.room_number, guest: '' }))
      )
      if (suggestions && suggestions.length) {
        let createdCount = 0
        for (const s of suggestions) {
          const room = rooms.find(r => r.room_number === s.room)
          if (!room) continue
          for (const t of (s.tasks || [])) {
            await createTask({
              room_id: room.id,
              task: t,
              priority: s.priority || 'medium',
              assigned: STAFF[0],
              status: 'pending',
            })
            createdCount++
          }
        }
        await load()
        alert('AI ne ' + createdCount + ' tasks suggest kiye — list mein add ho gaye!')
      }
    } catch(e) {
      console.error(e)
      alert('AI connect nahi hua. Claude API key check karo.')
    }
    setAiLoad(false)
  }

  if (loading) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#888780' }}>⏳ Tasks load ho rahe hain...</div>
  )

  if (error) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#A32D2D' }}>
      {error}
      <div style={{ marginTop:10 }}>
        <button onClick={load} style={{ padding:'7px 15px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', cursor:'pointer' }}>Phir try karo</button>
      </div>
    </div>
  )

  const filtered = filter==='all' ? tasks : tasks.filter(t => t.status===filter)
  const counts   = {
    pending:    tasks.filter(t => t.status==='pending').length,
    inprogress: tasks.filter(t => t.status==='inprogress').length,
    done:       tasks.filter(t => t.status==='done').length,
  }

  return (
    <div style={{ padding:'20px 24px', maxWidth:800, margin:'0 auto' }}>

      {showAdd && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200 }}>
          <div style={{ background:'#fff', borderRadius:14, padding:24, width:400, maxWidth:'90vw' }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:16 }}>New Task Add Karo</div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>Room</label>
              <select value={f.roomId} onChange={e=>fs('roomId',e.target.value)}
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', boxSizing:'border-box' }}>
                <option value="">Room chuno</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>#{r.room_number} · {r.room_type}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom:10 }}>
              <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>Task</label>
              <textarea value={f.task} onChange={e=>fs('task',e.target.value)} placeholder="Kya karna hai..." rows={2}
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', resize:'vertical', boxSizing:'border-box' }}/>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
              <div>
                <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>Priority</label>
                <select value={f.priority} onChange={e=>fs('priority',e.target.value)} style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none' }}>
                  <option value="high">🔴 High</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="low">🟢 Low</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize:12, color:'#888780', display:'block', marginBottom:3 }}>Assign karo</label>
                <select value={f.assigned} onChange={e=>fs('assigned',e.target.value)} style={{ width:'100%', padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none' }}>
                  {STAFF.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex:1, padding:'9px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', background:'#fff', fontSize:13, cursor:'pointer' }}>Cancel</button>
              <button onClick={addTask} disabled={!f.roomId||!f.task||saving}
                style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', opacity:saving?0.6:1 }}>
                {saving ? 'Saving...' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:'#1A1A18' }}>🧹 Housekeeping</h1>
          <p style={{ margin:'4px 0 0', fontSize:13, color:'#888780' }}>{counts.pending+counts.inprogress} tasks baki · {counts.done} done</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={handleAI} disabled={aiLoad} style={{ padding:'8px 14px', borderRadius:8, border:'0.5px solid rgba(127,119,221,0.4)', background:'#EEEDFE', color:'#3C3489', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            {aiLoad ? '⏳ Soch raha...' : '🤖 AI Suggest'}
          </button>
          <button onClick={() => setShowAdd(true)} style={{ padding:'8px 16px', borderRadius:8, background:'#1A1A18', color:'#fff', border:'none', fontSize:13, fontWeight:600, cursor:'pointer' }}>+ Add Task</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:14 }}>
        {[
          { k:'pending',    l:'Pending',     bg:'#FAEEDA', c:'#633806' },
          { k:'inprogress', l:'In Progress', bg:'#EEEDFE', c:'#3C3489' },
          { k:'done',       l:'Done',        bg:'#E1F5EE', c:'#085041' },
        ].map(s => (
          <div key={s.k} style={{ background:s.bg, borderRadius:10, padding:'10px 14px', textAlign:'center', cursor:'pointer' }} onClick={() => setFilter(filter===s.k?'all':s.k)}>
            <div style={{ fontSize:22, fontWeight:700, color:s.c }}>{counts[s.k]}</div>
            <div style={{ fontSize:11, color:s.c, opacity:0.7 }}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:14 }}>
        {[
          { k:'all',        l:'Sab ('       +tasks.length+')'           },
          { k:'pending',    l:'Pending ('   +counts.pending+')'         },
          { k:'inprogress', l:'In Progress ('+counts.inprogress+')'     },
          { k:'done',       l:'Done ('      +counts.done+')'            },
        ].map(({ k,l }) => (
          <button key={k} onClick={() => setFilter(k)} style={{ padding:'5px 12px', borderRadius:20, border:'0.5px solid rgba(0,0,0,0.12)', background:filter===k?'#1A1A18':'#fff', color:filter===k?'#fff':'#888780', fontSize:12, cursor:'pointer' }}>{l}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:40, color:'#888780', fontSize:14 }}>Is category mein koi task nahi ✅</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:12 }}>
          {filtered.map(t => {
            const sc = SC[t.status] || SC.pending
            const pc = PC[t.priority] || PC.medium
            return (
              <div key={t.id} style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:12, padding:'14px', opacity:t.status==='done'?0.7:1 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>🚪 {t.rooms?.room_number || '-'}</span>
                  <span style={{ background:pc.bg, color:pc.c, fontSize:10, fontWeight:600, padding:'2px 7px', borderRadius:20 }}>{pc.l}</span>
                </div>
                <div style={{ fontSize:13, color:'#1A1A18', marginBottom:10, lineHeight:1.5 }}>{t.task}</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                  <select value={t.assigned} onChange={e=>reassign(t.id,e.target.value)} disabled={t.status==='done'} style={{ fontSize:12, padding:'3px 8px', borderRadius:6, border:'0.5px solid rgba(0,0,0,0.12)', background:'#F5F4F0', cursor:'pointer' }}>
                    {STAFF.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <span style={{ background:sc.bg, color:sc.c, fontSize:10, fontWeight:600, padding:'2px 8px', borderRadius:20 }}>{sc.l}</span>
                </div>
                {sc.next && (
                  <button onClick={() => changeStatus(t.id, sc.next)} style={{ width:'100%', padding:'6px', borderRadius:8, border:'none', background:sc.next==='done'?'#0F6E56':'#1A1A18', color:'#fff', fontSize:12, fontWeight:600, cursor:'pointer' }}>
                    {sc.nl} →
                  </button>
                )}
                {t.status === 'done' && (
                  <div style={{ textAlign:'center', fontSize:12, color:'#0F6E56', fontWeight:600 }}>✅ Complete!</div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
