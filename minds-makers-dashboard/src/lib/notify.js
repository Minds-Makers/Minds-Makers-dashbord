// src/lib/notify.js
// بيكلم الـ Vercel serverless function بدل Resend مباشرة

export async function notify(type, data) {
  try {
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data }),
    })
  } catch (e) {
    console.warn('Notification failed:', e.message)
  }
}
