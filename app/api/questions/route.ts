import { NextResponse } from 'next/server'
import { getGoogleSheetsClient, SPREADSHEET_ID, SHEET_NAME, Question } from '@/lib/googleSheets'

// Google Drive URL を直接表示可能なURLに変換
function convertDriveUrlToDirectLink(driveUrl: string): string {
  if (!driveUrl) return ''
  
  // Google Drive sharing URL from: https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
  // Convert to: https://drive.google.com/uc?export=view&id=FILE_ID
  const match = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`
  }
  return driveUrl
}

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
      questionId: row[1] || '', // B列: 問題ID（2024_geo_1_1など）
      category: row[2] || '', // C列: カテゴリ（地形,農業など）
      answer: row[3] || '', // D列: 答え
      correctRate: row[4] || '', // E列: 正答率
      imageUrl: convertDriveUrlToDirectLink(row[9] || ''), // J列: Google Drive URL → 直接表示可能URL
      year: '2024', // 固定値
      notes: row[7] || '', // H列: ノート
      createdDate: row[8] || '', // I列: 作成日
      imageFile: row[9] || '' // J列: 元のGoogle Drive URL
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