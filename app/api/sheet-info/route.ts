import { NextResponse } from 'next/server'
import { getSnapshot } from '../snapshot/route'

// /api/snapshot から年度試験リストを取得
export async function GET() {
  try {
    const snapshot = await getSnapshot()
    return NextResponse.json({ yearExams: snapshot.yearExams })
  } catch (error) {
    console.error('Sheet info API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch sheet info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
