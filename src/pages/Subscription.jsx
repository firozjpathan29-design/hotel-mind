import { useState, useEffect } from 'react'
import { getSubscription, changePlan, getSubscriptionHistory } from '../lib/supabase'

const PLANS = [
  {
    key: 'basic', label: 'Basic', price: 999, color: '#1D9E75',
    features: [
      { l:'Dashboard + Stats', on:true }, { l:'Room Management', on:true },
      { l:'Booking Management', on:true }, { l:'Guest Profiles', on:true },
      { l:'Housekeeping', on:true }, { l:'AI Complaints Reply', on:false },
      { l:'Billing + Razorpay', on:false }, { l:'Analytics', on:false },
      { l:'Dynamic Pricing AI', on:false },
    ],
  },
  {
    key: 'pro', label: 'Pro', price: 1999, color: '#3C3489', popular: true,
    features: [
      { l:'Dashboard + Stats', on:true }, { l:'Room Management', on:true },
      { l:'Booking Management', on:true }, { l:'Guest Profiles', on:true },
      { l:'Housekeeping', on:true }, { l:'AI Complaints Reply', on:true },
      { l:'Billing + Razorpay', on:true }, { l:'Analytics', on:true },
      { l:'Dynamic Pricing AI', on:false },
    ],
  },
  {
    key: 'premium', label: 'Premium', price: 3499, color: '#633806',
    features: [
      { l:'Dashboard + Stats', on:true }, { l:'Room Management', on:true },
      { l:'Booking Management', on:true }, { l:'Guest Profiles', on:true },
      { l:'Housekeeping', on:true }, { l:'AI Complaints Reply', on:true },
      { l:'Billing + Razorpay', on:true }, { l:'Analytics', on:true },
      { l:'Dynamic Pricing AI', on:true },
    ],
  },
]

function fmtDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
}

export default function Subscription() {
  const [sub, setSub]         = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [tab, setTab]         = useState('plans')
  const [switching, setSwitching] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [s, h] = await Promise.all([getSubscription(), getSubscriptionHistory()])
      setSub(s)
      setHistory(h)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Subscription load nahi hua. Internet check karo ya page refresh karo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSwitch(planKey) {
    if (planKey === sub.plan) return
    const action = PLANS.findIndex(p => p.key === planKey) > PLANS.findIndex(p => p.key === sub.plan) ? 'Upgrade' : 'Downgrade'
    if (!window.confirm(`${action} karke "${planKey}" plan pe jaana chahte ho?`)) return
    setSwitching(planKey)
    try {
      await changePlan(planKey)
      await load()
    } catch (err) {
      console.error(err)
      alert('Plan change nahi hua, dobara try karo.')
    } finally {
      setSwitching(null)
    }
  }

  if (loading) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#888780' }}>⏳ Subscription load ho raha hai...</div>
  )
  if (error) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#A32D2D' }}>
      {error}
      <div style={{ marginTop:10 }}>
        <button onClick={load} style={{ padding:'7px 15px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', cursor:'pointer' }}>Phir try karo</button>
      </div>
    </div>
  )

  const currentPlan = PLANS.find(p => p.key === sub.plan) || PLANS[1]

  return (
    <div style={{ padding:'20px 24px', maxWidth:900, margin:'0 auto' }}>
      <div style={{ marginBottom:18 }}>
        <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:'#1A1A18' }}>💎 Subscription</h1>
        <p style={{ margin:'4px 0 0', fontSize:13, color:'#888780' }}>HotelMind AI ka plan manage karo</p>
      </div>

      <div style={{ background:'#EEEDFE', border:'0.5px solid #AFA9EC', borderRadius:12, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'#3C3489', letterSpacing:0.5, marginBottom:3 }}>CURRENT PLAN</div>
          <div style={{ fontSize:18, fontWeight:700, color:'#1A1A18' }}>{currentPlan.label} Plan</div>
          <div style={{ fontSize:12, color:'#888780', marginTop:2 }}>Rs.{currentPlan.price}/month · Next renewal: {fmtDate(sub.plan_renewal_date)}</div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontSize:24, fontWeight:700, color:'#3C3489' }}>Rs.{currentPlan.price.toLocaleString('en-IN')}</div>
          <div style={{ fontSize:11, color:'#888780' }}>per month</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:18 }}>
        {[{ k:'plans', l:'📦 Plans' }, { k:'history', l:'📄 Billing History' }].map(({ k,l }) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding:'7px 16px', borderRadius:20, border:'0.5px solid rgba(0,0,0,0.12)',
            background: tab===k ? '#1A1A18' : '#fff',
            color:      tab===k ? '#fff'    : '#888780',
            fontSize:13, fontWeight:500, cursor:'pointer',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'plans' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:16 }}>
          {PLANS.map(p => {
            const isActive = p.key === sub.plan
            return (
              <div key={p.key} style={{ background:'#fff', border: isActive ? `1.5px solid ${p.color}` : '0.5px solid rgba(0,0,0,0.08)', borderRadius:14, padding:20, position:'relative' }}>
                {p.popular && (
                  <div style={{ position:'absolute', top:-11, left:'50%', transform:'translateX(-50%)', background:'#3C3489', color:'#fff', fontSize:10, fontWeight:700, padding:'3px 12px', borderRadius:20 }}>⭐ Most Popular</div>
                )}
                {isActive && (
                  <div style={{ position:'absolute', top:14, right:14, fontSize:10, fontWeight:700, color:p.color, background:`${p.color}15`, padding:'2px 8px', borderRadius:20 }}>ACTIVE</div>
                )}
                <div style={{ fontWeight:700, fontSize:15, marginTop:6 }}>{p.label}</div>
                <div style={{ fontSize:26, fontWeight:800, color:p.color, margin:'4px 0' }}>Rs.{p.price}<span style={{ fontSize:13, fontWeight:500, color:'#888780' }}>/month</span></div>
                <div style={{ marginTop:14, marginBottom:18 }}>
                  {p.features.map(f => (
                    <div key={f.l} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12.5, padding:'4px 0', color:f.on?'#1A1A18':'#B8B6AE' }}>
                      <span>{f.on ? '✅' : '❌'}</span>{f.l}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => handleSwitch(p.key)}
                  disabled={isActive || switching === p.key}
                  style={{
                    width:'100%', padding:'10px', borderRadius:8, border:'none', fontSize:13, fontWeight:600, cursor: isActive?'default':'pointer',
                    background: isActive ? `${p.color}15` : p.color,
                    color: isActive ? p.color : '#fff',
                    opacity: switching === p.key ? 0.6 : 1,
                  }}
                >
                  {switching === p.key ? 'Switching...' : isActive ? '✅ Current Plan' : (PLANS.findIndex(x=>x.key===p.key) > PLANS.findIndex(x=>x.key===sub.plan) ? '⬆️ Upgrade Karo' : '⬇️ Downgrade Karo')}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'history' && (
        <div style={{ background:'#fff', border:'0.5px solid rgba(0,0,0,0.08)', borderRadius:14, overflow:'hidden' }}>
          {history.length === 0 ? (
            <div style={{ padding:30, textAlign:'center', color:'#888780', fontSize:13 }}>Abhi koi billing history nahi hai</div>
          ) : (
            history.map((h, i) => (
              <div key={h.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 16px', borderBottom:i<history.length-1?'0.5px solid rgba(0,0,0,0.05)':'none', fontSize:13 }}>
                <div>
                  <div style={{ fontWeight:600, textTransform:'capitalize' }}>{h.plan} Plan</div>
                  <div style={{ fontSize:11, color:'#888780' }}>{fmtDate(h.paid_at)} · {h.payment_mode}</div>
                </div>
                <div style={{ fontWeight:700, color:'#0F6E56' }}>Rs.{Number(h.amount).toLocaleString('en-IN')}</div>
              </div>
            ))
          )}
        </div>
      )}

      <div style={{ background:'#EEEDFE', borderRadius:10, padding:'12px 16px', fontSize:12, color:'#3C3489', marginTop:16 }}>
        💡 Gujarat mein sell karo: Yeh same SaaS model use karo — Rs.999/mo Basic, Rs.1999/mo Pro, Rs.3499/mo Premium. 50 hotels × Rs.1999 = Rs.1 lakh/month revenue!
      </div>
    </div>
  )
}
