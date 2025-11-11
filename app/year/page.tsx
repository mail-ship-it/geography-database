'use client'

import { useState, useEffect } from 'react'
import { Calendar, FileText, Download, BarChart3 } from 'lucide-react'
import Link from 'next/link'

type YearInfo = {
  year: string
  examType: string
  problemPdfUrl: string
  answerPdfUrl: string
  explanationPdfUrl: string
  averageScore: string
  notes: string
}

export default function YearPage() {
  const [yearData, setYearData] = useState<YearInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchYearData = async () => {
      try {
        const response = await fetch('/api/year-info')
        const data = await response.json()
        setYearData(data)
        setLoading(false)
      } catch (error) {
        console.error('年度データ取得エラー:', error)
        setLoading(false)
      }
    }

    fetchYearData()
  }, [])

  const groupedData = yearData.reduce((acc, item) => {
    if (!acc[item.year]) {
      acc[item.year] = []
    }
    acc[item.year].push(item)
    return acc
  }, {} as Record<string, YearInfo[]>)

  const years = Object.keys(groupedData).sort((a, b) => parseInt(b) - parseInt(a))

  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-2">
            🌏 共通テスト地理問題データベース
          </h1>
          <p className="text-center opacity-90">
            年度別 - 問題・解答PDFと平均点
          </p>
          <div className="text-center mt-4">
            <Link 
              href="/"
              className="text-white hover:text-blue-200 transition-colors"
            >
              ← トップページに戻る
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">データを読み込み中...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {years.map(year => (
              <div key={year} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="bg-blue-600 text-white px-6 py-4">
                  <h2 className="text-2xl font-bold flex items-center">
                    <Calendar className="mr-2" />
                    {year}年 共通テスト地理B
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {groupedData[year].map((exam, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">
                            {exam.examType}
                          </h3>
                          {exam.averageScore && (
                            <div className="flex items-center text-orange-600">
                              <BarChart3 className="w-4 h-4 mr-1" />
                              <span className="text-sm font-medium">
                                平均点: {exam.averageScore}点
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-3">
                          {/* 問題PDF */}
                          <div className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-blue-600 mr-2" />
                              <span className="text-sm font-medium text-blue-700">問題PDF</span>
                            </div>
                            {exam.problemPdfUrl ? (
                              <a
                                href={exam.problemPdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600 transition-colors text-sm"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                開く
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">準備中</span>
                            )}
                          </div>

                          {/* 解答PDF */}
                          <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-green-600 mr-2" />
                              <span className="text-sm font-medium text-green-700">解答PDF</span>
                            </div>
                            {exam.answerPdfUrl ? (
                              <a
                                href={exam.answerPdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600 transition-colors text-sm"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                開く
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">準備中</span>
                            )}
                          </div>

                          {/* 解説PDF */}
                          <div className="flex items-center justify-between bg-purple-50 p-3 rounded-lg">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-purple-600 mr-2" />
                              <span className="text-sm font-medium text-purple-700">解説PDF</span>
                            </div>
                            {exam.explanationPdfUrl ? (
                              <a
                                href={exam.explanationPdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center bg-purple-500 text-white px-3 py-1 rounded-md hover:bg-purple-600 transition-colors text-sm"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                開く
                              </a>
                            ) : (
                              <span className="text-gray-400 text-sm">準備中</span>
                            )}
                          </div>
                        </div>

                        {exam.notes && (
                          <div className="mt-3 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                            {exam.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}