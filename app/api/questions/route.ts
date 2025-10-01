import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Supabaseからデータを取得
    const { data: questions, error } = await supabase
      .from('questions')
      .select('*')
      .order('year', { ascending: false })
      .order('question_id', { ascending: true })

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    // フロントエンド用の形式に変換
    const formattedQuestions = questions.map(q => ({
      id: q.id.toString(),
      questionId: q.question_id,
      category: q.category,
      answer: q.answer,
      correctRate: q.correct_rate,
      imageUrl: q.image_url,
      year: q.year.toString(),
      notes: q.notes || '',
      createdDate: q.created_date || '',
      imageFile: '' // 互換性のため
    }))

    return NextResponse.json(formattedQuestions)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}