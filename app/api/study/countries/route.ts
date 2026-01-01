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
  mapUrl: string
}

export async function GET() {
  try {
    const sheets = getGoogleSheetsClient()

    // Bランク76カ国を取得
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: STUDY_SPREADSHEET_ID,
      range: 'Bランク76カ国!A2:K100',
    })

    const rows = response.data.values || []

    // Bランクデータをマッピング
    // 列構成: id, 国名, 地域, 所得レベル, 1人あたりGDP, 人口レベル, 人口, 気候, キーワード, 関連問題, 地図URL
    const countries: Country[] = rows.map(row => ({
      id: row[0] || '',
      name: row[1] || '',
      region: row[2] || '',
      gdpLevel: row[3] || '',  // 所得レベル
      gdpEstimate: row[4] || '',  // 1人あたりGDP
      populationLevel: row[5] || '',
      populationEstimate: row[6] || '',
      climate: row[7] || '',
      keywords: row[8] || '',
      description: '',  // description列なし（空文字列）
      mapUrl: row[10] || '',  // K列: 地図URL
    }))

    return NextResponse.json(countries)
  } catch (error) {
    console.error('Countries API error:', error)
    return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 500 })
  }
}
