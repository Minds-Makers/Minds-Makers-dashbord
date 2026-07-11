import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { isSupabaseConfigured } from '../lib/supabaseClient'
import logo from '../assets/logo-64.png'

// ── Toast ──────────────────────────────────────
function useToast() {
  const [toast, setToast] = useState(null)
  const show = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3200)
  }
  return { toast, show }
}
function Toast({ toast }) {
  if (!toast) return null
  return <div className={`toast${toast.type === 'error' ? ' error' : ''}`}>{toast.msg}</div>
}

function ConfigBanner() {
  if (isSupabaseConfigured) return null
  return (
    <div style={{
      background: 'rgba(255,200,0,.06)', border: '1px solid rgba(255,200,0,.25)',
      borderRadius: 'var(--r-md)', padding: '14px 18px', marginBottom: 24, fontSize: 13.5, color: '#fcd34d'
    }}>
      ⚠️ Database not connected yet. Edits will only preview locally and won't be saved.
      Paste your Supabase URL and anon key in <code>src/lib/supabaseClient.js</code>.
    </div>
  )
}

// ── Save button with async state ────────────────
function SaveButton({ onClick, label = 'Save Changes' }) {
  const [saving, setSaving] = useState(false)
  return (
    <button className="btn btn-primary btn-sm" disabled={saving}
      onClick={async () => { setSaving(true); await onClick(); setSaving(false) }}>
      {saving ? 'Saving…' : label}
    </button>
  )
}

// ── Panels ─────────────────────────────────────

function SitePanel({ data, update, saveSection, show }) {
  const s = { ...data.site }
  const set = (k, v) => update({ ...data, site: { ...data.site, [k]: v } })
  const setLoc = (lang, v) => update({ ...data, site: { ...data.site, location: { ...data.site.location, [lang]: v } } })

  const doSave = async () => {
    const res = await saveSection('site', data.site)
    show(res.ok ? 'Site info saved!' : res.error, res.ok ? 'success' : 'error')
  }

  return (
    <div>
      <p className="dash-section-sub">Basic site info shown in the footer and metadata.</p>
      <div className="dash-card">
        <div className="dash-card-header"><span className="dash-card-title">Site Settings</span></div>
        {[
          { label: 'Site Name', key: 'name' },
          { label: 'Tagline', key: 'tagline' },
          { label: 'Email', key: 'email' },
          { label: 'LinkedIn URL', key: 'linkedin' },
        ].map(f => (
          <div className="dash-field" key={f.key}>
            <label className="dash-label">{f.label}</label>
            <input className="dash-input" value={s[f.key]} onChange={e => set(f.key, e.target.value)} />
          </div>
        ))}
        <div className="dash-field">
          <label className="dash-label">Description (EN)</label>
          <textarea className="dash-textarea" value={typeof s.description === 'object' ? s.description.en : s.description}
            onChange={e => set('description', { en: e.target.value, ar: typeof s.description === 'object' ? s.description.ar : '' })} />
        </div>
        <div className="dash-field">
          <label className="dash-label">Description (AR)</label>
          <textarea className="dash-textarea" dir="rtl"
            value={typeof s.description === 'object' ? s.description.ar : ''}
            onChange={e => set('description', { en: typeof s.description === 'object' ? s.description.en : s.description, ar: e.target.value })} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="dash-field">
            <label className="dash-label">Location (EN)</label>
            <input className="dash-input" value={s.location?.en || ''} onChange={e => setLoc('en', e.target.value)} />
          </div>
          <div className="dash-field">
            <label className="dash-label">Location (AR)</label>
            <input className="dash-input" dir="rtl" value={s.location?.ar || ''} onChange={e => setLoc('ar', e.target.value)} />
          </div>
        </div>
        <div className="dash-btn-row" style={{ marginTop: 8 }}>
          <SaveButton onClick={doSave} />
        </div>
      </div>
    </div>
  )
}

function ServicesPanel({ data, update, saveSection, show }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(null)
  const [lang, setLang] = useState('en')
  const services = data.services

  const persist = async (newServices) => {
    const res = await saveSection('services', newServices)
    return res
  }

  const startEdit = (svc) => { setEditing(svc.id); setForm(JSON.parse(JSON.stringify(svc))) }
  const startAdd = () => {
    setEditing('__new__')
    setForm({ id: 'svc_' + Date.now(), tag: { en: 'Service', ar: 'خدمة' }, name: { en: 'New Service', ar: 'خدمة جديدة' }, desc: { en: '', ar: '' }, features: [] })
  }

  const saveEdit = async () => {
    const newServices = editing === '__new__' ? [...services, form] : services.map(s => s.id === editing ? form : s)
    update({ ...data, services: newServices })
    const res = await persist(newServices)
    if (res.ok) { show('Service saved!'); setEditing(null); setForm(null) }
    else show(res.error, 'error')
  }

  const deleteService = async (id) => {
    if (!confirm('Delete this service? This goes live immediately.')) return
    const newServices = services.filter(s => s.id !== id)
    update({ ...data, services: newServices })
    const res = await persist(newServices)
    show(res.ok ? 'Service deleted.' : res.error, res.ok ? 'success' : 'error')
  }

  const setFLang = (key, lang, val) => setForm(f => ({ ...f, [key]: { ...(typeof f[key] === 'object' ? f[key] : { en: f[key], ar: '' }), [lang]: val } }))
  const addFeature = () => setForm(f => ({ ...f, features: [...f.features, { en: '', ar: '' }] }))
  const setFeature = (i, lang, val) => setForm(f => { const features = [...f.features]; features[i] = { ...features[i], [lang]: val }; return { ...f, features } })
  const removeFeature = (i) => setForm(f => ({ ...f, features: f.features.filter((_, j) => j !== i) }))

  if (editing && form) {
    return (
      <div>
        <div className="dash-card-header" style={{ marginBottom: 20 }}>
          <span className="dash-card-title">{editing === '__new__' ? 'Add Service' : 'Edit Service'}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); setForm(null) }}>← Back</button>
        </div>
        <div className="dash-tab-row">
          <button className={`dash-tab${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>English</button>
          <button className={`dash-tab${lang === 'ar' ? ' active' : ''}`} onClick={() => setLang('ar')}>العربية</button>
        </div>
        <div className="dash-card">
          <div className="dash-field">
            <label className="dash-label">Tag ({lang.toUpperCase()})</label>
            <input className="dash-input" value={form.tag?.[lang] || ''} onChange={e => setFLang('tag', lang, e.target.value)} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
          </div>
          <div className="dash-field">
            <label className="dash-label">Name ({lang.toUpperCase()})</label>
            <input className="dash-input" value={form.name?.[lang] || ''} onChange={e => setFLang('name', lang, e.target.value)} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
          </div>
          <div className="dash-field">
            <label className="dash-label">Description ({lang.toUpperCase()})</label>
            <textarea className="dash-textarea" value={form.desc?.[lang] || ''} onChange={e => setFLang('desc', lang, e.target.value)} dir={lang === 'ar' ? 'rtl' : 'ltr'} />
          </div>
          <div className="dash-field">
            <label className="dash-label">Features ({lang.toUpperCase()})</label>
            {form.features.map((f, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input className="dash-input" value={f[lang] || ''} dir={lang === 'ar' ? 'rtl' : 'ltr'} onChange={e => setFeature(i, lang, e.target.value)} placeholder={`Feature ${i + 1}`} />
                <button className="btn btn-ghost btn-sm" style={{ color: '#f87171', flexShrink: 0 }} onClick={() => removeFeature(i)}>✕</button>
              </div>
            ))}
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 4 }} onClick={addFeature}>+ Add Feature</button>
          </div>
        </div>
        <div className="dash-btn-row">
          <SaveButton onClick={saveEdit} label="Save Service" />
          <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); setForm(null) }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="dash-section-sub">Manage all services shown on the Services page and Home page. Changes go live immediately.</p>
      <div className="dash-card">
        <div className="dash-card-header">
          <span className="dash-card-title">All Services ({services.length})</span>
          <button className="btn btn-primary btn-sm" onClick={startAdd}>+ Add Service</button>
        </div>
        {services.map(svc => (
          <div className="dash-list-item" key={svc.id}>
            <div>
              <div className="dash-list-name">{svc.name?.en || svc.name}</div>
              <div className="dash-list-sub">{svc.features?.length || 0} features</div>
            </div>
            <div className="dash-list-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(svc)}>Edit</button>
              <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }} onClick={() => deleteService(svc.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamPanel({ data, update, saveSection, show }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(null)
  const team = data.about.team

  const persist = async (newTeam) => saveSection('about', { ...data.about, team: newTeam })

  const startEdit = (i) => { setEditing(i); setForm(JSON.parse(JSON.stringify(team[i]))) }
  const startAdd = () => { setEditing('__new__'); setForm({ name: '', role: { en: '', ar: '' } }) }

  const save = async () => {
    const newTeam = editing === '__new__' ? [...team, form] : team.map((m, i) => i === editing ? form : m)
    update({ ...data, about: { ...data.about, team: newTeam } })
    const res = await persist(newTeam)
    if (res.ok) { show('Team updated!'); setEditing(null); setForm(null) }
    else show(res.error, 'error')
  }

  const remove = async (i) => {
    if (!confirm('Remove this team member? This goes live immediately.')) return
    const newTeam = team.filter((_, j) => j !== i)
    update({ ...data, about: { ...data.about, team: newTeam } })
    const res = await persist(newTeam)
    show(res.ok ? 'Team member removed.' : res.error, res.ok ? 'success' : 'error')
  }

  if (editing !== null && form) {
    return (
      <div>
        <div className="dash-card-header" style={{ marginBottom: 20 }}>
          <span className="dash-card-title">{editing === '__new__' ? 'Add Member' : 'Edit Member'}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); setForm(null) }}>← Back</button>
        </div>
        <div className="dash-card">
          <div className="dash-field">
            <label className="dash-label">Full Name</label>
            <input className="dash-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="dash-field">
            <label className="dash-label">Role (EN)</label>
            <input className="dash-input" value={form.role?.en || ''} onChange={e => setForm(f => ({ ...f, role: { ...f.role, en: e.target.value } }))} />
          </div>
          <div className="dash-field">
            <label className="dash-label">Role (AR)</label>
            <input className="dash-input" dir="rtl" value={form.role?.ar || ''} onChange={e => setForm(f => ({ ...f, role: { ...f.role, ar: e.target.value } }))} />
          </div>
        </div>
        <div className="dash-btn-row">
          <SaveButton onClick={save} label="Save Member" />
          <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); setForm(null) }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="dash-section-sub">Manage team members shown on the About page. Changes go live immediately.</p>
      <div className="dash-card">
        <div className="dash-card-header">
          <span className="dash-card-title">Team Members ({team.length})</span>
          <button className="btn btn-primary btn-sm" onClick={startAdd}>+ Add Member</button>
        </div>
        {team.map((m, i) => (
          <div className="dash-list-item" key={i}>
            <div>
              <div className="dash-list-name">{m.name}</div>
              <div className="dash-list-sub">{m.role?.en || m.role}</div>
            </div>
            <div className="dash-list-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(i)}>Edit</button>
              <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }} onClick={() => remove(i)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function WorkPanel({ data, update, saveSection, show }) {
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(null)
  const [tag, setTag] = useState('')
  const projects = data.work.projects

  const persist = async (newProj) => saveSection('work', { ...data.work, projects: newProj })

  const startEdit = (i) => { setEditing(i); setForm(JSON.parse(JSON.stringify(projects[i]))) }
  const startAdd = () => { setEditing('__new__'); setForm({ id: 'proj_' + Date.now(), label: 'PROJECT', title: { en: '', ar: '' }, desc: { en: '', ar: '' }, tags: [] }) }

  const save = async () => {
    const newProj = editing === '__new__' ? [...projects, form] : projects.map((p, i) => i === editing ? form : p)
    update({ ...data, work: { ...data.work, projects: newProj } })
    const res = await persist(newProj)
    if (res.ok) { show('Project saved!'); setEditing(null); setForm(null) }
    else show(res.error, 'error')
  }

  const remove = async (i) => {
    if (!confirm('Delete this project? This goes live immediately.')) return
    const newProj = projects.filter((_, j) => j !== i)
    update({ ...data, work: { ...data.work, projects: newProj } })
    const res = await persist(newProj)
    show(res.ok ? 'Project deleted.' : res.error, res.ok ? 'success' : 'error')
  }

  const addTag = () => { if (!tag.trim()) return; setForm(f => ({ ...f, tags: [...f.tags, tag.trim()] })); setTag('') }
  const removeTag = (i) => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))

  if (editing !== null && form) {
    return (
      <div>
        <div className="dash-card-header" style={{ marginBottom: 20 }}>
          <span className="dash-card-title">{editing === '__new__' ? 'Add Project' : 'Edit Project'}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); setForm(null) }}>← Back</button>
        </div>
        <div className="dash-card">
          <div className="dash-field">
            <label className="dash-label">Label (e.g. PROJECT ALPHA)</label>
            <input className="dash-input" value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
          </div>
          <div className="dash-field">
            <label className="dash-label">Title (EN)</label>
            <input className="dash-input" value={form.title?.en || ''} onChange={e => setForm(f => ({ ...f, title: { ...f.title, en: e.target.value } }))} />
          </div>
          <div className="dash-field">
            <label className="dash-label">Title (AR)</label>
            <input className="dash-input" dir="rtl" value={form.title?.ar || ''} onChange={e => setForm(f => ({ ...f, title: { ...f.title, ar: e.target.value } }))} />
          </div>
          <div className="dash-field">
            <label className="dash-label">Description (EN)</label>
            <textarea className="dash-textarea" value={form.desc?.en || ''} onChange={e => setForm(f => ({ ...f, desc: { ...f.desc, en: e.target.value } }))} />
          </div>
          <div className="dash-field">
            <label className="dash-label">Description (AR)</label>
            <textarea className="dash-textarea" dir="rtl" value={form.desc?.ar || ''} onChange={e => setForm(f => ({ ...f, desc: { ...f.desc, ar: e.target.value } }))} />
          </div>
          <div className="dash-field">
            <label className="dash-label">Tags</label>
            <div className="dash-tag-row">
              {form.tags.map((t, i) => <span className="dash-tag" key={i}>{t} <button onClick={() => removeTag(i)}>×</button></span>)}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input className="dash-input" value={tag} onChange={e => setTag(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} placeholder="Add tag & press Enter" style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-sm" onClick={addTag}>Add</button>
            </div>
          </div>
        </div>
        <div className="dash-btn-row">
          <SaveButton onClick={save} label="Save Project" />
          <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(null); setForm(null) }}>Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <p className="dash-section-sub">Manage projects and case studies shown on the Work page. Changes go live immediately.</p>
      <div className="dash-card">
        <div className="dash-card-header">
          <span className="dash-card-title">Projects ({projects.length})</span>
          <button className="btn btn-primary btn-sm" onClick={startAdd}>+ Add Project</button>
        </div>
        {projects.map((p, i) => (
          <div className="dash-list-item" key={p.id}>
            <div>
              <div className="dash-list-name">{p.title?.en || p.title}</div>
              <div className="dash-list-sub">{p.label} · {p.tags?.join(', ')}</div>
            </div>
            <div className="dash-list-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(i)}>Edit</button>
              <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }} onClick={() => remove(i)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AboutPanel({ data, update, saveSection, show }) {
  const a = data.about
  const [lang, setLang] = useState('en')

  const setAbout = (key, val) => update({ ...data, about: { ...a, [key]: val } })
  const setPrinciple = (i, field, lang, val) => {
    const principles = JSON.parse(JSON.stringify(a.principles))
    if (field === 'mark') principles[i].mark = val
    else principles[i][field][lang] = val
    update({ ...data, about: { ...a, principles } })
  }

  const doSave = async () => {
    const res = await saveSection('about', data.about)
    show(res.ok ? 'About page saved!' : res.error, res.ok ? 'success' : 'error')
  }

  return (
    <div>
      <p className="dash-section-sub">Edit the About page content — vision, mission, and principles.</p>
      <div className="dash-tab-row">
        <button className={`dash-tab${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>English</button>
        <button className={`dash-tab${lang === 'ar' ? ' active' : ''}`} onClick={() => setLang('ar')}>العربية</button>
      </div>

      <div className="dash-card">
        <div className="dash-card-header"><span className="dash-card-title">Hero</span></div>
        <div className="dash-field">
          <label className="dash-label">Eyebrow</label>
          <input className="dash-input" value={a.hero.eyebrow?.[lang] || ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}
            onChange={e => setAbout('hero', { ...a.hero, eyebrow: { ...a.hero.eyebrow, [lang]: e.target.value } })} />
        </div>
        <div className="dash-field">
          <label className="dash-label">Quote</label>
          <textarea className="dash-textarea" value={a.hero.quote?.[lang] || ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}
            onChange={e => setAbout('hero', { ...a.hero, quote: { ...a.hero.quote, [lang]: e.target.value } })} />
        </div>
      </div>

      <div className="dash-card">
        <div className="dash-card-header"><span className="dash-card-title">Vision & Mission</span></div>
        {['vision', 'mission'].map(section => (
          <div key={section} style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-faint)', marginBottom: 8 }}>{section}</div>
            <div className="dash-field">
              <label className="dash-label">Title</label>
              <input className="dash-input" value={a[section].title?.[lang] || ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}
                onChange={e => setAbout(section, { ...a[section], title: { ...a[section].title, [lang]: e.target.value } })} />
            </div>
            <div className="dash-field">
              <label className="dash-label">Description</label>
              <textarea className="dash-textarea" value={a[section].desc?.[lang] || ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}
                onChange={e => setAbout(section, { ...a[section], desc: { ...a[section].desc, [lang]: e.target.value } })} />
            </div>
          </div>
        ))}
      </div>

      <div className="dash-card">
        <div className="dash-card-header"><span className="dash-card-title">Principles</span></div>
        {a.principles.map((p, i) => (
          <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--line)' }}>
            <div className="dash-field">
              <label className="dash-label">Mark (badge text)</label>
              <input className="dash-input" value={p.mark} onChange={e => setPrinciple(i, 'mark', null, e.target.value)} />
            </div>
            <div className="dash-field">
              <label className="dash-label">Title</label>
              <input className="dash-input" value={p.title?.[lang] || ''} dir={lang === 'ar' ? 'rtl' : 'ltr'} onChange={e => setPrinciple(i, 'title', lang, e.target.value)} />
            </div>
            <div className="dash-field">
              <label className="dash-label">Description</label>
              <textarea className="dash-textarea" value={p.desc?.[lang] || ''} dir={lang === 'ar' ? 'rtl' : 'ltr'} onChange={e => setPrinciple(i, 'desc', lang, e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      <div className="dash-btn-row" style={{ marginBottom: 24 }}>
        <SaveButton onClick={doSave} label="Save About Page" />
      </div>
    </div>
  )
}

function HomePanel({ data, update, saveSection, show }) {
  const h = data.home
  const [lang, setLang] = useState('en')
  const setHome = (key, val) => update({ ...data, home: { ...h, [key]: val } })
  const setStep = (i, field, val) => {
    const steps = JSON.parse(JSON.stringify(h.process.steps))
    if (field === 'num') steps[i].num = val
    else steps[i][field][lang] = val
    setHome('process', { ...h.process, steps })
  }

  const doSave = async () => {
    const res = await saveSection('home', data.home)
    show(res.ok ? 'Home page saved!' : res.error, res.ok ? 'success' : 'error')
  }

  return (
    <div>
      <p className="dash-section-sub">Edit the Home page hero, process steps, and CTA.</p>
      <div className="dash-tab-row">
        <button className={`dash-tab${lang === 'en' ? ' active' : ''}`} onClick={() => setLang('en')}>English</button>
        <button className={`dash-tab${lang === 'ar' ? ' active' : ''}`} onClick={() => setLang('ar')}>العربية</button>
      </div>

      <div className="dash-card">
        <div className="dash-card-header"><span className="dash-card-title">Hero Section</span></div>
        {[{ label: 'Eyebrow text', path: 'eyebrow' }, { label: 'Title', path: 'title' }, { label: 'Lead paragraph', path: 'lead' }].map(f => (
          <div className="dash-field" key={f.path}>
            <label className="dash-label">{f.label}</label>
            <textarea className="dash-textarea" value={h.hero[f.path]?.[lang] || ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}
              onChange={e => setHome('hero', { ...h.hero, [f.path]: { ...h.hero[f.path], [lang]: e.target.value } })} />
          </div>
        ))}
      </div>

      <div className="dash-card">
        <div className="dash-card-header"><span className="dash-card-title">Process Steps</span></div>
        {h.process.steps.map((step, i) => (
          <div key={i} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--line)' }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--acc)', marginBottom: 8 }}>Step {step.num}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 12, marginBottom: 8 }}>
              <div className="dash-field">
                <label className="dash-label">Number</label>
                <input className="dash-input" value={step.num} onChange={e => setStep(i, 'num', e.target.value)} />
              </div>
              <div className="dash-field">
                <label className="dash-label">Title</label>
                <input className="dash-input" value={step.title?.[lang] || ''} dir={lang === 'ar' ? 'rtl' : 'ltr'} onChange={e => setStep(i, 'title', e.target.value)} />
              </div>
            </div>
            <div className="dash-field">
              <label className="dash-label">Description</label>
              <textarea className="dash-textarea" value={step.desc?.[lang] || ''} dir={lang === 'ar' ? 'rtl' : 'ltr'} onChange={e => setStep(i, 'desc', e.target.value)} />
            </div>
          </div>
        ))}
      </div>

      <div className="dash-card">
        <div className="dash-card-header"><span className="dash-card-title">CTA Band</span></div>
        <div className="dash-field">
          <label className="dash-label">Title</label>
          <textarea className="dash-textarea" value={h.cta.title?.[lang] || ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}
            onChange={e => setHome('cta', { ...h.cta, title: { ...h.cta.title, [lang]: e.target.value } })} />
        </div>
        <div className="dash-field">
          <label className="dash-label">Button Text</label>
          <input className="dash-input" value={h.cta.btn?.[lang] || ''} dir={lang === 'ar' ? 'rtl' : 'ltr'}
            onChange={e => setHome('cta', { ...h.cta, btn: { ...h.cta.btn, [lang]: e.target.value } })} />
        </div>
      </div>

      <div className="dash-btn-row" style={{ marginBottom: 24 }}>
        <SaveButton onClick={doSave} label="Save Home Page" />
      </div>
    </div>
  )
}

function AdminsPanel({ show }) {
  const { user, getAdmins, removeAdmin } = useAuth()
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = async () => {
    setLoading(true)
    setAdmins(await getAdmins())
    setLoading(false)
  }
  useEffect(() => { reload() }, [])

  const remove = async (email) => {
    try {
      await removeAdmin(email)
      show('Admin removed.')
      reload()
    } catch (e) { show(e.message, 'error') }
  }

  return (
    <div>
      <p className="dash-section-sub">
        Admin accounts with dashboard access. To add a new admin, share the invite code{' '}
        <strong style={{ color: 'var(--acc)' }}>MM-ADMIN-2024</strong> and have them sign up at this same dashboard URL.
      </p>
      <div className="dash-card">
        <div className="dash-card-header"><span className="dash-card-title">Admin Accounts {!loading && `(${admins.length})`}</span></div>
        {loading && <p className="tbl-empty">Loading…</p>}
        {!loading && admins.map(a => (
          <div className="dash-list-item" key={a.email}>
            <div>
              <div className="dash-list-name">{a.name} {a.email === user?.email && <span style={{ fontSize: 11, color: 'var(--acc)', marginLeft: 6 }}>(you)</span>}</div>
              <div className="dash-list-sub">{a.email} · {new Date(a.created_at).toLocaleDateString()}</div>
            </div>
            {a.email !== user?.email && (
              <button className="btn btn-ghost btn-sm" style={{ color: '#f87171' }} onClick={() => remove(a.email)}>Remove</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────
const PANELS = [
  { id: 'home', label: 'Home Content', icon: '🏠' },
  { id: 'services', label: 'Services', icon: '⚙️' },
  { id: 'about', label: 'About Page', icon: 'ℹ️' },
  { id: 'team', label: 'Team Members', icon: '👥' },
  { id: 'work', label: 'Work / Projects', icon: '💼' },
  { id: 'site', label: 'Site Settings', icon: '🌐' },
  { id: 'admins', label: 'Admin Accounts', icon: '🔑' },
]

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { data, update, saveSection, loading } = useData()
  const [active, setActive] = useState('home')
  const { toast, show } = useToast()

  if (loading) {
    return (
      <div className="dash-layout" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-faint)' }}>Loading site data…</p>
      </div>
    )
  }

  const panelProps = { data, update, saveSection, show }

  return (
    <div className="dash-layout">
      <aside className="dash-sidebar">
        <div className="dash-sidebar-top">
          <img src={logo} alt="logo" />
          <span className="dash-sidebar-title">Dashboard</span>
        </div>
        <nav className="dash-nav">
          {PANELS.map(p => (
            <button key={p.id} className={`dash-nav-item${active === p.id ? ' active' : ''}`} onClick={() => setActive(p.id)}>
              <span>{p.icon}</span> {p.label}
            </button>
          ))}
        </nav>
        <button className="signout-btn" onClick={logout}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
          Sign out
        </button>
      </aside>

      <div className="dash-main">
        <div className="dash-topbar">
          <span className="dash-topbar-title">{PANELS.find(p => p.id === active)?.label}</span>
          <div className="dash-user">
            <div className="dash-avatar">{(user?.name || user?.email || 'A')[0].toUpperCase()}</div>
            <span className="dash-username">{user?.name || user?.email}</span>
          </div>
        </div>

        <div className="dash-content">
          <ConfigBanner />
          <div className="dash-section-title">{PANELS.find(p => p.id === active)?.label}</div>
          {active === 'home' && <HomePanel {...panelProps} />}
          {active === 'services' && <ServicesPanel {...panelProps} />}
          {active === 'about' && <AboutPanel {...panelProps} />}
          {active === 'team' && <TeamPanel {...panelProps} />}
          {active === 'work' && <WorkPanel {...panelProps} />}
          {active === 'site' && <SitePanel {...panelProps} />}
          {active === 'admins' && <AdminsPanel show={show} />}
        </div>
      </div>

      <Toast toast={toast} />
    </div>
  )
}
