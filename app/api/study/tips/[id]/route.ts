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

export type Tip = {
  id: string
  category: string
  title: string
  content: string
  keywords: string
  relatedQuestions: string
  imageUrl: string
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
      range: '100の公式!A2:G200',
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
        imageUrl: row[6] || '',
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
