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
  note: string
}

export async function GET() {
  try {
    const sheets = getGoogleSheetsClient()

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: STUDY_SPREADSHEET_ID,
      range: '100の公式!A2:F200',
    })

    const rows = response.data.values || []

    const tips: Tip[] = rows
      .filter(row => row[0])
      .map(row => ({
        id: row[0] || '',
        category: row[1] || '',
        title: row[2] || '',
        content: row[3] || '',
        keywords: row[4] || '',
        note: row[5] || '',
      }))

    return NextResponse.json(tips)
  } catch (error) {
    console.error('Tips API error:', error)
    return NextResponse.json({ error: 'Failed to fetch tips' }, { status: 500 })
  }
}
