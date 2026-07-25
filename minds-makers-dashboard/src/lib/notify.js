// src/notify.js — EmailJS version (بيشتغل من المتصفح مباشرة، من غير backend)
// حط الملف ده مكان api/notify.js، وامسح الاستيراد بتاع fetch('/api/notify') من أي مكان
// واستبدله بـ: import { notify } from './notify'; ثم notify(type, data)

import emailjs from '@emailjs/browser'

const EMAILJS_SERVICE_ID = 'service_4ncwnf6'
const EMAILJS_TEMPLATE_ID = 'template_gcjbsbd'
const EMAILJS_PUBLIC_KEY = 'jE7TfaOlcCaEXHFnw'

export async function notify(type, data) {
  const { subject, html } = buildEmail(type, data)
  if (!subject) return { ok: false, error: 'Unknown type' }

  try {
    const result = await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        subject,
        message: html,
      },
      EMAILJS_PUBLIC_KEY
    )
    return { ok: true, result }
  } catch (err) {
    console.error('EmailJS error:', err)
    return { ok: false, error: err.message || String(err) }
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
