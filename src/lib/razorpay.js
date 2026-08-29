// src/lib/razorpay.js — Phase 3
const RK = import.meta.env.VITE_RAZORPAY_KEY_ID

function loadRazorpay() {
  return new Promise(res => {
    if (window.Razorpay) { res(true); return }
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.onload  = () => res(true)
    s.onerror = () => res(false)
    document.body.appendChild(s)
  })
}

export async function initiatePayment({
  amount, bookingId, guestName, guestEmail,
  guestPhone, description, onSuccess, onFailure
}) {
  const loaded = await loadRazorpay()
  if (!loaded) { alert('Razorpay load nahi hua.'); return }

  const rzp = new window.Razorpay({
    key:         RK,
    amount:      amount * 100,
    currency:    'INR',
    name:        'HotelMind',
    description: description || 'Booking #' + bookingId,
    prefill:     { name: guestName, email: guestEmail || '', contact: guestPhone || '' },
    notes:       { booking_id: bookingId },
    theme:       { color: '#1A1A18' },
    handler: function(response) {
      onSuccess && onSuccess({ ...response, amount, bookingId })
    },
    modal: {
      ondismiss: function() { onFailure && onFailure('Payment cancel kiya') }
    },
  })
  rzp.on('payment.failed', function(r) {
    onFailure && onFailure(r.error.description)
  })
  rzp.open()
}

// India hotel GST rules:
// < Rs.1000/night  = 0% GST
// Rs.1000-7499    = 12% GST
// Rs.7500+        = 18% GST
export function calculateGST(pricePerNight) {
  if (pricePerNight < 1000) return { rate: 0,  label: '0% GST'  }
  if (pricePerNight < 7500) return { rate: 12, label: '12% GST' }
  return                           { rate: 18, label: '18% GST' }
}

export function calculateBill(pricePerNight, nights, extras) {
  extras = extras || 0
  const roomCharge = pricePerNight * nights
  const subtotal   = roomCharge + extras
  const gst        = calculateGST(pricePerNight)
  const gstAmount  = Math.round(subtotal * gst.rate / 100)
  return {
    roomCharge,
    extras,
    subtotal,
    gstRate:  gst.rate,
    gstLabel: gst.label,
    gstAmount,
    total: subtotal + gstAmount,
  }
}
