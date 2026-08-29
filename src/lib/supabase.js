import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const HOTEL_ID = import.meta.env.VITE_HOTEL_ID

export async function getRooms() {
  const { data, error } = await supabase
    .from('rooms').select('*')
    .eq('hotel_id', HOTEL_ID).order('room_number')
  if (error) throw error
  return data
}

export async function updateRoomStatus(roomId, status) {
  const { error } = await supabase
    .from('rooms').update({ status }).eq('id', roomId)
  if (error) throw error
}

export async function getBookings({ status, date } = {}) {
  let q = supabase.from('bookings')
    .select('*, guests(name,phone,email), rooms(room_number,room_type,price_per_night)')
    .eq('hotel_id', HOTEL_ID).order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  if (date)   q = q.eq('check_in', date)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function createBooking(booking) {
  const { data, error } = await supabase
    .from('bookings').insert({ ...booking, hotel_id: HOTEL_ID }).select().single()
  if (error) throw error
  return data
}

export async function getGuests() {
  const { data, error } = await supabase
    .from('guests').select('*, bookings(id,check_in,check_out,total_amount,status)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createGuest(guest) {
  const { data, error } = await supabase
    .from('guests').insert(guest).select().single()
  if (error) throw error
  return data
}

export async function getComplaints() {
  const { data, error } = await supabase
    .from('complaints')
    .select('*, guests(name,phone), rooms(room_number)')
    .eq('hotel_id', HOTEL_ID).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function resolveComplaint(id, aiReply) {
  const { error } = await supabase
    .from('complaints').update({ status: 'resolved', ai_reply: aiReply }).eq('id', id)
  if (error) throw error
}

export async function getHousekeepingTasks() {
  const { data, error } = await supabase
    .from('housekeeping').select('*, rooms(room_number)')
    .eq('hotel_id', HOTEL_ID).order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function updateTaskStatus(id, status) {
  const { error } = await supabase
    .from('housekeeping').update({ status }).eq('id', id)
  if (error) throw error
}

export async function createTask(task) {
  const { data, error } = await supabase
    .from('housekeeping').insert({ ...task, hotel_id: HOTEL_ID }).select().single()
  if (error) throw error
  return data
}

export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0]
  const [b, r, c] = await Promise.all([
    supabase.from('bookings').select('id,total_amount,status,check_in,check_out').eq('hotel_id', HOTEL_ID),
    supabase.from('rooms').select('id,status').eq('hotel_id', HOTEL_ID),
    supabase.from('complaints').select('id,status').eq('hotel_id', HOTEL_ID).eq('status', 'open'),
  ])
  const tb = (b.data || []).filter(x => x.check_in === today)
  return {
    todayBookings:  tb.length,
    todayRevenue:   tb.reduce((s, x) => s + (x.total_amount || 0), 0),
    totalRooms:     (r.data || []).length,
    occupiedRooms:  (r.data || []).filter(x => x.status === 'occupied').length,
    openComplaints: (c.data || []).length,
    checkoutsToday: (b.data || []).filter(x => x.check_out === today).length,
  }
}
export async function getDashboardLists() {
  const today = new Date().toISOString().split('T')[0]

  const [bookingsRes, housekeepingRes] = await Promise.all([
    supabase.from('bookings')
      .select('id, check_in, check_out, total_amount, status, guests(name), rooms(room_number)')
      .eq('hotel_id', HOTEL_ID)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('housekeeping')
      .select('id, task, priority, assigned, status, rooms(room_number)')
      .eq('hotel_id', HOTEL_ID)
      .order('created_at', { ascending: false })
      .limit(6),
  ])

  if (bookingsRes.error) throw bookingsRes.error
  if (housekeepingRes.error) throw housekeepingRes.error

  const allBookings = bookingsRes.data || []
  const checkouts = allBookings.filter(b => b.check_out === today)
  const recentBookings = allBookings.slice(0, 5)

  return {
    checkouts,
    recentBookings,
    housekeeping: housekeepingRes.data || [],
  }
}export async function createComplaint(complaint) {
  const { data, error } = await supabase
    .from('complaints').insert({ ...complaint, hotel_id: HOTEL_ID }).select().single()
  if (error) throw error
  return data
}export async function reassignTask(id, assigned) {
  const { error } = await supabase
    .from('housekeeping').update({ assigned }).eq('id', id)
  if (error) throw error
}export async function getBillingPending() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, guests(name,phone,email), rooms(room_number,room_type,price_per_night)')
    .eq('hotel_id', HOTEL_ID)
    .neq('status', 'cancelled')
    .or('payment_status.is.null,payment_status.eq.pending')
    .order('check_in', { ascending: false })
  if (error) throw error
  return data
}

export async function getBillingPaid() {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, guests(name,phone,email), rooms(room_number,room_type,price_per_night)')
    .eq('hotel_id', HOTEL_ID)
    .eq('payment_status', 'paid')
    .order('paid_at', { ascending: false })
  if (error) throw error
  return data
}

export async function markBookingPaid(bookingId, { paymentMode, paymentId, invoiceNumber, total }) {
  const { error } = await supabase
    .from('bookings')
    .update({
      payment_status: 'paid',
      payment_mode: paymentMode,
      payment_id: paymentId,
      invoice_number: invoiceNumber,
      paid_amount: total,
      paid_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
  if (error) throw error
}export async function getHotelSettings() {
  const { data, error } = await supabase
    .from('hotels').select('*').eq('id', HOTEL_ID).single()
  if (error) throw error
  return data
}

export async function updateHotelSettings(fields) {
  const { error } = await supabase
    .from('hotels').update(fields).eq('id', HOTEL_ID)
  if (error) throw error
}

export async function getStaff() {
  const { data, error } = await supabase
    .from('staff').select('*').eq('hotel_id', HOTEL_ID).order('created_at')
  if (error) throw error
  return data
}

export async function createStaffMember(staffMember) {
  const { data, error } = await supabase
    .from('staff').insert({ ...staffMember, hotel_id: HOTEL_ID }).select().single()
  if (error) throw error
  return data
}

export async function updateStaffActive(id, active) {
  const { error } = await supabase
    .from('staff').update({ active }).eq('id', id)
  if (error) throw error
}

export async function deleteStaffMember(id) {
  const { error } = await supabase
    .from('staff').delete().eq('id', id)
  if (error) throw error
}const PLAN_PRICES = { basic: 999, pro: 1999, premium: 3499 }

export async function getSubscription() {
  const { data, error } = await supabase
    .from('hotels').select('plan, plan_started_at, plan_renewal_date').eq('id', HOTEL_ID).single()
  if (error) throw error
  return data
}

export async function changePlan(newPlan) {
  const renewalDate = new Date()
  renewalDate.setMonth(renewalDate.getMonth() + 1)
  const { error } = await supabase
    .from('hotels')
    .update({
      plan: newPlan,
      plan_started_at: new Date().toISOString(),
      plan_renewal_date: renewalDate.toISOString().split('T')[0],
    })
    .eq('id', HOTEL_ID)
  if (error) throw error

  await supabase.from('subscription_history').insert({
    hotel_id: HOTEL_ID,
    plan: newPlan,
    amount: PLAN_PRICES[newPlan] || 0,
    payment_mode: 'manual',
  })
}

export async function getSubscriptionHistory() {
  const { data, error } = await supabase
    .from('subscription_history')
    .select('*')
    .eq('hotel_id', HOTEL_ID)
    .order('paid_at', { ascending: false })
  if (error) throw error
  return data
}
