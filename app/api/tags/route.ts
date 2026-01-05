import { NextResponse } from 'next/server'
import { getSnapshot } from '../snapshot/route'

// /api/snapshot からタグデータを取得
export async function GET() {
  try {
    const snapshot = await getSnapshot()
    return NextResponse.json(snapshot.tags)
  } catch (error) {
    console.error('Tags API error:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}
