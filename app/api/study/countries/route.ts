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

export type Country = {
  id: string
  name: string
  region: string
  gdpLevel: string
  gdpEstimate: string
  populationLevel: string
  populationEstimate: string
  climate: string
  keywords: string
  description: string
}

export async function GET() {
  try {
    const sheets = getGoogleSheetsClient()

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: STUDY_SPREADSHEET_ID,
      range: 'Geo_Countries_72!A2:J100',
    })

    const rows = response.data.values || []

    const countries: Country[] = rows.map(row => ({
      id: row[0] || '',
      name: row[1] || '',
      region: row[2] || '',
      gdpLevel: row[3] || '',
      gdpEstimate: row[4] || '',
      populationLevel: row[5] || '',
      populationEstimate: row[6] || '',
      climate: row[7] || '',
      keywords: row[8] || '',
      description: row[9] || '',
    }))

    return NextResponse.json(countries)
  } catch (error) {
    console.error('Countries API error:', error)
    return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 })
  }
}
