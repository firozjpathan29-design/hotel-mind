// src/lib/pricing.js — Phase 4

export const GUJARAT_FESTIVALS = [
  { name: 'Uttarayan',  months: [1],     days: [14,15], boost: 1.35, color: '#F59E0B' },
  { name: 'Holi',       months: [3],     days: [],      boost: 1.25, color: '#EC4899' },
  { name: 'Navratri',   months: [9,10],  days: [],      boost: 1.55, color: '#EF4444' },
  { name: 'Diwali',     months: [10,11], days: [],      boost: 1.65, color: '#F97316' },
  { name: 'Christmas',  months: [12],    days: [],      boost: 1.20, color: '#10B981' },
]

const WEEKEND = { 5: 1.15, 6: 1.20, 0: 1.25 }

export function calculateDynamicPrice(basePrice, occupancyPct, date) {
  date = date || new Date()
  var m   = 1
  var mo  = date.getMonth() + 1
  var day = date.getDay()
  var dom = date.getDate()

  var festival = null
  for (var i = 0; i < GUJARAT_FESTIVALS.length; i++) {
    var f = GUJARAT_FESTIVALS[i]
    if (f.months.indexOf(mo) !== -1 && (f.days.length === 0 || f.days.indexOf(dom) !== -1)) {
      festival = f
      m = m * f.boost
      break
    }
  }

  if (WEEKEND[day]) m = m * WEEKEND[day]

  if      (occupancyPct >= 90) m = m * 1.30
  else if (occupancyPct >= 80) m = m * 1.15
  else if (occupancyPct >= 70) m = m * 1.05
  else if (occupancyPct < 40)  m = m * 0.85

  return {
    suggestedPrice: Math.round(basePrice * m / 50) * 50,
    basePrice:      basePrice,
    multiplier:     parseFloat(m.toFixed(2)),
    change:         Math.round((m - 1) * 100),
    festival:       festival ? festival.name  : null,
    festivalColor:  festival ? festival.color : null,
    isWeekend:      !!WEEKEND[day],
    occupancyPct:   occupancyPct,
  }
}

export function getPriceCalendar(basePrice, occupancyForecast) {
  occupancyForecast = occupancyForecast || []
  var result = []
  for (var i = 0; i < 7; i++) {
    var date = new Date()
    date.setDate(date.getDate() + i)
    var occ = occupancyForecast[i] !== undefined ? occupancyForecast[i] : 65
    var r   = calculateDynamicPrice(basePrice, occ, date)
    var label
    if      (i === 0) label = 'Aaj'
    else if (i === 1) label = 'Kal'
    else label = date.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' })
    result.push(Object.assign({}, r, { date: date, label: label }))
  }
  return result
}
