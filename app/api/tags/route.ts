import { NextResponse } from 'next/server'
import { getGoogleSheetsClient, SPREADSHEET_ID } from '@/lib/googleSheets'

export async function GET() {
  try {
    const sheets = getGoogleSheetsClient()

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: '参考_分野一覧!A2:A100',
    })

    const rows = response.data.values || []
    const tags = rows.map(row => row[0]).filter(Boolean)

    return NextResponse.json(tags)
  } catch (error) {
    console.error('Tags API error:', error)
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 })
  }
}
