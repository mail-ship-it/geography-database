import { NextResponse } from 'next/server'
import { getGoogleSheetsClient, SPREADSHEET_ID } from '../../../lib/googleSheets'

export type YearInfo = {
  year: string
  examType: string
  problemPdfUrl: string
  answerPdfUrl: string
  averageScore: string
  notes: string
}

export async function GET() {
  try {
    const sheets = getGoogleSheetsClient()
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: '年度別情報!A2:F100', // ヘッダー行を除く
    })

    const rows = response.data.values || []
    
    const yearInfoList: YearInfo[] = rows
      .filter(row => row[0]) // 年度が入力されている行のみ
      .map(row => ({
        year: row[0] || '',
        examType: row[1] || '',
        problemPdfUrl: row[2] || '',
        answerPdfUrl: row[3] || '',
        averageScore: row[4] || '',
        notes: row[5] || ''
      }))

    return NextResponse.json(yearInfoList)
  } catch (error) {
    console.error('年度情報取得エラー:', error)
    return NextResponse.json({ error: '年度情報の取得に失敗しました' }, { status: 500 })
  }
}