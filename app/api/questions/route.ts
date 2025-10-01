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
  // より多くのモックデータを返す（一時的対応）
  const mockQuestions = [
    {
      id: '1',
      questionId: '2024_geo_1_1',
      category: '地形',
      answer: '3',
      correctRate: '75%',
      imageUrl: 'https://drive.google.com/uc?id=1NxLRq2Ceq2DioGun0IPQXlMTam72-FtL&export=view',
      year: '2024'
    },
    {
      id: '2', 
      questionId: '2024_geo_1_2',
      category: '気候',
      answer: '1',
      correctRate: '82%',
      imageUrl: 'https://drive.google.com/uc?id=1k6wiaRKCNGCWJF7-K3odNkyVKDFn5clK&export=view',
      year: '2024'
    },
    {
      id: '3',
      questionId: '2024_geo_1_3', 
      category: '農業',
      answer: '4',
      correctRate: '68%',
      imageUrl: 'https://drive.google.com/uc?id=199jK5aNx9YCmOpB-OD-V_PeN0EBnUvYQ&export=view',
      year: '2024'
    }
  ]
  
  return NextResponse.json(mockQuestions)
}