import { NextResponse } from 'next/server'
import { findStudent, getPublishedCards, getStudentProgress } from '@/lib/flashcards'

// 公開カード一覧と、その生徒の進捗（ボックス・次回日）をまとめて返す
export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    const normalized = String(code || '').trim().toUpperCase()
    if (!(await findStudent(normalized))) {
      return NextResponse.json({ error: '生徒コードが正しくありません' }, { status: 401 })
    }
    const [cards, progress] = await Promise.all([getPublishedCards(), getStudentProgress(normalized)])
    return NextResponse.json(
      cards.map(card => {
        const p = progress.get(card.id)
        return { ...card, box: p?.box ?? 0, due: p?.due ?? '' }
      })
    )
  } catch (error) {
    console.error('Flashcard cards error:', error)
    return NextResponse.json({ error: 'カードの取得に失敗しました' }, { status: 500 })
  }
}
