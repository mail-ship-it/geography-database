import { NextResponse } from 'next/server'
import { getSnapshot } from '../snapshot/route'

// /api/snapshot から問題データを取得
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || '2024'
    const examType = searchParams.get('examType') || 'honshiken'

    // スナップショットから取得
    const snapshot = await getSnapshot()
    const key = `${year}_${examType}`
    const questions = snapshot.questionsByYearExam[key] || []

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Questions API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch questions',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
