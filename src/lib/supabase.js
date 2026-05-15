import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? 'https://yitkqjlytlyyflrsnfwc.supabase.co'
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlpdGtxamx5dGx5eWZscnNuZndjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg4MjM3NzMsImV4cCI6MjA5NDM5OTc3M30.z0slcuzoxHp94vECGENMYfqhv543ho0jswgjD9gvRjg'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
