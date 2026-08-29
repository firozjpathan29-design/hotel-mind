// src/pages/GuestIntel.jsx
import { useState } from 'react'
import { generateComplaintReply } from '../lib/claude'

const MOCK_GUESTS = [
  {
    id: '1', name: 'Ramesh Patel', phone: '98765 43210', email: 'ramesh@email.com',
    visits: 5, totalSpend: 34500, lastVisit: '12 Jan 2025', vip: true,
    preference: 'AC Deluxe, top floor', food: 'Jain food, no onion',
    history: [
      { date: '12 Jan 2025', room: '204', nights: 2, amount: 2688, rating: 5 },
      { date: '10 Dec 2024', room: '204', nights: 3, amount: 4032, rating: 5 },
      { date: '05 Nov 2024', room: '202', nights: 1, amount: 1344, rating: 4 },
    ],
  },
  {
    id: '2', name: 'Priya Shah', phone: '99887 76655', email: 'priya@email.com',
    visits: 3, totalSpend: 12400, lastVisit: '13 Jan 2025', vip: false,
    preference: 'Quiet room, ground floor', food: 'Vegetarian',
    history: [
      { date: '13 Jan 2025', room: '108', nights: 1, amount: 1008, rating: 4 },
      { date: '20 Nov 2024', room: '110', nights: 2, amount: 2016, rating: 3 },
    ],
  },
  {
    id: '3', name: 'Arjun Desai', phone: '97654 32109', email: 'arjun@gmail.com',
    visits: 2, totalSpend: 8400, lastVisit: '11 Jan 2025', vip: false,
    preference: 'Suite, city view', food: 'Non-veg ok',
    history: [
      { date: '11 Jan 2025', room: '312', nights: 3, amount: 8064, rating: 5 },
    ],
  },
  {
    id: '4', name: 'Kavita Modi', phone: '96543 21098', email: '',
    visits: 7, totalSpend: 52000, lastVisit: '05 Jan 2025', vip: true,
    preference: 'Corner room, high floor', food: 'Jain',
    history: [
      { date: '05 Jan 2025', room: '304', nights: 4, amount: 5376, rating: 5 },
      { date: '10 Dec 2024', room: '304', nights: 2, amount: 2688, rating: 5 },
    ],
  },
]

function Stars({ n }) {
  return (
    <span>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= n ? '#EF9F27' : '#D3D1C7', fontSize: 12 }}>★</span>
      ))}
    </span>
  )
}

function GuestCard({ guest, selected, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: selected ? '#EEEDFE' : '#fff',
      border: '0.5px solid ' + (selected ? '#AFA9EC' : 'rgba(0,0,0,0.08)'),
      borderRadius: 12, padding: '12px 14px',
      cursor: 'pointer', marginBottom: 8,
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          background: guest.vip ? '#FAEEDA' : '#EEEDFE',
          color: guest.vip ? '#633806' : '#3C3489',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 14, flexShrink: 0,
        }}>{guest.name.charAt(0)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A18', display: 'flex', alignItems: 'center', gap: 6 }}>
            {guest.name}
            {guest.vip && <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: '#FAEEDA', color: '#633806' }}>VIP</span>}
          </div>
          <div style={{ fontSize: 11, color: '#888780' }}>{guest.visits} visits · Rs.{guest.totalSpend.toLocaleString('en-IN')} total</div>
        </div>
      </div>
    </div>
  )
}

function GuestDetail({ guest }) {
  const [welcomeMsg, setWelcomeMsg] = useState('')
  const [generating, setGenerating] = useState(false)

  async function generateWelcome() {
    setGenerating(true)
    try {
      const msg = await generateComplaintReply(
        'Generate a personalized welcome message for a returning VIP guest. Preference: ' + guest.preference + '. Food: ' + guest.food + '. Visits: ' + guest.visits,
        guest.name, 'their preferred room'
      )
      setWelcomeMsg(msg)
    } catch(e) {
      setWelcomeMsg('Namaste ' + guest.name + ' ji! Aapka baar baar swagat hai hamare hotel mein. Aapka pasandida room ready hai aur ' + guest.food + ' ka arrangement kar diya gaya hai. Kuch bhi chahiye to batayein!')
    }
    setGenerating(false)
  }

  return (
    <div>
      {/* Profile header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: guest.vip ? '#FAEEDA' : '#EEEDFE',
          color: guest.vip ? '#633806' : '#3C3489',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: 20,
        }}>{guest.name.charAt(0)}</div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1A18', display: 'flex', alignItems: 'center', gap: 8 }}>
            {guest.name}
            {guest.vip && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#FAEEDA', color: '#633806' }}>⭐ VIP</span>}
          </div>
          <div style={{ fontSize: 12, color: '#888780', marginTop: 2 }}>{guest.phone} {guest.email ? '· ' + guest.email : ''}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total visits',  value: guest.visits },
          { label: 'Total spend',   value: 'Rs.' + guest.totalSpend.toLocaleString('en-IN') },
          { label: 'Last visit',    value: guest.lastVisit },
        ].map(function(s) {
          return (
            <div key={s.label} style={{ background: '#F5F4F0', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A18' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#888780', marginTop: 2 }}>{s.label}</div>
            </div>
          )
        })}
      </div>

      {/* Preferences */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: '#1A1A18' }}>❤️ Preferences</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
            <span style={{ color: '#888780', width: 100, flexShrink: 0 }}>Room choice:</span>
            <span style={{ color: '#1A1A18' }}>{guest.preference}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, fontSize: 13 }}>
            <span style={{ color: '#888780', width: 100, flexShrink: 0 }}>Food:</span>
            <span style={{ color: '#1A1A18' }}>{guest.food}</span>
          </div>
        </div>
      </div>

      {/* AI Welcome Message */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 14, marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A18' }}>🤖 AI Welcome Message</div>
          <button onClick={generateWelcome} disabled={generating} style={{
            padding: '5px 12px', borderRadius: 8,
            border: '0.5px solid rgba(127,119,221,0.4)',
            background: '#EEEDFE', color: '#3C3489',
            fontSize: 11, fontWeight: 600, cursor: 'pointer',
          }}>{generating ? '⏳ Generate ho raha...' : '✨ Generate'}</button>
        </div>
        {welcomeMsg
          ? <div style={{ background: '#EEEDFE', borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#2D2870', lineHeight: 1.6 }}>
              🤖 {welcomeMsg}
            </div>
          : <div style={{ fontSize: 12, color: '#888780' }}>Generate dabao — AI personalized welcome message banayega jo WhatsApp pe bheja ja sakta hai.</div>
        }
      </div>

      {/* Visit history */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: 14 }}>
        <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10, color: '#1A1A18' }}>📅 Visit History</div>
        {guest.history.map(function(h, i) {
          return (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < guest.history.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 500 }}>{h.date}</div>
                <div style={{ fontSize: 11, color: '#888780' }}>Room {h.room} · {h.nights} raat</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, color: '#0F6E56' }}>Rs.{h.amount.toLocaleString('en-IN')}</div>
                <Stars n={h.rating} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function GuestIntel() {
  const [selected, setSelected] = useState(MOCK_GUESTS[0])
  const [search, setSearch]     = useState('')

  const filtered = MOCK_GUESTS.filter(function(g) {
    return g.name.toLowerCase().includes(search.toLowerCase()) || g.phone.includes(search)
  })

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A1A18' }}>👥 Guest Intelligence</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888780' }}>VIP guests ki preferences, history aur AI welcome messages</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 16 }}>
        {/* Left: Guest list */}
        <div>
          <input value={search} onChange={function(e) { setSearch(e.target.value) }} placeholder="Naam ya phone..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.12)', fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box', background: '#fff' }}/>
          {filtered.map(function(g) {
            return <GuestCard key={g.id} guest={g} selected={selected && selected.id === g.id} onClick={function() { setSelected(g) }}/>
          })}
        </div>

        {/* Right: Guest detail */}
        <div style={{ background: '#F5F4F0', borderRadius: 14, padding: 16 }}>
          {selected ? <GuestDetail guest={selected} /> : <div style={{ textAlign: 'center', padding: 40, color: '#888780' }}>Guest select karo</div>}
        </div>
      </div>
    </div>
  )
}
