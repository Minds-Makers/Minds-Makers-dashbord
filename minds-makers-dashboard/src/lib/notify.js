// src/lib/notify.js
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY
const ADMIN_EMAIL = 'minds0makers@gmail.com'

export async function notify(type, data) {
  if (!RESEND_API_KEY) return
  try {
    const { subject, html } = buildEmail(type, data)
    if (!subject) return
    await fetch('https://api.resend.com/emails', {
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
  } catch (e) {
    console.warn('Notification failed:', e.message)
  }
}

function buildEmail(type, data) {
  const time = new Date().toLocaleString('en-GB', { timeZone: 'Africa/Cairo' }) + ' (Cairo)'

  if (type === 'new_request') return {
    subject: `📥 New Service Request — ${data.name}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
      <h2 style="color:#0e7490;">📥 New Service Request</h2>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;">
        ${[['Name',data.name],['Email',data.email],['Phone',data.phone||'—'],['Company',data.company||'—'],['Job Title',data.job_title||'—'],['Service',data.service_type],['Budget',data.budget||'—']]
          .map(([l,v])=>`<tr><td style="padding:10px 16px;background:#f0f9ff;color:#0e7490;font-size:12px;text-transform:uppercase;width:130px;font-weight:600;">${l}</td><td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;">${v}</td></tr>`).join('')}
      </table>
      <div style="margin-top:16px;padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
        <div style="font-size:12px;color:#6b7280;font-weight:600;margin-bottom:8px;">DESCRIPTION</div>
        <div style="font-size:14px;line-height:1.7;color:#374151;">${data.description}</div>
      </div>
      <a href="mailto:${data.email}?subject=Re: Your request for ${data.service_type}"
        style="display:inline-block;margin-top:20px;background:#0e7490;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">
        ✉ Reply to ${data.name}
      </a>
    </div>`
  }

  if (type === 'new_message') return {
    subject: `💬 New Message — ${data.name}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
      <h2 style="color:#0e7490;">💬 New Message</h2>
      <table style="width:100%;border-collapse:collapse;background:#fff;border-radius:8px;">
        ${[['Name',data.name],['Email',data.email]].map(([l,v])=>`<tr><td style="padding:10px 16px;background:#f0f9ff;color:#0e7490;font-size:12px;text-transform:uppercase;width:130px;font-weight:600;">${l}</td><td style="padding:10px 16px;border-bottom:1px solid #e5e7eb;font-size:14px;">${v}</td></tr>`).join('')}
      </table>
      <div style="margin-top:16px;padding:16px;background:#fff;border-radius:8px;border:1px solid #e5e7eb;">
        <div style="font-size:14px;line-height:1.7;color:#374151;">${data.message}</div>
      </div>
      <a href="mailto:${data.email}" style="display:inline-block;margin-top:20px;background:#0e7490;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:700;">✉ Reply</a>
    </div>`
  }

  if (type === 'admin_login') return {
    subject: `🔐 Admin Login — ${data.name}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
      <h2 style="color:#0e7490;">🔐 Admin Login</h2>
      ${[['Name',data.name],['Email',data.email],['Time',time]].map(([l,v])=>`<p><strong>${l}:</strong> ${v}</p>`).join('')}
    </div>`
  }

  if (type === 'admin_signup') return {
    subject: `👤 New Admin — ${data.name}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
      <h2 style="color:#0e7490;">👤 New Admin Account</h2>
      ${[['Name',data.name],['Email',data.email],['Time',time]].map(([l,v])=>`<p><strong>${l}:</strong> ${v}</p>`).join('')}
    </div>`
  }

  if (type === 'content_edit') return {
    subject: `✏️ Content Updated — ${data.section}`,
    html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#f9f9f9;border-radius:12px;">
      <h2 style="color:#0e7490;">✏️ Site Content Updated</h2>
      ${[['Section',data.section],['Edited by',data.editor],['Time',time]].map(([l,v])=>`<p><strong>${l}:</strong> ${v}</p>`).join('')}
    </div>`
  }

  return { subject: '', html: '' }
}
