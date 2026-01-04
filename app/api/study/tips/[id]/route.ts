import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const STUDY_SPREADSHEET_ID = '1DOE8cJNxf4SkosUooveiGQTQuod1uzdJK3n9wS4O5G4'

function getGoogleSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  })
  return google.sheets({ version: 'v4', auth })
}

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

  // 形式3: 既にlh3.googleusercontent.com形式の場合はそのまま返す
  if (!fileId && driveUrl.includes('lh3.googleusercontent.com')) {
    return driveUrl
  }

  if (fileId) {
    // Googleusercontent経由で画像を直接表示
    return `https://lh3.googleusercontent.com/d/${fileId}`
  }

  return driveUrl
}

export type Tip = {
  id: string
  category: string
  title: string
  content: string
  keywords: string
  relatedQuestions: string
  imageUrl: string
  answer: string
  explanationSummary: string
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sheets = getGoogleSheetsClient()
    const { id } = await params

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: STUDY_SPREADSHEET_ID,
      range: '100の公式!A2:I200',
    })

    const rows = response.data.values || []

    const tip = rows
      .filter(row => row[0])
      .map(row => ({
        id: row[0] || '',
        category: row[1] || '',
        title: row[2] || '',
        content: row[3] || '',
        keywords: row[4] || '',
        relatedQuestions: row[5] || '',
        imageUrl: convertDriveUrlToDirectLink(row[6] || ''),
        answer: row[7] || '',
        explanationSummary: row[8] || '',
      }))
      .find(t => t.id === id)

    if (!tip) {
      return NextResponse.json({ error: 'Tip not found' }, { status: 404 })
    }

    return NextResponse.json(tip)
  } catch (error) {
    console.error('Tip API error:', error)
    return NextResponse.json({ error: 'Failed to fetch tip' }, { status: 500 })
  }
}
