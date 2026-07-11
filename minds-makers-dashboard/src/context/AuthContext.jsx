import { createContext, useContext, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'

const AuthCtx = createContext()

const INVITE_CODE = 'MM-ADMIN-2024'

async function hashPass(pass) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pass + 'mm_salt'))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem('mm_user') || 'null') } catch { return null }
  })

  const login = async (email, pass) => {
    if (!isSupabaseConfigured) throw new Error('Database not configured yet. Paste your Supabase credentials in src/lib/supabaseClient.js')
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
    if (!isSupabaseConfigured) throw new Error('Database not configured yet. Paste your Supabase credentials in src/lib/supabaseClient.js')
    if (code !== INVITE_CODE) throw new Error('Invalid invite code.')
    if (pass.length < 8) throw new Error('Password must be at least 8 characters.')
    if (pass !== pass2) throw new Error('Passwords do not match.')

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

  return (
    <AuthCtx.Provider value={{ user, login, signup, logout, getAdmins, removeAdmin }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
