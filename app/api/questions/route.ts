import { NextResponse } from 'next/server'
import { google } from 'googleapis'

type Question = {
  id: string
  questionId: string
  category: string
  answer: string
  correctRate: string
  createdDate: string
  notes: string
  imageFile: string
  imageUrl: string
  year: string
}

// 環境変数から認証情報を取得
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!

// 開発環境用のモックデータ（認証設定前でも動作確認可能）
const mockData = [
  {
    id: '1',
    questionId: '2024_geo_1_1',
    category: '地形',
    answer: '3',
    correctRate: '',
    imageUrl: 'https://drive.google.com/file/d/sample',
    year: '2024'
  },
  // 実際のデータはGoogle Sheetsから取得
]

export async function GET() {
  // 強制的にモックデータを返す
  const mockQuestions = [
    {
      id: '1',
      questionId: '2024_geo_1_1',
      category: '地形',
      answer: '3',
      correctRate: '',
      imageUrl: 'https://drive.google.com/file/d/sample',
      year: '2024'
    }
  ]
  
  return NextResponse.json(mockQuestions)
}