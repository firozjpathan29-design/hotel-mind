// src/lib/auth.js — Phase 5
import { supabase } from './supabase'

// Login
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

// Logout
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Current user
export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Auth state change listener
export function onAuthChange(callback) {
  return supabase.auth.onAuthStateChange(function(event, session) {
    callback(session ? session.user : null)
  })
}
