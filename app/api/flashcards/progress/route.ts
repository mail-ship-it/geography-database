import { NextResponse } from 'next/server'
import { findStudent, saveResults } from '@/lib/flashcards'

export async function POST(request: Request) {
  try {
    const { code, results } = await request.json()
    const normalized = String(code || '').trim().toUpperCase()
    if (!(await findStudent(normalized))) {
      return NextResponse.json({ error: '生徒コードが正しくありません' }, { status: 401 })
    }
    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: 'results が空です' }, { status: 400 })
    }
    await saveResults(
      normalized,
      results.map((r: { cardId: unknown; correct: unknown }) => ({ cardId: String(r.cardId), correct: r.correct === true }))
    )
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Flashcard progress error:', error)
    return NextResponse.json({ error: '学習記録の保存に失敗しました' }, { status: 500 })
  }
}
