import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo-64.png'

export default function Login() {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState('login')

  // login state
  const [lEmail, setLEmail] = useState('')
  const [lPass, setLPass] = useState('')
  const [lMsg, setLMsg] = useState(null)

  // signup state
  const [sName, setSName] = useState('')
  const [sEmail, setSEmail] = useState('')
  const [sCode, setSCode] = useState('')
  const [sPass, setSPass] = useState('')
  const [sPass2, setSPass2] = useState('')
  const [sMsg, setSMsg] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLMsg(null)
    try {
      await login(lEmail, lPass)
    } catch (err) {
      setLMsg({ text: err.message, type: 'error' })
    }
  }

  const handleSignup = async (e) => {
    e.preventDefault()
    setSMsg(null)
    if (!sName || !sEmail || !sCode || !sPass || !sPass2) {
      setSMsg({ text: 'Please fill in all fields.', type: 'error' })
      return
    }
    try {
      setSMsg({ text: 'Creating account…', type: 'success' })
      await signup(sName, sEmail, sCode, sPass, sPass2)
    } catch (err) {
      setSMsg({ text: err.message, type: 'error' })
    }
  }

  return (
    <div className="auth-gate">
      <img src={logo} alt="logo" style={{ width: 48, filter: 'drop-shadow(0 0 12px rgba(79,216,255,.5))' }} />
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-d)', color: '#fff', fontSize: 22, marginBottom: 8 }}>Admin Dashboard</h2>
        <p style={{ fontSize: 14, color: 'var(--text-faint)' }}>
          {mode === 'login' ? 'Sign in with your admin credentials' : 'Create an admin account'}
        </p>
      </div>

      {mode === 'login' ? (
        <form className="auth-box" onSubmit={handleLogin}>
          {lMsg && <div className={`msg show ${lMsg.type}`}>{lMsg.text}</div>}
          <div>
            <label className="field-label">Email</label>
            <input className="field-input" type="email" value={lEmail} onChange={e => setLEmail(e.target.value)} placeholder="admin@mindsmakers.io" required />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input className="field-input" type="password" value={lPass} onChange={e => setLPass(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary">Sign In</button>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-faint)', marginTop: 4 }}>
            Don't have an account? <span className="auth-link" onClick={() => setMode('signup')}>Request access</span>
          </p>
        </form>
      ) : (
        <form className="auth-box" onSubmit={handleSignup}>
          {sMsg && <div className={`msg show ${sMsg.type}`}>{sMsg.text}</div>}
          <div>
            <label className="field-label">Full Name</label>
            <input className="field-input" value={sName} onChange={e => setSName(e.target.value)} placeholder="Your name" required />
          </div>
          <div>
            <label className="field-label">Email</label>
            <input className="field-input" type="email" value={sEmail} onChange={e => setSEmail(e.target.value)} placeholder="you@mindsmakers.io" required />
          </div>
          <div>
            <label className="field-label">Invite Code</label>
            <input className="field-input" value={sCode} onChange={e => setSCode(e.target.value)} placeholder="Enter invite code" required />
          </div>
          <div>
            <label className="field-label">Password</label>
            <input className="field-input" type="password" value={sPass} onChange={e => setSPass(e.target.value)} placeholder="Min 8 characters" required />
          </div>
          <div>
            <label className="field-label">Confirm Password</label>
            <input className="field-input" type="password" value={sPass2} onChange={e => setSPass2(e.target.value)} placeholder="Repeat password" required />
          </div>
          <button type="submit" className="btn btn-primary">Create Account</button>
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-faint)', marginTop: 4 }}>
            Already have an account? <span className="auth-link" onClick={() => setMode('login')}>Sign in</span>
          </p>
        </form>
      )}
    </div>
  )
}
