import { NextResponse } from 'next/server'
import { findStudent } from '@/lib/flashcards'

export async function POST(request: Request) {
  try {
    const { code } = await request.json()
    const name = await findStudent(String(code || ''))
    if (!name) {
      return NextResponse.json({ error: '生徒コードが正しくありません' }, { status: 401 })
    }
    return NextResponse.json({ code: String(code).trim().toUpperCase(), name })
  } catch (error) {
    console.error('Flashcard login error:', error)
    return NextResponse.json({ error: 'ログインに失敗しました' }, { status: 500 })
  }
}
