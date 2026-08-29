// ================================================================
// HotelMind AI — Floating Staff Chatbot
// File: src/components/AIChat.jsx
// Phase 2
// ================================================================

import { useState, useRef, useEffect } from 'react'
import { staffChat } from '../lib/claude'

const QUICK = [
  'Aaj kitne rooms available hain?',
  'Checkout process kya hai?',
  'Guest ko extra towel kaise bhejein?',
  'Aaj ka revenue kitna hai?',
]

function Bubble({ role, text, loading }) {
  const ai = role === 'assistant'
  return (
    <div style={{ display:'flex', justifyContent:ai?'flex-start':'flex-end', marginBottom:10 }}>
      {ai && (
        <div style={{ width:28, height:28, borderRadius:'50%', background:'#EEEDFE', color:'#3C3489', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, marginRight:8, flexShrink:0 }}>
          🤖
        </div>
      )}
      <div style={{
        maxWidth:'75%', padding:'9px 13px',
        borderRadius: ai ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        background: ai ? '#EEEDFE' : '#1A1A18',
        color: ai ? '#2D2870' : '#fff',
        fontSize:13, lineHeight:1.6,
      }}>
        {loading
          ? <span style={{ display:'flex', gap:4, alignItems:'center' }}>
              {[0,1,2].map(i => <span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#7F77DD', display:'inline-block', animation:'pulse 1s '+i*0.2+'s infinite' }}/>)}
            </span>
          : text
        }
      </div>
    </div>
  )
}

export default function AIChat({ isOpen, onClose }) {
  const [msgs, setMsgs]   = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy]   = useState(false)
  const bottomRef         = useRef(null)

  useEffect(() => {
    bottomRef.current && bottomRef.current.scrollIntoView({ behavior:'smooth' })
  }, [msgs, busy])

  useEffect(() => {
    if (isOpen && msgs.length === 0) {
      setMsgs([{ role:'assistant', content:'Namaste! Main HotelMind AI hoon. Hotel operations mein kaise madad kar sakta hoon? 😊' }])
    }
  }, [isOpen])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg) return
    setInput('')
    const next = [...msgs, { role:'user', content:msg }]
    setMsgs(next)
    setBusy(true)
    try {
      const reply = await staffChat(next.map(m => ({ role:m.role, content:m.content })))
      setMsgs(p => [...p, { role:'assistant', content:reply }])
    } catch(e) {
      setMsgs(p => [...p, { role:'assistant', content:'Sorry, AI se connect nahi ho pa raha. API key check karo.' }])
    }
    setBusy(false)
  }

  if (!isOpen) return null

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.3)', zIndex:199 }}/>
      <div style={{
        position:'fixed', bottom:24, right:24,
        width:360, height:500,
        background:'#fff', borderRadius:16,
        boxShadow:'0 20px 60px rgba(0,0,0,0.2)',
        display:'flex', flexDirection:'column',
        zIndex:200, overflow:'hidden',
      }}>
        {/* Header */}
        <div style={{ padding:'12px 16px', background:'#1A1A18', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ fontSize:18 }}>🤖</span>
            <div>
              <div style={{ color:'#fff', fontWeight:600, fontSize:13 }}>HotelMind AI</div>
              <div style={{ color:'rgba(255,255,255,0.4)', fontSize:11 }}>Staff Assistant</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'rgba(255,255,255,0.5)', fontSize:20, cursor:'pointer', lineHeight:1 }}>×</button>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'12px 14px' }}>
          {msgs.map((m, i) => <Bubble key={i} role={m.role} text={m.content}/>)}
          {busy && <Bubble role="assistant" loading={true}/>}
          <div ref={bottomRef}/>
        </div>

        {/* Quick actions */}
        {msgs.length <= 1 && (
          <div style={{ padding:'0 12px 8px', display:'flex', flexWrap:'wrap', gap:6 }}>
            {QUICK.map(q => (
              <button key={q} onClick={() => send(q)} style={{ fontSize:11, padding:'4px 10px', borderRadius:20, border:'0.5px solid rgba(0,0,0,0.12)', background:'#F5F4F0', color:'#1A1A18', cursor:'pointer' }}>
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={{ padding:'10px 12px', borderTop:'0.5px solid rgba(0,0,0,0.08)', display:'flex', gap:8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Kuch bhi poocho..."
            style={{ flex:1, padding:'8px 12px', borderRadius:8, border:'0.5px solid rgba(0,0,0,0.12)', fontSize:13, outline:'none', background:'#F5F4F0' }}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || busy}
            style={{ padding:'8px 14px', background:busy?'#ccc':'#1A1A18', color:'#fff', border:'none', borderRadius:8, cursor:busy?'not-allowed':'pointer', fontSize:16, fontWeight:600 }}
          >↑</button>
        </div>
      </div>
    </>
  )
}
