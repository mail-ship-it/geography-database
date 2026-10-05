import { google } from 'googleapis'

// 単語カードDB（chirijyuku-tools/scripts/flashcards/flashcards.py で作成・カード登録）
export const FLASHCARD_SPREADSHEET_ID = '1ZFovBXd6ylHZi1qUmsbfOM6F4gulyRe6tn2k6Ui9bew'

export const KNOWN = '覚えた'
export const UNKNOWN = '未習得'

export type Card = {
  id: string
  subject: string
  unit: string
  front: string
  back: string
}

export type Progress = {
  status: string // 覚えた / 未習得（直近の回答）
  correct: number
  wrong: number
}

export const getFlashcardSheetsClient = () => {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!)
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return google.sheets({ version: 'v4', auth })
}

// 日本時間の今日（YYYY-MM-DD）
const todayJST = () => new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10)

export async function getPublishedCards(): Promise<Card[]> {
  const sheets = getFlashcardSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: FLASHCARD_SPREADSHEET_ID,
    range: 'カード!A2:G',
  })
  // 列構成: カードID, 教科, 単元, 表, 裏, 出典ファイル, 公開
  return (res.data.values || [])
    .filter(row => row[0] && row[3] && String(row[6]).toUpperCase() === 'TRUE')
    .map(row => ({ id: row[0], subject: row[1] || '', unit: row[2] || '', front: row[3], back: row[4] || '' }))
}

// 有効な生徒コードなら名前を返す
export async function findStudent(code: string): Promise<string | null> {
  if (!code) return null
  const sheets = getFlashcardSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: FLASHCARD_SPREADSHEET_ID,
    range: '生徒!A2:C',
  })
  const normalized = code.trim().toUpperCase()
  const row = (res.data.values || []).find(
    r => String(r[0]).toUpperCase() === normalized && String(r[2]).toUpperCase() !== 'FALSE'
  )
  return row ? row[1] || normalized : null
}

// 進捗シート全体を読み、指定生徒の行（シート上の行番号付き）を返す
export async function getStudentProgress(code: string) {
  const sheets = getFlashcardSheetsClient()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: FLASHCARD_SPREADSHEET_ID,
    range: '進捗!A2:F',
  })
  // 列構成: 生徒コード, カードID, 状態, 覚えた回数, 覚えていない回数, 最終学習日
  const progress = new Map<string, Progress & { rowNumber: number }>()
  ;(res.data.values || []).forEach((row, i) => {
    if (row[0] !== code) return
    progress.set(row[1], {
      rowNumber: i + 2,
      status: row[2] || '',
      correct: Number(row[3]) || 0,
      wrong: Number(row[4]) || 0,
    })
  })
  return progress
}

export async function saveResults(code: string, results: { cardId: string; correct: boolean }[]) {
  const sheets = getFlashcardSheetsClient()
  const progress = await getStudentProgress(code)
  const today = todayJST()

  // 1セッション内で同じカードを複数回答えた場合は最初の回答で判定する
  const firstAnswers = new Map<string, boolean>()
  for (const { cardId, correct } of results) {
    if (!firstAnswers.has(cardId)) firstAnswers.set(cardId, correct)
  }

  const updates: { range: string; values: (string | number)[][] }[] = []
  const appends: (string | number)[][] = []

  for (const [cardId, correct] of firstAnswers) {
    const prev = progress.get(cardId)
    const row = [
      code,
      cardId,
      correct ? KNOWN : UNKNOWN,
      (prev?.correct ?? 0) + (correct ? 1 : 0),
      (prev?.wrong ?? 0) + (correct ? 0 : 1),
      today,
    ]
    if (prev) {
      updates.push({ range: `進捗!A${prev.rowNumber}:F${prev.rowNumber}`, values: [row] })
    } else {
      appends.push(row)
    }
  }

  if (updates.length) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: FLASHCARD_SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: updates },
    })
  }
  if (appends.length) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: FLASHCARD_SPREADSHEET_ID,
      range: '進捗!A:F',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: appends },
    })
  }
}
