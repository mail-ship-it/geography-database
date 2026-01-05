import { NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { getGoogleSheetsClient, SPREADSHEET_ID, Question } from '@/lib/googleSheets'

// Google Drive URL を画像表示可能な形式に変換
function convertDriveUrlToDirectLink(driveUrl: string): string {
  if (!driveUrl) return ''

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
    return `https://lh3.googleusercontent.com/d/${fileId}`
  }

  return driveUrl
}

// ヘッダー名と列インデックスのマッピングを作成
function createColumnMapping(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {}

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
    'explanationSummary': ['要約解説文'],
    'notes': ['備考'],
    'imageUrl': ['画像URL', '画像url'],
  }

  headers.forEach((header, index) => {
    const trimmedHeader = header.trim()

    for (const [fieldName, aliases] of Object.entries(headerAliases)) {
      if (aliases.some(alias => trimmedHeader === alias)) {
        mapping[fieldName] = index
        break
      }
    }
  })

  return mapping
}

// シート名から年度データを取得
async function fetchQuestionsFromSheet(sheets: any, sheetName: string, year: string, examType: string): Promise<Question[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:Z`,
  })

  const rows = response.data.values

  if (!rows || rows.length <= 1) {
    return []
  }

  const headers = rows[0] as string[]
  const columnMap = createColumnMapping(headers)

  return rows.slice(1).map((row: any[], index: number) => {
    const getValue = (fieldName: string): string => {
      const colIndex = columnMap[fieldName]
      return colIndex !== undefined ? (row[colIndex] || '') : ''
    }

    const mainTagsString = getValue('mainTags')
    const subTagsString = getValue('subTags')
    const imageUrlRaw = getValue('imageUrl')
    const questionId = getValue('questionId')

    return {
      id: questionId || `${year}_${examType}_${index + 1}`,
      questionId: questionId,
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
}

// スナップショットデータを取得（キャッシュあり）
export const getSnapshot = unstable_cache(
  async () => {
    console.log('[Snapshot] Fetching fresh data from Google Sheets...')
    const sheets = getGoogleSheetsClient()

    // 1. Sheet情報を取得（年度リスト）
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    const sheetNames = spreadsheet.data.sheets?.map(
      sheet => sheet.properties?.title || ''
    ) || []

    const yearExams = sheetNames
      .filter(name => /^\d{4}年(本試験|追試験)$/.test(name))
      .map(name => {
        const match = name.match(/^(\d{4})年(本試験|追試験)$/)
        return {
          year: match?.[1] || '',
          examType: match?.[2] || '',
          sheetName: name,
          displayName: name
        }
      })
      .sort((a, b) => {
        if (a.year !== b.year) {
          return b.year.localeCompare(a.year)
        }
        return a.examType === '本試験' ? -1 : 1
      })

    // 2. タグリストを取得
    const tagsResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: '参考_分野一覧!A2:A100',
    })
    const tags = (tagsResponse.data.values || [])
      .map(row => row[0])
      .filter(Boolean) as string[]

    // 3. 年度別情報を取得
    const yearInfoResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: '年度別情報!A2:G100',
    })
    const yearInfo = (yearInfoResponse.data.values || [])
      .filter(row => row[0])
      .map(row => ({
        year: row[0] || '',
        examType: row[1] || '',
        problemPdfUrl: row[2] || '',
        answerPdfUrl: row[3] || '',
        explanationPdfUrl: row[4] || '',
        averageScore: row[5] || '',
        notes: row[6] || ''
      }))

    // 4. 全年度の問題データを並列取得
    const allQuestionsPromises = yearExams.map(async (ye) => {
      const examTypeKey = ye.examType === '本試験' ? 'honshiken' : 'tsuishiken'
      const questions = await fetchQuestionsFromSheet(sheets, ye.sheetName, ye.year, examTypeKey)
      return {
        year: ye.year,
        examType: examTypeKey,
        questions
      }
    })

    const allQuestionsData = await Promise.all(allQuestionsPromises)

    // 問題データをマップに変換
    const questionsByYearExam: Record<string, Question[]> = {}
    allQuestionsData.forEach(({ year, examType, questions }) => {
      const key = `${year}_${examType}`
      questionsByYearExam[key] = questions
    })

    console.log('[Snapshot] Data fetched successfully')

    return {
      yearExams,
      tags,
      yearInfo,
      questionsByYearExam,
      timestamp: new Date().toISOString()
    }
  },
  ['geography-snapshot'], // キャッシュキー
  {
    revalidate: 3600, // 1時間キャッシュ
    tags: ['geography-snapshot']
  }
)

export async function GET() {
  try {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      return NextResponse.json({
        error: 'GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set'
      }, { status: 500 })
    }

    const data = await getSnapshot()

    // Vercel CDN キャッシュ設定
    // max-age=0: ブラウザはキャッシュしない
    // s-maxage=3600: CDNは1時間キャッシュ
    // stale-while-revalidate=86400: 古いキャッシュを返しつつバックグラウンドで再検証（1日）
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      }
    })
  } catch (error) {
    console.error('Snapshot API error:', error)
    return NextResponse.json({
      error: 'Failed to fetch snapshot',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
