import { NextResponse } from 'next/server'
import { getGoogleSheetsClient, SPREADSHEET_ID } from '@/lib/googleSheets'

// 1時間キャッシュ
export const revalidate = 3600

export async function GET() {
  try {
    const sheets = getGoogleSheetsClient()

    // スプレッドシートのメタデータ取得
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    })

    const sheetNames = spreadsheet.data.sheets?.map(
      sheet => sheet.properties?.title || ''
    ) || []

    // "2024年本試験" のような形式からデータ抽出
    const yearExams = sheetNames
      .filter(name => /^\d{4}年(本試験|追試験)$/.test(name))
      .map(name => {
        const match = name.match(/^(\d{4})年(本試験|追試験)$/)
        return {
          year: match?.[1] || '',
          examType: match?.[2] || '',
          sheetName: name,
          displayName: name // "2024年本試験" のまま
        }
      })
      .sort((a, b) => {
        // 年度降順、同じ年度なら本試験→追試験
        if (a.year !== b.year) {
          return b.year.localeCompare(a.year)
        }
        return a.examType === '本試験' ? -1 : 1
      })

    return NextResponse.json({ yearExams })
  } catch (error) {
    console.error('Sheet info API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch sheet info',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
