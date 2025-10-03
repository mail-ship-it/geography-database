import { google } from 'googleapis'

export const getGoogleSheetsClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!)
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  })

  return google.sheets({ version: 'v4', auth })
}

export const SPREADSHEET_ID = '1eqwocYOk34aANN78AuRzocV6l7NJll79yI_YOR3eocw'
export const SHEET_NAME = '2024年本試験'

// シート名マッピング
export const SHEET_NAMES: { [key: string]: string } = {
  '2021_honshiken': '2021年本試験',
  '2021_tsuishiken': '2021年追試験',
  '2022_honshiken': '2022年本試験',
  '2022_tsuishiken': '2022年追試験',
  '2023_honshiken': '2023年本試験',
  '2023_tsuishiken': '2023年追試験',
  '2024_honshiken': '2024年本試験',
  '2024_tsuishiken': '2024年追試験',
  '2025_honshiken': '2025年本試験',
  '2025_tsuishiken': '2025年追試験',
}

export type Question = {
  id: string
  questionId: string
  category: string
  answer: string
  correctRate: string
  imageUrl: string
  year: string
  notes: string
  createdDate: string
  imageFile: string
  questionText: string
  fullQuestionText: string
}