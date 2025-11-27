import { NextResponse } from 'next/server'
import { getGoogleSheetsClient, SPREADSHEET_ID, Question } from '@/lib/googleSheets'

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

// ヘッダー名と列インデックスのマッピングを作成
function createColumnMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {}

  // ヘッダー名のバリエーションに対応（完全一致を優先するため、長い順にソート）
  const headerAliases: Record<string, string[]> = {
    'questionId': ['問題ID', '問題id'],
    'mainTags': ['メインタグ', 'メイン分野'],
    'subTags': ['サブタグ', 'サブ分野'],
    'answer': ['正答選択肢'],
    'correctRate': ['正答率', '正解率'],
    'difficulty': ['難易度'],
    'isImportant': ['重要問題'],
    'questionText': ['問題文'],
    'explanation': ['解説文'],
    'explanationSummary': ['解説要約文'],
    'notes': ['備考'],
    'imageUrl': ['画像URL', '画像url'],
  }

  headers.forEach((header, index) => {
    const trimmedHeader = header.trim()

    // 各フィールドに対してヘッダー名をチェック（完全一致のみ）
    for (const [fieldName, aliases] of Object.entries(headerAliases)) {
      if (aliases.some(alias => trimmedHeader === alias)) {
        mapping[fieldName] = index
        break
      }
    }
  })

  return mapping
}

// シート名を動的に生成（年度と試験種別から）
function getSheetName(year: string, examType: string): string {
  const examTypeJa = examType === 'honshiken' ? '本試験' : '追試験'
  return `${year}年${examTypeJa}`
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

    // シート名を動的に生成
    const sheetName = getSheetName(year, examType)

    const sheets = getGoogleSheetsClient()

    // スプレッドシートから全列のデータを取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:Z`, // 全列を取得（将来の列追加に対応）
    })

    const rows = response.data.values

    if (!rows || rows.length <= 1) {
      return NextResponse.json([])
    }

    // ヘッダー行から列マッピングを作成
    const headers = rows[0] as string[]
    const columnMap = createColumnMapping(headers)

    // データ行を変換
    const questions: Question[] = rows.slice(1).map((row, index) => {
      const getValue = (fieldName: string): string => {
        const colIndex = columnMap[fieldName]
        return colIndex !== undefined ? (row[colIndex] || '') : ''
      }

      const mainTagsString = getValue('mainTags')
      const subTagsString = getValue('subTags')
      const imageUrlRaw = getValue('imageUrl')

      return {
        id: (index + 1).toString(),
        questionId: getValue('questionId'),
        category: mainTagsString,
        mainTags: mainTagsString ? mainTagsString.split(',').map((t: string) => t.trim()) : [],
        subTags: subTagsString ? subTagsString.split(',').map((t: string) => t.trim()) : [],
        answer: getValue('answer'),
        correctRate: getValue('correctRate'),
        difficulty: getValue('difficulty'),
        isImportant: getValue('isImportant'),
        imageUrl: convertDriveUrlToDirectLink(imageUrlRaw),
        year: year,
        notes: getValue('notes'),
        createdDate: '',
        imageFile: imageUrlRaw,
        questionText: getValue('questionText'),
        fullQuestionText: getValue('questionText'),
        explanation: getValue('explanationSummary') || getValue('explanation'),
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
