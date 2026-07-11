import { createContext, useContext, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const AuthCtx = createContext()

async function hashPass(pass) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pass + 'mm_salt'))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hashCode(code) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code + 'mm_invite_salt'))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// توليد رمز دعوة عشوائي — صالح مرة واحدة فقط
function generateInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const arr = crypto.getRandomValues(new Uint8Array(12))
  const code = Array.from(arr).map(b => chars[b % chars.length]).join('')
  // شكل: XXXX-XXXX-XXXX
  return `${code.slice(0,4)}-${code.slice(4,8)}-${code.slice(8,12)}`
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('mm_user') || 'null') } catch { return null }
  })

  // هل فيه أدمن في الـ database؟
  const isFirstAdmin = async () => {
    const { count } = await supabase
      .from('admin_accounts')
      .select('id', { count: 'exact', head: true })
    return count === 0
  }

  // التحقق من رمز الدعوة واستخدامه (مرة واحدة فقط)
  const verifyAndConsumeCode = async (code) => {
    const hashed = await hashCode(code)
    const { data, error } = await supabase
      .from('invite_codes')
      .select('id, used')
      .eq('code_hash', hashed)
      .eq('used', false)
      .maybeSingle()
    if (error || !data) return false
    // امسح الرمز فوراً بعد الاستخدام
    await supabase.from('invite_codes').delete().eq('id', data.id)
    return true
  }

  const login = async (email, pass) => {
    if (!isSupabaseConfigured) throw new Error('Database not configured.')
    const hash = await hashPass(pass)
    const { data, error } = await supabase
      .from('admin_accounts')
      .select('id, name, email, password_hash, created_at')
      .eq('email', email.toLowerCase())
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data || data.password_hash !== hash) throw new Error('Incorrect email or password.')
    const sessUser = { name: data.name, email: data.email, createdAt: data.created_at }
    sessionStorage.setItem('mm_user', JSON.stringify(sessUser))
    setUser(sessUser)
  }

  const signup = async (name, email, code, pass, pass2) => {
    if (!isSupabaseConfigured) throw new Error('Database not configured.')
    if (pass.length < 8) throw new Error('Password must be at least 8 characters.')
    if (pass !== pass2) throw new Error('Passwords do not match.')

    const first = await isFirstAdmin()

    if (!first) {
      // مش أول أدمن — لازم رمز دعوة صالح
      if (!code) throw new Error('Invite code is required.')
      const valid = await verifyAndConsumeCode(code)
      if (!valid) throw new Error('Invalid or already used invite code.')
    }

    const emailLow = email.toLowerCase()
    const { data: existing } = await supabase
      .from('admin_accounts')
      .select('id')
      .eq('email', emailLow)
      .maybeSingle()
    if (existing) throw new Error('An account with this email already exists.')

    const hash = await hashPass(pass)
    const { data, error } = await supabase
      .from('admin_accounts')
      .insert({ name, email: emailLow, password_hash: hash })
      .select()
      .single()
    if (error) throw new Error(error.message)

    const sessUser = { name: data.name, email: data.email, createdAt: data.created_at }
    sessionStorage.setItem('mm_user', JSON.stringify(sessUser))
    setUser(sessUser)
  }

  const logout = () => {
    sessionStorage.removeItem('mm_user')
    setUser(null)
  }

  const getAdmins = async () => {
    if (!isSupabaseConfigured) return []
    const { data, error } = await supabase
      .from('admin_accounts')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: true })
    if (error) return []
    return data
  }

  const removeAdmin = async (email) => {
    if (email === user?.email) throw new Error("Can't remove your own account.")
    const { error } = await supabase.from('admin_accounts').delete().eq('email', email)
    if (error) throw new Error(error.message)
  }

  // توليد رمز دعوة جديد وحفظه مشفر في الـ database
  const generateNewInviteCode = async () => {
    const code = generateInviteCode()
    const hashed = await hashCode(code)
    // احذف أي رموز قديمة غير مستخدمة
    await supabase.from('invite_codes').delete().eq('used', false)
    // احفظ الجديد
    const { error } = await supabase
      .from('invite_codes')
      .insert({ code_hash: hashed, used: false, created_at: new Date().toISOString() })
    if (error) throw new Error(error.message)
    // الرمز الظاهر ليك — مش محفوظ في الـ database بالشكل ده
    return code
  }

  return (
    <AuthCtx.Provider value={{
      user, login, signup, logout,
      getAdmins, removeAdmin,
      generateNewInviteCode, isFirstAdmin
    }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
