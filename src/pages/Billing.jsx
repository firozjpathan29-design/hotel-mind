import { useState, useEffect } from 'react'
import { initiatePayment, calculateBill } from '../lib/razorpay'
import { printInvoice, generateInvoiceNumber } from '../lib/invoice'
import { getBillingPending, getBillingPaid, markBookingPaid } from '../lib/supabase'

const HOTEL = {
  name:    'Hotel Sunrise',
  address: '123, Ashram Road, Ahmedabad, Gujarat - 380009',
  phone:   '+91 79-12345678',
  gst:     '24AABCS1234D1ZA',
}

function nightsBetween(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 1
  const ms = new Date(checkOut) - new Date(checkIn)
  return Math.max(1, Math.round(ms / (1000*60*60*24)))
}

function fmtDate(d) {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })
}

function isToday(dateStr) {
  if (!dateStr) return false
  const today = new Date()
  const d = new Date(dateStr)
  return d.toDateString() === today.toDateString()
}

// Bill summary card
function BillSummary({ pricePerNight, nights }) {
  const bill = calculateBill(pricePerNight, nights, 0)
  return (
    <div style={{ background: '#F5F4F0', borderRadius: 10, padding: '12px 14px', fontSize: 13 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ color: '#888780' }}>Room ({nights} raat x Rs.{pricePerNight.toLocaleString('en-IN')})</span>
        <span>Rs.{bill.roomCharge.toLocaleString('en-IN')}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ color: '#888780' }}>GST ({bill.gstLabel})</span>
        <span>Rs.{bill.gstAmount.toLocaleString('en-IN')}</span>
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        borderTop: '0.5px solid rgba(0,0,0,0.1)', paddingTop: 8, marginTop: 4,
        fontWeight: 700, fontSize: 15,
      }}>
        <span>Total</span>
        <span style={{ color: '#0F6E56' }}>Rs.{bill.total.toLocaleString('en-IN')}</span>
      </div>
    </div>
  )
}

// Pending checkout card
function PendingCard({ booking, onPaid }) {
  const [paying, setPaying] = useState(false)
  const guest = booking.guests || {}
  const room  = booking.rooms || {}
  const nights = nightsBetween(booking.check_in, booking.check_out)
  const pricePerNight = room.price_per_night || 0
  const bill = calculateBill(pricePerNight, nights, 0)

  async function handleRazorpay() {
    setPaying(true)
    await initiatePayment({
      amount:      bill.total,
      bookingId:   booking.id,
      guestName:   guest.name,
      guestEmail:  guest.email,
      guestPhone:  guest.phone,
      description: 'Room ' + room.room_number + ' — ' + nights + ' raat',
      onSuccess: function(res) {
        onPaid(booking, bill, 'Razorpay', res.razorpay_payment_id)
        setPaying(false)
      },
      onFailure: function(msg) {
        alert('Payment fail: ' + msg)
        setPaying(false)
      },
    })
  }

  function handleCash() {
    if (window.confirm('Rs.' + bill.total.toLocaleString('en-IN') + ' cash liya? Confirm karo.')) {
      onPaid(booking, bill, 'Cash', null)
    }
  }

  return (
    <div style={{ background: '#fff', border: '0.5px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#EEEDFE', color: '#3C3489', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
          {(guest.name || 'G').charAt(0)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1A18' }}>{guest.name || 'Guest'}</div>
          <div style={{ fontSize: 12, color: '#888780' }}>{guest.phone || '-'} · Room {room.room_number || '-'} ({room.room_type || '-'})</div>
          <div style={{ fontSize: 12, color: '#888780' }}>{fmtDate(booking.check_in)} → {fmtDate(booking.check_out)} · {nights} raat</div>
        </div>
        <span style={{ background: '#FAEEDA', color: '#633806', fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20 }}>Checkout Pending</span>
      </div>

      <BillSummary pricePerNight={pricePerNight} nights={nights} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
        <button onClick={handleRazorpay} disabled={paying} style={{
          padding: '10px', borderRadius: 8, border: 'none',
          background: paying ? '#ccc' : '#1D9E75',
          color: '#fff', fontSize: 13, fontWeight: 600,
          cursor: paying ? 'not-allowed' : 'pointer',
        }}>
          {paying ? '⏳ Opening...' : '💳 Razorpay'}
        </button>
        <button onClick={handleCash} style={{
          padding: '10px', borderRadius: 8,
          border: '0.5px solid rgba(0,0,0,0.12)',
          background: '#fff', color: '#1A1A18',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}>
          💵 Cash Liya
        </button>
      </div>
    </div>
  )
}

// Paid record row
function PaidRow({ record, onPrint }) {
  const guest = record.guests || {}
  const room  = record.rooms || {}
  const nights = nightsBetween(record.check_in, record.check_out)
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', border: '0.5px solid rgba(0,0,0,0.07)', borderRadius: 10, marginBottom: 8, background: '#fff', fontSize: 13 }}>
      <div>
        <div style={{ fontWeight: 500, color: '#1A1A18' }}>{guest.name || 'Guest'}</div>
        <div style={{ fontSize: 11, color: '#888780' }}>
          Room {room.room_number || '-'} · {nights} raat · {fmtDate(record.paid_at)}
        </div>
        <div style={{ fontSize: 11, color: '#888780' }}>
          #{record.invoice_number || '-'} · {record.payment_mode || '-'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#0F6E56' }}>Rs.{Number(record.paid_amount || 0).toLocaleString('en-IN')}</span>
        <button onClick={() => onPrint(record)} style={{
          padding: '5px 12px', borderRadius: 8,
          border: '0.5px solid rgba(0,0,0,0.12)',
          background: '#F5F4F0', color: '#1A1A18',
          fontSize: 12, cursor: 'pointer',
        }}>🖨️ Invoice</button>
      </div>
    </div>
  )
}

export default function Billing() {
  const [pending, setPending] = useState([])
  const [paid, setPaid]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const [tab, setTab]         = useState('pending')

  useEffect(() => { load() }, [])

  async function load() {
    try {
      setLoading(true)
      const [p, d] = await Promise.all([getBillingPending(), getBillingPaid()])
      setPending(p)
      setPaid(d)
      setError(null)
    } catch (err) {
      console.error(err)
      setError('Billing data load nahi hua. Internet check karo ya page refresh karo.')
    } finally {
      setLoading(false)
    }
  }

  function buildInvoiceData(booking, bill, paymentMode, paymentId, invoiceNumber) {
    const guest = booking.guests || {}
    const room  = booking.rooms || {}
    return {
      guestName: guest.name || 'Guest',
      guestPhone: guest.phone || '',
      guestEmail: guest.email || '',
      roomNumber: room.room_number || '-',
      roomType: room.room_type || '-',
      checkIn: fmtDate(booking.check_in),
      checkOut: fmtDate(booking.check_out),
      nights: nightsBetween(booking.check_in, booking.check_out),
      pricePerNight: room.price_per_night || 0,
      extras: [],
      total: bill.total,
      gstRate: bill.gstRate,
      gstAmount: bill.gstAmount,
      subtotal: bill.subtotal,
      paidAt: new Date().toLocaleDateString('en-IN'),
      invoiceNumber,
      paymentMode,
      paymentId,
      hotelName: HOTEL.name,
      hotelAddress: HOTEL.address,
      hotelPhone: HOTEL.phone,
      hotelGST: HOTEL.gst,
      date: new Date().toLocaleDateString('en-IN'),
    }
  }

  async function handlePaid(booking, bill, paymentMode, paymentId) {
    const invoiceNumber = generateInvoiceNumber()
    try {
      await markBookingPaid(booking.id, { paymentMode, paymentId, invoiceNumber, total: bill.total })
      printInvoice(buildInvoiceData(booking, bill, paymentMode, paymentId, invoiceNumber))
      setTab('paid')
      await load()
    } catch (err) {
      console.error(err)
      alert('Payment save nahi hua, dobara try karo.')
    }
  }

  function handlePrint(record) {
    const room = record.rooms || {}
    const nights = nightsBetween(record.check_in, record.check_out)
    const bill = calculateBill(room.price_per_night || 0, nights, 0)
    printInvoice(buildInvoiceData(record, bill, record.payment_mode, record.payment_id, record.invoice_number))
  }

  if (loading) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#888780' }}>⏳ Billing load ho raha hai...</div>
  )

  if (error) return (
    <div style={{ padding:'40px', textAlign:'center', color:'#A32D2D' }}>
      {error}
      <div style={{ marginTop:10 }}>
        <button onClick={load} style={{ padding:'7px 15px', borderRadius:8, border:'none', background:'#1A1A18', color:'#fff', cursor:'pointer' }}>Phir try karo</button>
      </div>
    </div>
  )

  const todayRevenue = paid.filter(p => isToday(p.paid_at)).reduce((s, p) => s + Number(p.paid_amount || 0), 0)
  const todayPaidCount = paid.filter(p => isToday(p.paid_at)).length

  return (
    <div style={{ padding: '20px 24px', maxWidth: 720, margin: '0 auto' }}>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1A1A18' }}>💳 Billing</h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#888780' }}>
          {pending.length} checkout pending · Aaj revenue: Rs.{todayRevenue.toLocaleString('en-IN')}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Checkout Pending', val: pending.length,  bg: '#FAEEDA', c: '#633806' },
          { label: 'Aaj Paid',         val: todayPaidCount,  bg: '#E1F5EE', c: '#085041' },
          { label: 'Aaj Revenue',      val: 'Rs.'+todayRevenue.toLocaleString('en-IN'), bg: '#EEEDFE', c: '#3C3489' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.val}</div>
            <div style={{ fontSize: 11, color: s.c, opacity: 0.7, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[
          { k: 'pending', l: 'Checkout Pending (' + pending.length + ')' },
          { k: 'paid',    l: 'Paid Records ('    + paid.length    + ')' },
        ].map(({ k, l }) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '7px 16px', borderRadius: 20,
            border: '0.5px solid rgba(0,0,0,0.12)',
            background: tab===k ? '#1A1A18' : '#fff',
            color:      tab===k ? '#fff'    : '#888780',
            fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'pending' && (
        pending.length === 0
          ? <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 14 }}>Koi checkout pending nahi ✅</div>
          : pending.map(b => <PendingCard key={b.id} booking={b} onPaid={handlePaid} />)
      )}

      {tab === 'paid' && (
        <div>
          <div style={{ background: '#F5F4F0', borderRadius: 10, padding: '10px 14px', marginBottom: 12, fontSize: 12, color: '#888780' }}>
            🖨️ Invoice button dabao — PDF print/download ho jayega
          </div>
          {paid.length === 0
            ? <div style={{ textAlign: 'center', padding: 40, color: '#888780', fontSize: 14 }}>Abhi koi payment nahi hua</div>
            : paid.map(r => <PaidRow key={r.id} record={r} onPrint={handlePrint} />)
          }
        </div>
      )}
    </div>
  )
}
