import { NextResponse } from 'next/server'
import { getSnapshot } from '../snapshot/route'

export type YearInfo = {
  year: string
  examType: string
  problemPdfUrl: string
  answerPdfUrl: string
  explanationPdfUrl: string
  averageScore: string
  notes: string
}

// /api/snapshot から年度情報を取得
export async function GET() {
  try {
    const snapshot = await getSnapshot()
    return NextResponse.json(snapshot.yearInfo)
  } catch (error) {
    console.error('年度情報取得エラー:', error)
    return NextResponse.json({ error: '年度情報の取得に失敗しました' }, { status: 500 })
  }
}
