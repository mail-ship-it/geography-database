import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// データベースの型定義
export type Question = {
  id: number
  question_id: string
  category: string
  answer: string
  correct_rate: string
  image_url: string
  year: number
  created_date: string
  notes: string
}