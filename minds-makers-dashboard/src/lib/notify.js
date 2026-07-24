// src/lib/notify.js
// استخدمه في الموقع والداشبورد
// هو بيستدعي الـ Edge Function في Supabase عشان يبعت الإيميل

const SUPABASE_URL = 'https://letdkskgdbuyrqdaxccx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxldGRrc2tnZGJ1eXJxZGF4Y2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzgwMjIsImV4cCI6MjA5OTM1NDAyMn0.IMPMBLrFoFkvJgXVZ15Iy8n7hWm67h-SZa0cceMnmTI'

export async function notify(type, data) {
  try {
    await fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ type, data }),
    })
  } catch (e) {
    // Notification failure shouldn't break the app
    console.warn('Notification failed:', e.message)
  }
}
