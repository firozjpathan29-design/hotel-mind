// src/pages/Pricing.jsx — Phase 4
import { useState } from 'react'
import { calculateDynamicPrice, getPriceCalendar, GUJARAT_FESTIVALS } from '../lib/pricing'
import { getPricingSuggestion } from '../lib/claude'

const ROOM_TYPES = [
  { id: '1', type: 'AC Deluxe',   basePrice: 1200, rooms: 8  },
  { id: '2', type: 'Suite',       basePrice: 2400, rooms: 4  },
  { id: '3', type: 'Standard AC', basePrice: 900,  rooms: 10 },
  { id: '4', type: 'Standard',    basePrice: 700,  rooms: 6  },
]

const OCC_FORECAST = [87, 72, 65, 58, 91, 95, 88]

// 7-day calendar strip
function PriceCalendar({ basePrice }) {
  var calendar = getPriceCalendar(basePrice, OCC_FORECAST)
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
      {calendar.map(function(day, i) {
        var isUp   = day.change > 0
        var isDown = day.change < 0
        var bg     = isUp ? '#E1F5EE' : isDown ? '#FCEBEB' : '#F5F4F0'
        var color  = isUp ? '#085041' : isDown ? '#A32D2D' : '#888780'
        return (
          <div key={i} style={{ background: bg, borderRadius: 10, padding: '9px 5px', textAlign: 'center', border: i===0 ? '1.5px solid #1D9E75' : '0.5px solid rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 10, color: '#888780', marginBottom: 3 }}>{day.label}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A18' }}>Rs.{day.suggestedPrice.toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 10, color: color, marginTop: 2, fontWeight: 600 }}>
              {isUp ? '+' + day.change + '%' : isDown ? day.change + '%' : '— same'}
            </div>
            <div style={{ fontSize: 9, color: '#888780', marginTop: 2 }}>{day.occupancyPct}% occ</div>
            {day.festival && (
              <div style={{ fontSize: 9, marginTop: 3, color: day.festivalColor, fontWeight: 600 }}>{day.festival}</div>
            )}
            {day.isWeekend && !day.festival && (
              <div style={{ fontSize: 9, color: '#7F77DD', marginTop: 3 }}>Weekend</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// Room pricing card
function RoomCard({ room }) {
  var [basePrice, setBasePrice] = useState(room.basePrice)
  var [editing, setEditing]     = useState(false)
  var [tempPrice, setTempPrice] = useState(room.basePrice)
  var [aiLoad, setAiLoad]       = useState(false)
  var [aiResult, setAiResult]   = useState(null)

  var today = calculateDynamicPrice(basePrice, 82)

  async function askAI() {
    setAiLoad(true)
    try {
      var res = await getPricingSuggestion({
        occupancyPct:   82,
        basePrice:      basePrice,
        date:           new Date().toLocaleDateString('en-IN'),
        upcomingEvents: 'Navratri next week',
      })
      setAiResult(res)
    } catch(e) {
      setAiResult({ suggestedPrice: today.suggestedPrice, reason: 'Normal demand hai. Standard rate theek hai.', confidence: 'medium' })
    }
    setAiLoad(false)
  }

  var confBg    = { high: '#E1F5EE', medium: '#FAEEDA', low: '#FCEBEB' }
  var confColor = { high: '#085041', medium: '#633806', low: '#A32D2D' }

  return (
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1A18' }}>{room.type}</div>
          <div style={{ fontSize: 12, color: '#888780' }}>{room.rooms} rooms · 82% occupied</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#888780' }}>Aaj ka suggested rate</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#0F6E56' }}>Rs.{today.suggestedPrice.toLocaleString('en-IN')}</div>
          {today.change !== 0 && (
            <div style={{ fontSize: 11, color: today.change > 0 ? '#0F6E56' : '#A32D2D' }}>
              {today.change > 0 ? '+' + today.change : today.change}% base se
            </div>
          )}
        </div>
      </div>

      {/* Base price editor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: '#F5F4F0', borderRadius: 8, marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: '#888780', flex: 1 }}>Base price:</span>
        {editing ? (
          <>
            <input type="number" value={tempPrice} onChange={function(e) { setTempPrice(Number(e.target.value)) }}
              style={{ width: 80, padding: '4px 8px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.2)', fontSize: 13, fontWeight: 600, textAlign: 'right', outline: 'none' }} />
            <button onClick={function() { setBasePrice(tempPrice); setEditing(false); setAiResult(null) }}
              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#1A1A18', color: '#fff', fontSize: 12, cursor: 'pointer' }}>Save</button>
          </>
        ) : (
          <>
            <span style={{ fontWeight: 600, fontSize: 13 }}>Rs.{basePrice.toLocaleString('en-IN')}</span>
            <button onClick={function() { setTempPrice(basePrice); setEditing(true) }}
              style={{ padding: '3px 9px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 11, cursor: 'pointer' }}>Edit</button>
          </>
        )}
      </div>

      {/* Active boosts */}
      {(today.festival || today.isWeekend || today.occupancyPct >= 80) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {today.festival && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#FAEEDA', color: '#633806' }}>🎉 {today.festival}</span>}
          {today.isWeekend && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#EEEDFE', color: '#3C3489' }}>📅 Weekend</span>}
          {today.occupancyPct >= 80 && <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: '#E1F5EE', color: '#085041' }}>🔥 High demand</span>}
        </div>
      )}

      {/* AI result */}
      {aiResult && (
        <div style={{ background: '#EEEDFE', borderRadius: 8, padding: '10px 12px', marginBottom: 12, fontSize: 13, color: '#2D2870' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>🤖 AI Salah: Rs.{aiResult.suggestedPrice && aiResult.suggestedPrice.toLocaleString('en-IN')}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 20, background: confBg[aiResult.confidence] || '#F5F4F0', color: confColor[aiResult.confidence] || '#888780' }}>
              {aiResult.confidence}
            </span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{aiResult.reason}</div>
          <button onClick={function() { setBasePrice(aiResult.suggestedPrice); setAiResult(null) }}
            style={{ marginTop: 8, padding: '4px 12px', borderRadius: 6, border: 'none', background: '#3C3489', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            ✅ Yeh price apply karo
          </button>
        </div>
      )}

      {/* AI button */}
      <button onClick={askAI} disabled={aiLoad} style={{ width: '100%', padding: '8px', borderRadius: 8, border: '0.5px solid rgba(127,119,221,0.4)', background: '#EEEDFE', color: '#3C3489', fontSize: 12, fontWeight: 600, cursor: aiLoad ? 'not-allowed' : 'pointer' }}>
        {aiLoad ? '⏳ Claude soch raha hai...' : '🤖 AI Se Price Poocho'}
      </button>
    </div>
  )
}

// Festival sidebar
function FestivalList() {
  return (
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '14px 16px' }}>
      <div style={{ fontWeight: 600, fontSize: 13, color: '#1A1A18', marginBottom: 12 }}>🗓️ Gujarat Festival Boost</div>
      {GUJARAT_FESTIVALS.map(function(f, i) {
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: i < GUJARAT_FESTIVALS.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: f.color }} />
              <span style={{ fontSize: 13 }}>{f.name}</span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: f.boost >= 1.5 ? '#A32D2D' : f.boost >= 1.3 ? '#633806' : '#085041' }}>
              +{Math.round((f.boost - 1) * 100)}%
            </span>
          </div>
        )
      })}
      <div style={{ marginTop: 12, padding: '8px 10px', background: '#F5F4F0', borderRadius: 8, fontSize: 11, color: '#888780', lineHeight: 1.6 }}>
        Yeh boosts automatically apply hote hain jab festival ka month aata hai.
      </div>
    </div>
  )
}

// Main Pricing Page
export default function Pricing() {
  var [selectedRoom, setSelectedRoom] = useState(ROOM_TYPES[0])

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1080, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A1A18' }}>💡 Dynamic Pricing AI</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888780' }}>Festival, weekend aur occupancy ke hisaab se AI smart price suggest karta hai</p>
      </div>

      {/* 7-day calendar */}
      <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#1A1A18' }}>📅 7-Day Price Calendar</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {ROOM_TYPES.map(function(r) {
              return (
                <button key={r.id} onClick={function() { setSelectedRoom(r) }} style={{ padding: '4px 10px', borderRadius: 20, border: '0.5px solid rgba(0,0,0,0.12)', background: selectedRoom.id===r.id ? '#1A1A18' : '#fff', color: selectedRoom.id===r.id ? '#fff' : '#888780', fontSize: 11, cursor: 'pointer' }}>
                  {r.type}
                </button>
              )
            })}
          </div>
        </div>
        <PriceCalendar basePrice={selectedRoom.basePrice} />
      </div>

      {/* Room cards + festival sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 260px', gap: 16, alignItems: 'start' }}>
        {ROOM_TYPES.slice(0, 3).map(function(room) {
          return <RoomCard key={room.id} room={room} />
        })}
        <FestivalList />
      </div>

      {/* 4th room */}
      <div style={{ marginTop: 16, maxWidth: 340 }}>
        <RoomCard room={ROOM_TYPES[3]} />
      </div>
    </div>
  )
}
