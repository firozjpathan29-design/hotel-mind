// ================================================================
// HotelMind AI — Claude API Helper
// File: src/lib/claude.js
// Phase 2
// ================================================================

const KEY = import.meta.env.VITE_CLAUDE_API_KEY
const MDL = 'claude-haiku-4-5-20251001'
const HDR = {
  'Content-Type': 'application/json',
  'x-api-key': KEY,
  'anthropic-version': '2023-06-01',
  'anthropic-dangerous-direct-browser-calls': 'true',
}

async function callClaude(system, message, maxTokens) {
  maxTokens = maxTokens || 500
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: HDR,
    body: JSON.stringify({
      model: MDL,
      max_tokens: maxTokens,
      system: system,
      messages: [{ role: 'user', content: message }],
    }),
  })
  if (!res.ok) throw new Error('Claude error: ' + res.status)
  const data = await res.json()
  return data.content[0].text
}

// Staff multi-turn chat
export async function staffChat(messages) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: HDR,
    body: JSON.stringify({
      model: MDL,
      max_tokens: 500,
      system: 'Tu HotelMind ka staff AI assistant hai. Hotel operations mein help karo. Hinglish mein short aur actionable jawab do.',
      messages: messages,
    }),
  })
  if (!res.ok) throw new Error('Claude error: ' + res.status)
  const data = await res.json()
  return data.content[0].text
}

// Complaint ka auto reply
export async function generateComplaintReply(complaint, guestName, roomNumber) {
  const system = 'Tu hotel customer service AI hai. Polite Hinglish reply do — 2-3 lines. Shuru karo: Namaste [naam] ji!'
  const msg    = 'Guest: ' + guestName + ', Room: ' + roomNumber + ', Complaint: ' + complaint
  return callClaude(system, msg, 200)
}

// Housekeeping AI suggestions
export async function suggestHousekeepingTasks(checkoutRooms) {
  const system = 'Housekeeping manager AI. Checkout rooms ke liye tasks suggest karo. Sirf JSON array: [{"room":"101","tasks":["..."],"priority":"high/medium/low"}]'
  const raw    = await callClaude(system, 'Rooms: ' + JSON.stringify(checkoutRooms), 400)
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch(e) {
    return []
  }
}

// Revenue tips
export async function getRevenueTips(monthData) {
  const system = 'Hotel revenue analyst AI. 3 actionable tips do Hinglish mein. Sirf JSON: [{"tip":"...","impact":"high/medium","action":"..."}]'
  const raw    = await callClaude(system, JSON.stringify(monthData), 400)
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch(e) {
    return []
  }
}

// Dynamic pricing suggestion
export async function getPricingSuggestion(params) {
  const system = 'Hotel pricing AI. Sirf JSON: {"suggestedPrice":number,"reason":"Hinglish mein","confidence":"high/medium/low"}'
  const msg    = 'Base: Rs.' + params.basePrice + ', Occupancy: ' + params.occupancyPct + '%, Date: ' + params.date + ', Events: ' + (params.upcomingEvents || 'none')
  const raw    = await callClaude(system, msg, 150)
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch(e) {
    return { suggestedPrice: params.basePrice, reason: 'Standard rate rakho', confidence: 'medium' }
  }
}
