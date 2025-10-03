import { NextResponse } from 'next/server'
import { getGoogleSheetsClient, SPREADSHEET_ID, SHEET_NAMES, Question, parseTags } from '@/lib/googleSheets'

// Google Drive URL を直接表示可能なURLに変換
function convertDriveUrlToDirectLink(driveUrl: string): string {
  if (!driveUrl) return ''

  // Google Drive sharing URL from: https://drive.google.com/file/d/FILE_ID/view?usp=drivesdk
  // Convert to direct link: https://drive.google.com/uc?export=view&id=FILE_ID
  const match = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
  if (match && match[1]) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`
  }
  return driveUrl
}

export async function GET(request: Request) {
  try {
    // 環境変数の存在確認
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json({
        error: 'GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set'
      }, { status: 500 })
    }

    // URLパラメータから年度と試験種別を取得
    const { searchParams } = new URL(request.url)
    const year = searchParams.get('year') || '2024'
    const examType = searchParams.get('examType') || 'honshiken'

    // シート名を取得
    const sheetKey = `${year}_${examType}`
    const sheetName = SHEET_NAMES[sheetKey]

    if (!sheetName) {
      return NextResponse.json({
        error: `Invalid year or examType. Sheet not found for: ${sheetKey}`
      }, { status: 400 })
    }

    const sheets = getGoogleSheetsClient()

    // スプレッドシートからデータを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:K`, // A列からK列まで取得
    })

    const rows = response.data.values

    if (!rows || rows.length <= 1) {
      return NextResponse.json([])
    }

    // ヘッダー行をスキップして、データを変換
    const questions: Question[] = rows.slice(1).map((row, index) => {
      const categoryString = row[2] || '' // C列: 分野タグ
      const { mainTags, subTags } = parseTags(categoryString)

      return {
        id: (index + 1).toString(),
        questionId: row[1] || '', // B列: 問題ID（2024_geo_1_1など）
        category: categoryString, // C列: 元の形式（気候,日本|ハイサーグラフ）
        mainTags, // パース後: ["気候", "日本"]
        subTags, // パース後: ["ハイサーグラフ"]
        answer: row[3] || '', // D列: 正答
        correctRate: row[4] || '', // E列: 正答率
        imageUrl: convertDriveUrlToDirectLink(row[8] || ''), // I列: Google Drive URL → 直接表示可能URL
        year: year, // URLパラメータから取得
        notes: row[6] || '', // G列: ノート
        createdDate: row[5] || '', // F列: 作成日
        imageFile: row[7] || '', // H列: 画像ファイル名
        questionText: row[9] || '', // J列: OCRキーワード
        fullQuestionText: row[10] || '' // K列: 問題文全文
      }
    })

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