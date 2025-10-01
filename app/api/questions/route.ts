import { NextResponse } from 'next/server'
import { getGoogleSheetsClient, SPREADSHEET_ID, SHEET_NAME, Question } from '@/lib/googleSheets'

export async function GET() {
  try {
    // 環境変数の存在確認
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json({ 
        error: 'GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set'
      }, { status: 500 })
    }

    const sheets = getGoogleSheetsClient()
    
    // スプレッドシートからデータを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:K`, // A列からK列まで取得
    })

    const rows = response.data.values
    
    if (!rows || rows.length <= 1) {
      return NextResponse.json([])
    }

    // ヘッダー行をスキップして、データを変換
    const questions: Question[] = rows.slice(1).map((row, index) => ({
      id: (index + 1).toString(),
      questionId: row[0] || '',
      category: row[1] || '',
      answer: row[2] || '',
      correctRate: row[3] || '',
      imageUrl: row[4] || '',
      year: row[5] || '',
      notes: row[6] || '',
      createdDate: row[7] || '',
      imageFile: row[8] || ''
    }))

    return NextResponse.json(questions)
  } catch (error) {
    console.error('Google Sheets API error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch questions from Google Sheets',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 })
  }
}