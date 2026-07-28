import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://letdkskgdbuyrqdaxccx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxldGRrc2tnZGJ1eXJxZGF4Y2N4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM3NzgwMjIsImV4cCI6MjA5OTM1NDAyMn0.IMPMBLrFoFkvJgXVZ15Iy8n7hWm67h-SZa0cceMnmTI'

export const isSupabaseConfigured = true
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
