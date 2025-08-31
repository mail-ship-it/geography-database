import { NextResponse } from 'next/server'
import { google } from 'googleapis'

// 環境変数から認証情報を取得
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!

// 開発環境用のモックデータ（認証設定前でも動作確認可能）
const mockData = [
  {
    id: '1',
    questionId: '2024_geo_1_1',
    category: '地形',
    answer: '3',
    correctRate: '',
    imageUrl: 'https://drive.google.com/file/d/sample',
    year: '2024'
  },
  // 実際のデータはGoogle Sheetsから取得
]

export async function GET() {
  try {
    // 開発中は一旦モックデータを返す
    // TODO: Google Service Account認証を設定後、実際のデータを取得
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
      console.log('Using mock data - Google credentials not configured')
      return NextResponse.json(mockData)
    }

    // Google Sheets APIクライアントの初期化
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    })

    const sheets = google.sheets({ version: 'v4', auth })
    
    // 全年度のデータを取得
    const years = ['2021', '2022', '2023', '2024', '2025']
    const allQuestions: any[] = []

    for (const year of years) {
      try {
        const sheetName = `${year}年共通テスト地理B`
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A:I`,
        })

        const rows = response.data.values
        if (!rows || rows.length === 0) continue

        // ヘッダー行をスキップ
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i]
          if (!row[0] && !row[1]) continue // 空行をスキップ

          allQuestions.push({
            id: row[0] || '',
            questionId: row[1] || '',
            category: row[2] || '',
            answer: row[3] || '',
            correctRate: row[4] || '',
            createdDate: row[5] || '',
            notes: row[6] || '',
            imageFile: row[7] || '',
            imageUrl: row[8] || '',
            year: year
          })
        }
      } catch (error) {
        console.error(`Error fetching ${year} data:`, error)
      }
    }

    return NextResponse.json(allQuestions)
  } catch (error) {
    console.error('Error fetching questions:', error)
    return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
  }
}