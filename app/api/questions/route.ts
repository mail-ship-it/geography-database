import { NextResponse } from 'next/server'
import { getGoogleSheetsClient, SPREADSHEET_ID, SHEET_NAMES, Question, parseTags } from '@/lib/googleSheets'

// Google Drive URL を画像表示可能な形式に変換
function convertDriveUrlToDirectLink(driveUrl: string): string {
  if (!driveUrl) return ''

  // FILE_IDを抽出（様々な形式に対応）
  let fileId = ''

  // 形式1: https://drive.google.com/uc?export=view&id=FILE_ID
  const ucMatch = driveUrl.match(/[?&]id=([a-zA-Z0-9-_]+)/)
  if (ucMatch && ucMatch[1]) {
    fileId = ucMatch[1]
  }

  // 形式2: https://drive.google.com/file/d/FILE_ID/view
  if (!fileId) {
    const fileMatch = driveUrl.match(/\/file\/d\/([a-zA-Z0-9-_]+)/)
    if (fileMatch && fileMatch[1]) {
      fileId = fileMatch[1]
    }
  }

  if (fileId) {
    // Googleusercontent経由で画像を直接表示
    return `https://lh3.googleusercontent.com/d/${fileId}`
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
      const mainTagsString = row[2] || '' // C列: メインタグ
      const subTagsString = row[3] || '' // D列: サブタグ

      return {
        id: (index + 1).toString(),
        questionId: row[1] || '', // B列: 問題ID（2024_本試験_1など）
        category: mainTagsString, // C列: メインタグ
        mainTags: mainTagsString ? mainTagsString.split(',').map(t => t.trim()) : [], // メインタグを配列に
        subTags: subTagsString ? subTagsString.split(',').map(t => t.trim()) : [], // サブタグを配列に
        answer: row[4] || '', // E列: 正答選択肢
        correctRate: row[5] || '', // F列: 正答率
        difficulty: row[6] || '', // G列: 難易度（A-E）
        isImportant: row[7] || '', // H列: 重要問題
        imageUrl: convertDriveUrlToDirectLink(row[9] || ''), // J列: Google Drive URL → 直接表示可能URL
        year: year, // URLパラメータから取得
        notes: row[8] || '', // I列: 備考
        createdDate: '', // 作成日は現在のシートにない
        imageFile: row[9] || '', // J列: 画像URL（新形式）
        questionText: '', // OCRキーワードは現在のシートにない
        fullQuestionText: '' // 問題文全文は現在のシートにない
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