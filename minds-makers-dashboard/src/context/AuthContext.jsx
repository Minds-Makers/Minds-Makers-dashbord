import { createContext, useContext, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { notify } from '../lib/notify'

const AuthCtx = createContext()

const MAX_ATTEMPTS = 3
const LOCKOUT_MINUTES = 15

async function hashPass(pass) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pass + 'mm_salt'))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}
async function hashCode(code) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code + 'mm_invite_salt'))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const arr = crypto.getRandomValues(new Uint8Array(12))
  const code = Array.from(arr).map(b => chars[b % chars.length]).join('')
  return `${code.slice(0,4)}-${code.slice(4,8)}-${code.slice(8,12)}`
}

// ── Brute Force Protection ─────────────────────
async function checkBruteForce(email) {
  const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('login_attempts')
    .select('id', { count: 'exact' })
    .eq('email', email.toLowerCase())
    .gte('attempted_at', since)
  if (error) return { locked: false, remaining: MAX_ATTEMPTS }
  const count = data?.length || 0
  return {
    locked: count >= MAX_ATTEMPTS,
    remaining: Math.max(0, MAX_ATTEMPTS - count),
    count
  }
}

async function recordFailedAttempt(email) {
  await supabase.from('login_attempts').insert({ email: email.toLowerCase() })
}

async function clearAttempts(email) {
  await supabase.from('login_attempts').delete().eq('email', email.toLowerCase())
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('mm_user') || 'null') } catch { return null }
  })

  const login = async (email, pass) => {
    if (!isSupabaseConfigured) throw new Error('Database not configured.')

    // ── تحقق من الـ lockout ──
    const { locked, remaining } = await checkBruteForce(email)
    if (locked) {
      throw new Error(`Too many failed attempts. Please wait ${LOCKOUT_MINUTES} minutes before trying again.`)
    }

    const hash = await hashPass(pass)
    const { data, error } = await supabase
      .from('admin_accounts')
      .select('id, name, email, password_hash, created_at')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (error) throw new Error(error.message)

    if (!data || data.password_hash !== hash) {
      // سجّل المحاولة الفاشلة
      await recordFailedAttempt(email)
      const { remaining: rem } = await checkBruteForce(email)
      if (rem === 0) {
        notify('admin_login', { name: 'Unknown', email, status: '🚨 LOCKED OUT after 3 failed attempts' })
        throw new Error(`Too many failed attempts. Account locked for ${LOCKOUT_MINUTES} minutes.`)
      }
      throw new Error(`Incorrect email or password. ${rem} attempt${rem === 1 ? '' : 's'} remaining.`)
    }

    // ── نجح الدخول — امسح المحاولات السابقة ──
    await clearAttempts(email)
    const sessUser = { name: data.name, email: data.email, createdAt: data.created_at }
    sessionStorage.setItem('mm_user', JSON.stringify(sessUser))
    setUser(sessUser)
    notify('admin_login', { name: data.name, email: data.email, status: '✅ Success' })
  }

  const isFirstAdmin = async () => {
    const { count } = await supabase.from('admin_accounts').select('id', { count: 'exact', head: true })
    return count === 0
  }

  const verifyAndConsumeCode = async (code) => {
    const hashed = await hashCode(code)
    const { data, error } = await supabase.from('invite_codes').select('id, used').eq('code_hash', hashed).eq('used', false).maybeSingle()
    if (error || !data) return false
    await supabase.from('invite_codes').delete().eq('id', data.id)
    return true
  }

  const signup = async (name, email, code, pass, pass2) => {
    if (!isSupabaseConfigured) throw new Error('Database not configured.')
    if (pass.length < 8) throw new Error('Password must be at least 8 characters.')
    if (pass !== pass2) throw new Error('Passwords do not match.')
    const first = await isFirstAdmin()
    if (!first) {
      if (!code) throw new Error('Invite code is required.')
      const valid = await verifyAndConsumeCode(code)
      if (!valid) throw new Error('Invalid or already used invite code.')
    }
    const emailLow = email.toLowerCase()
    const { data: existing } = await supabase.from('admin_accounts').select('id').eq('email', emailLow).maybeSingle()
    if (existing) throw new Error('An account with this email already exists.')
    const hash = await hashPass(pass)
    const { data, error } = await supabase.from('admin_accounts').insert({ name, email: emailLow, password_hash: hash }).select().single()
    if (error) throw new Error(error.message)
    const sessUser = { name: data.name, email: data.email, createdAt: data.created_at }
    sessionStorage.setItem('mm_user', JSON.stringify(sessUser))
    setUser(sessUser)
    notify('admin_signup', { name: data.name, email: data.email })
  }

  const logout = () => { sessionStorage.removeItem('mm_user'); setUser(null) }

  const getAdmins = async () => {
    if (!isSupabaseConfigured) return []
    const { data, error } = await supabase.from('admin_accounts').select('id, name, email, created_at').order('created_at', { ascending: true })
    if (error) return []
    return data
  }

  const removeAdmin = async (email) => {
    if (email === user?.email) throw new Error("Can't remove your own account.")
    const { error } = await supabase.from('admin_accounts').delete().eq('email', email)
    if (error) throw new Error(error.message)
  }

  const generateNewInviteCode = async () => {
    const code = generateInviteCode()
    const hashed = await hashCode(code)
    await supabase.from('invite_codes').delete().eq('used', false)
    const { error } = await supabase.from('invite_codes').insert({ code_hash: hashed, used: false, created_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
    return code
  }

  return (
    <AuthCtx.Provider value={{ user, login, signup, logout, getAdmins, removeAdmin, generateNewInviteCode, isFirstAdmin }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
