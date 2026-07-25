// api/notify.js — Vercel Serverless Function
// ارفع الفولدر ده في ROOT الـ website repo

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { type, data } = req.body
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const ADMIN_EMAIL = 'minds0makers@gmail.com'

  const { subject, html } = buildEmail(type, data)
  if (!subject) return res.status(400).json({ error: 'Unknown type' })

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Minds Makers <onboarding@resend.dev>',
        to: ADMIN_EMAIL,
        subject,
        html,
      }),
    })
    const result = await response.json()
    return res.status(200).json({ ok: true, result })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}

function buildEmail(type, data) {
  const time = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }) + ' (Cairo)'
  const row = (l, v) => `<tr><td style="padding:10px 16px;background:#f0f9ff;color:#0e7490;font-size:12px;text-transform:uppercase;width:130px;font-weight:600;">${l}</td><td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;">${v}</td></tr>`
  const table = (rows) => `<table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;">${rows.map(([l,v]) => row(l,v)).join('')}</table>`
  const wrap = (title, content) => `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;"><h2 style="color:#0e7490;margin:0 0 20px;">${title}</h2>${content}</div>`

  if (type === 'new_request') return {
    subject: `📥 New Service Request — ${data.name}`,
    html: wrap('📥 New Service Request',
      table([['Name',data.name],['Email',data.email],['Phone',data.phone||'—'],['Company',data.company||'—'],['Job Title',data.job_title||'—'],['Service',data.service_type],['Budget',data.budget||'—']]) +
      `<div style="margin-top:16px;padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;"><div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:8px;">DESCRIPTION</div><div style="font-size:14px;line-height:1.7;">${data.description}</div></div>
      <a href="mailto:${data.email}?subject=Re: Your request for ${data.service_type}" style="display:inline-block;margin-top:20px;background:#0e7490;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">✉ Reply to ${data.name}</a>`
    )
  }

  if (type === 'new_message') return {
    subject: `💬 New Message — ${data.name}`,
    html: wrap('💬 New Message',
      table([['Name',data.name],['Email',data.email]]) +
      `<div style="margin-top:16px;padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;font-size:14px;line-height:1.7;">${data.message}</div>
      <a href="mailto:${data.email}" style="display:inline-block;margin-top:20px;background:#0e7490;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">✉ Reply</a>`
    )
  }

  if (type === 'admin_login') return {
    subject: `🔐 Admin Login — ${data.name}`,
    html: wrap('🔐 Admin Login', table([['Name',data.name],['Email',data.email],['Time',time]]))
  }

  if (type === 'admin_signup') return {
    subject: `👤 New Admin — ${data.name}`,
    html: wrap('👤 New Admin Account', table([['Name',data.name],['Email',data.email],['Time',time]]))
  }

  if (type === 'content_edit') return {
    subject: `✏️ Content Updated — ${data.section}`,
    html: wrap('✏️ Site Content Updated', table([['Section',data.section],['Edited by',data.editor],['Time',time]]))
  }

  return { subject: '', html: '' }
}
