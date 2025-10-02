import { google } from 'googleapis'

export const getGoogleSheetsClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!)
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
  })

  return google.sheets({ version: 'v4', auth })
}

export const SPREADSHEET_ID = '17cxHniOQP2C7QKCV8nqnn3IKEcd1HwWiDgExGb6FfEE'
export const SHEET_NAME = '2024年共通テスト地理B'

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
}