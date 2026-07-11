import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import logo from '../assets/logo-64.png'

export default function Login() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('login')
  const [isFirst, setIsFirst] = useState(false)

  // لو مفيش أدمن → اخفي حقل الـ invite code
  useEffect(() => {
    async function check() {
      const { count } = await supabase
        .from('admin_accounts')
        .select('id', { count: 'exact', head: true })
      setIsFirst(count === 0)
    }
    check()
  }, [mode])

  // login state
  const [lEmail, setLEmail] = useState('')
  const [lPass, setLPass] = useState('')
  const [lMsg, setLMsg] = useState(null)
  const [lLoading, setLLoading] = useState(false)

  // signup state
  const [sName, setSName] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sCode, setSCode] = useState('')
  const [sPass, setSPass] = useState('')
  const [sPass2, setSPass2] = useState('')
  const [sMsg, setSMsg] = useState(null)
  const [sLoading, setSLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLMsg(null)
    setLLoading(true)
    try {
      await login(lEmail, lPass)
    } catch (err) {
      setLMsg({ text: err.message, type: 'error' })
    } finally {
      setLLoading(false)
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setSMsg(null)
    if (!sName || !sEmail || !sPass || !sPass2 || (!isFirst && !sCode)) {
      setSMsg({ text: 'Please fill in all fields.', type: 'error' })
      return
    }
    setSLoading(true)
    try {
      setSMsg({ text: 'Creating account…', type: 'success' })
      await signup(sName, sEmail, sCode, sPass, sPass2)
    } catch (err) {
      setSMsg({ text: err.message, type: 'error' })
    } finally {
      setSLoading(false)
    }
  }

  return (
    <div className="auth-gate">
      <img src={logo} alt="logo" style={{ width: 48, filter: 'drop-shadow(0 0 12px rgba(79,216,255,.5))' }} />
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-d)', color: '#fff', fontSize: 22, marginBottom: 8 }}>
          Admin Dashboard
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-faint)' }}>
          {mode === 'login'
            ? 'Sign in with your admin credentials'
            : isFirst
              ? 'Create the first admin account'
              : 'Create an admin account'}
        </p>
      </div>

      {mode === 'login' ? (
        <form className="auth-box" onSubmit={handleLogin}>
          {lMsg && <div className={`msg show ${lMsg.type}`}>{lMsg.text}</div>}
          <div>
            <label className="field-label">Email</label>
            <input className="field-input" type="email" value={lEmail}
              onChange={e => setLEmail(e.target.value)} placeholder="admin@mindsmakers.io" required />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input className="field-input" type="password" value={lPass}
              onChange={e => setLPass(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={lLoading}>
            {lLoading ? 'Signing in…' : 'Sign In'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-faint)', marginTop: 4 }}>
            Don't have an account?{' '}
            <span className="auth-link" onClick={() => setMode('signup')}>Request access</span>
          </p>
        </form>
      ) : (
        <form className="auth-box" onSubmit={handleSignup}>
          {sMsg && <div className={`msg show ${sMsg.type}`}>{sMsg.text}</div>}
          <div>
            <label className="field-label">Full Name</label>
            <input className="field-input" value={sName}
              onChange={e => setSName(e.target.value)} placeholder="Your name" required />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="field-input" type="email" value={sEmail}
              onChange={e => setSEmail(e.target.value)} placeholder="you@mindsmakers.io" required />
          </div>

          {/* حقل الـ invite code — بيظهر بس لو مش أول أدمن */}
          {!isFirst && (
            <div>
              <label className="field-label">Invite Code</label>
              <input className="field-input" value={sCode}
                onChange={e => setSCode(e.target.value)}
                placeholder="XXXX-XXXX-XXXX" required />
            </div>
          )}

          <div>
            <label className="field-label">Password</label>
            <input className="field-input" type="password" value={sPass}
              onChange={e => setSPass(e.target.value)} placeholder="Min 8 characters" required />
          </div>
          <div>
            <label className="field-label">Confirm Password</label>
            <input className="field-input" type="password" value={sPass2}
              onChange={e => setSPass2(e.target.value)} placeholder="Repeat password" required />
          </div>

          {isFirst && (
            <p style={{ fontSize: 12, color: 'var(--acc)', background: 'rgba(79,216,255,.06)', border: '1px solid rgba(79,216,255,.2)', borderRadius: 'var(--r-sm)', padding: '8px 12px' }}>
              ✓ No invite code needed — you're creating the first admin account.
            </p>
          )}

          <button type="submit" className="btn btn-primary" disabled={sLoading}>
            {sLoading ? 'Creating account…' : 'Create Account'}
          </button>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-faint)', marginTop: 4 }}>
            Already have an account?{' '}
            <span className="auth-link" onClick={() => setMode('login')}>Sign in</span>
          </p>
        </form>
      )}
    </div>
  )
}
