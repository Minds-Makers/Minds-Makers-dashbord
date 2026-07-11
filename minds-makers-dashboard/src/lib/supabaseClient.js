import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wwnhhnwzcdeglqkldgnv.supabase.co'
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3bmhobnd6Y2RlZ2xxa2xkZ252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNDE5MDUsImV4cCI6MjA2MTYxNzkwNX0.VAvUfdcRoLYNLiNJx_4wj1CDgDmvm8leRS0JjSXdi4c'

export const isSupabaseConfigured = true
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
