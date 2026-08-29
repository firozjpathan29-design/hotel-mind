import { useState, useEffect } from 'react'
import { getHotelSettings, updateHotelSettings, getStaff, createStaffMember, updateStaffActive, deleteStaffMember } from '../lib/supabase'

const ROLES = ['Reception', 'Housekeeping', 'Manager', 'Accountant', 'Security']

function Section({ title, icon, children }) {
  return (
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ padding: '13px 16px', borderBottom: '0.5px solid rgba(0,0,0,0.06)', fontWeight: 600, fontSize: 14, color: '#1A1A18', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{icon}</span>{title}
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 12, color: '#888780', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}

const INPUT = { width: '100%', padding: '9px 12px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.12)', fontSize: 13, outline: 'none', boxSizing: 'border-box', background: '#FAFAF8' }

export default function Settings() {
  const [hotel, setHotel]         = useState(null)
  const [staff, setStaff]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [showAdd, setShowAdd]     = useState(false)
  const [newStaff, setNewStaff]   = useState({ name: '', role: 'Reception', phone: '' })
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [staffSaving, setStaffSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('hotel')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [h, s] = await Promise.all([getHotelSettings(), getStaff()])
      setHotel({
        name:       h.name || '',
        address:    h.address || '',
        phone:      h.phone || '',
        email:      h.email || '',
        gst:        h.gst_number || '',
        checkIn:    h.check_in_time || '12:00',
        checkOut:   h.check_out_time || '11:00',
        currency:   h.currency || 'INR',
        totalRooms: h.total_rooms || '',
      })
      setStaff(s)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Settings load nahi hue. Internet check karo ya page refresh karo.')
    } finally {
      setLoading(false)
    }
  }

  const h = (k, v) => setHotel(p => ({ ...p, [k]: v }))
  const ns = (k, v) => setNewStaff(p => ({ ...p, [k]: v }))

  async function saveSettings() {
    setSaving(true)
    try {
      await updateHotelSettings({
        name:           hotel.name,
        address:        hotel.address,
        phone:          hotel.phone,
        email:          hotel.email,
        gst_number:     hotel.gst,
        check_in_time:  hotel.checkIn,
        check_out_time: hotel.checkOut,
        currency:       hotel.currency,
        total_rooms:    hotel.totalRooms ? Number(hotel.totalRooms) : null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error(err)
      alert('Settings save nahi hue, dobara try karo.')
    } finally {
      setSaving(false)
    }
  }

  async function addStaff() {
    if (!newStaff.name || !newStaff.phone) return
    setStaffSaving(true)
    try {
      await createStaffMember({ name: newStaff.name, role: newStaff.role, phone: newStaff.phone, active: true })
      setNewStaff({ name: '', role: 'Reception', phone: '' })
      setShowAdd(false)
      const s = await getStaff()
      setStaff(s)
    } catch (err) {
      console.error(err)
      alert('Staff save nahi hua, dobara try karo.')
    } finally {
      setStaffSaving(false)
    }
  }

  async function toggleStaff(id, current) {
    setStaff(p => p.map(s => s.id === id ? { ...s, active: !current } : s)) // optimistic
    try {
      await updateStaffActive(id, !current)
    } catch (err) {
      console.error(err)
      alert('Status save nahi hua, dobara try karo.')
      const s = await getStaff()
      setStaff(s)
    }
  }

  async function removeStaff(id) {
    if (!window.confirm('Is staff member ko remove karna chahte ho?')) return
    setStaff(p => p.filter(s => s.id !== id)) // optimistic
    try {
      await deleteStaffMember(id)
    } catch (err) {
      console.error(err)
      alert('Remove nahi hua, dobara try karo.')
      const s = await getStaff()
      setStaff(s)
    }
  }

  const TABS = [
    { k: 'hotel',  l: '🏨 Hotel Info'    },
    { k: 'staff',  l: '👷 Staff'         },
    { k: 'timing', l: '⏰ Timing'        },
    { k: 'api',    l: '🔑 API Keys'      },
  ]

  if (loading) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#888780' }}>⏳ Settings load ho rahe hain...</div>
  )

  if (error) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#A32D2D' }}>
      {error}
      <div style={{ marginTop:10 }}>
        <button onClick={load} style={{ padding:'7px 15px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', cursor:'pointer' }}>Phir try karo</button>
      </div>
    </div>
  )

  return (
    <div style={{ padding: '20px 24px', maxWidth: 760, margin: '0 auto' }}>

      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 24, width: 380, maxWidth: '90vw' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>New Staff Add Karo</div>
            <Field label="Naam">
              <input value={newStaff.name} onChange={e => ns('name', e.target.value)} placeholder="Raju Sharma" style={INPUT}/>
            </Field>
            <Field label="Phone">
              <input value={newStaff.phone} onChange={e => ns('phone', e.target.value)} placeholder="98765 12345" style={INPUT}/>
            </Field>
            <Field label="Role">
              <select value={newStaff.role} onChange={e => ns('role', e.target.value)} style={{ ...INPUT, cursor: 'pointer' }}>
                {ROLES.map(r => <option key={r}>{r}</option>)}
              </select>
            </Field>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={() => setShowAdd(false)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={addStaff} disabled={!newStaff.name || !newStaff.phone || staffSaving} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#1A1A18', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: staffSaving?0.6:1 }}>
                {staffSaving ? 'Saving...' : 'Add Staff'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A1A18' }}>⚙️ Settings</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888780' }}>Hotel settings aur staff management</p>
        </div>
        {activeTab !== 'staff' && activeTab !== 'api' && (
          <button onClick={saveSettings} disabled={saving} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: saved ? '#1D9E75' : '#1A1A18', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s', opacity: saving?0.6:1 }}>
            {saving ? 'Saving...' : saved ? '✅ Saved!' : '💾 Save'}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {TABS.map(({ k, l }) => (
          <button key={k} onClick={() => setActiveTab(k)} style={{ padding: '7px 14px', borderRadius: 20, border: '0.5px solid rgba(0,0,0,0.12)', background: activeTab === k ? '#1A1A18' : '#fff', color: activeTab === k ? '#fff' : '#888780', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      {activeTab === 'hotel' && (
        <Section title="Hotel Information" icon="🏨">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Hotel ka naam">
              <input value={hotel.name} onChange={e => h('name', e.target.value)} style={INPUT}/>
            </Field>
            <Field label="Phone number">
              <input value={hotel.phone} onChange={e => h('phone', e.target.value)} style={INPUT}/>
            </Field>
            <Field label="Email">
              <input value={hotel.email} onChange={e => h('email', e.target.value)} style={INPUT}/>
            </Field>
            <Field label="GST number">
              <input value={hotel.gst} onChange={e => h('gst', e.target.value)} style={INPUT}/>
            </Field>
            <Field label="Total rooms">
              <input value={hotel.totalRooms} onChange={e => h('totalRooms', e.target.value)} type="number" style={INPUT}/>
            </Field>
            <Field label="Currency">
              <select value={hotel.currency} onChange={e => h('currency', e.target.value)} style={{ ...INPUT, cursor: 'pointer' }}>
                <option value="INR">INR (Rs.)</option>
                <option value="USD">USD ($)</option>
              </select>
            </Field>
          </div>
          <Field label="Address">
            <textarea value={hotel.address} onChange={e => h('address', e.target.value)} rows={2} style={{ ...INPUT, resize: 'vertical' }}/>
          </Field>
        </Section>
      )}

      {activeTab === 'staff' && (
        <Section title="Staff Management" icon="👷">
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button onClick={() => setShowAdd(true)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#1A1A18', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Add Staff</button>
          </div>
          {staff.length === 0 ? (
            <div style={{ textAlign:'center', padding:20, color:'#888780', fontSize:13 }}>Abhi koi staff add nahi hua.</div>
          ) : staff.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < staff.length - 1 ? '0.5px solid rgba(0,0,0,0.05)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: s.active ? '#E1F5EE' : '#F1EFE8', color: s.active ? '#085041' : '#888780', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                {s.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 13, color: s.active ? '#1A1A18' : '#888780' }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#888780' }}>{s.role} · {s.phone}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: s.active ? '#E1F5EE' : '#F1EFE8', color: s.active ? '#085041' : '#888780' }}>
                {s.active ? 'Active' : 'Inactive'}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => toggleStaff(s.id, s.active)} style={{ padding: '4px 10px', borderRadius: 6, border: '0.5px solid rgba(0,0,0,0.12)', background: '#fff', fontSize: 11, cursor: 'pointer', color: '#888780' }}>
                  {s.active ? 'Deactivate' : 'Activate'}
                </button>
                <button onClick={() => removeStaff(s.id)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#FCEBEB', fontSize: 11, cursor: 'pointer', color: '#A32D2D' }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </Section>
      )}

      {activeTab === 'timing' && (
        <Section title="Check-in / Check-out Timing" icon="⏰">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Field label="Check-in time">
              <input type="time" value={hotel.checkIn} onChange={e => h('checkIn', e.target.value)} style={INPUT}/>
            </Field>
            <Field label="Check-out time">
              <input type="time" value={hotel.checkOut} onChange={e => h('checkOut', e.target.value)} style={INPUT}/>
            </Field>
          </div>
          <div style={{ background: '#EEEDFE', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#3C3489', marginTop: 4 }}>
            💡 Yeh timings Billing page pe checkout calculate karne ke liye use honge.
          </div>
        </Section>
      )}

      {activeTab === 'api' && (
        <Section title="API Keys" icon="🔑">
          <div style={{ background: '#FCEBEB', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#A32D2D', marginBottom: 14 }}>
            ⚠️ Yeh keys sirf .env file mein rakho. Kisi ko share mat karo!
          </div>
          {[
            { label: 'Supabase URL',       key: 'VITE_SUPABASE_URL',       hint: 'supabase.com > Project > Settings > API' },
            { label: 'Supabase Anon Key',  key: 'VITE_SUPABASE_ANON_KEY',  hint: 'supabase.com > Project > Settings > API' },
            { label: 'Claude API Key',     key: 'VITE_CLAUDE_API_KEY',     hint: 'console.anthropic.com' },
            { label: 'Razorpay Key ID',    key: 'VITE_RAZORPAY_KEY_ID',    hint: 'razorpay.com > Settings > API Keys' },
          ].map(({ label, key, hint }) => (
            <Field key={key} label={label}>
              <input placeholder={'See .env file: ' + key} disabled style={{ ...INPUT, color: '#888780', cursor: 'not-allowed' }}/>
              <div style={{ fontSize: 11, color: '#888780', marginTop: 3 }}>📍 {hint}</div>
            </Field>
          ))}
          <div style={{ background: '#F5F4F0', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#888780', marginTop: 4 }}>
            Keys change karne ke liye <strong>.env</strong> file directly edit karo aur <code>npm run dev</code> restart karo.
          </div>
        </Section>
      )}
    </div>
  )
}
