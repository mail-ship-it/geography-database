'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Lightbulb, FileText, Eye, EyeOff } from 'lucide-react'
import Header from '../../../components/Header'

type Tip = {
  id: string
  category: string
  title: string
  content: string
  keywords: string
  relatedQuestions: string
  imageUrl: string
  answer: string
  explanationSummary: string
}

type Question = {
  id: string
  questionId: string
  imageUrl: string
  answer: string
}

export default function TipDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [tip, setTip] = useState<Tip | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [showAnswers, setShowAnswers] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  // 問題IDから年度と試験種別をパース（例: "2019_本試験_2" → {year: "2019", examType: "honshiken", number: "2"}）
  const parseQuestionId = (qid: string) => {
    const match = qid.match(/^(\d{4})_(本試験|追試験)_(\d+)$/)
    if (!match) return null
    return {
      year: match[1],
      examType: match[2] === '本試験' ? 'honshiken' : 'tsuishiken',
      questionId: qid
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tipデータを取得
        const tipResponse = await fetch(`/api/study/tips/${id}`)
        if (tipResponse.ok) {
          const tipData = await tipResponse.json()
          setTip(tipData)

          // 関連問題がある場合、問題データを取得
          if (tipData.relatedQuestions) {
            const questionIds = tipData.relatedQuestions.split(',').map((q: string) => q.trim())
            const questionPromises = questionIds.map(async (qid: string, index: number) => {
              const parsed = parseQuestionId(qid)

              // 地理Bシートから取得を試みる
              if (parsed) {
                const qResponse = await fetch(`/api/questions?year=${parsed.year}&examType=${parsed.examType}`)
                if (qResponse.ok) {
                  const allQuestions = await qResponse.json()
                  const found = allQuestions.find((q: Question) => q.questionId === qid)
                  if (found) return found
                }
              }

              // 地理Bシートから取得できない場合、tipのデータを使用
              // 最初の関連問題の場合のみ、G列の画像とH列の解答を使用
              if (index === 0) {
                return {
                  id: qid,
                  questionId: qid,
                  imageUrl: tipData.imageUrl,
                  answer: tipData.answer
                }
              }

              return null
            })

            const fetchedQuestions = await Promise.all(questionPromises)
            setQuestions(fetchedQuestions.filter(q => q !== null))
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      setLoading(false)
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Header subtitle="100のコツ" showBackLink backHref="/study/tips" />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2b6ca3] mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!tip) {
    return (
      <main className="min-h-screen bg-white">
        <Header subtitle="100のコツ" showBackLink backHref="/study/tips" />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-gray-600">コツが見つかりませんでした</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <Header subtitle="100のコツ" showBackLink backHref="/study/tips" />

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* ヘッダー */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-[#2b6ca3]/10 p-3 rounded-full">
              <Lightbulb className="w-6 h-6 text-[#2b6ca3]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#2b6ca3]/10 text-[#2b6ca3] px-3 py-1 rounded text-sm font-medium">
                  {tip.category}
                </span>
                <span className="text-gray-400 text-sm">#{tip.id}</span>
              </div>
              <h1 className="text-2xl font-bold text-[#2b6ca3]">{tip.title}</h1>
            </div>
          </div>
        </div>

        {/* 内容 */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-[#2b6ca3]" />
            <h2 className="font-bold text-gray-900">内容</h2>
          </div>
          <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{tip.content}</p>
        </div>

        {/* 関連問題 */}
        {questions.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <span className="text-lg">📝</span>
              関連問題
            </h2>
            {questions.map((question) => (
              <div key={question.id} className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                <div className="mb-4">
                  <span className="text-sm font-medium text-gray-600">{question.questionId}</span>
                </div>

                {/* 問題画像 */}
                {question.imageUrl && (
                  <div className="mb-4">
                    <img
                      src={question.imageUrl}
                      alt={question.questionId}
                      className="max-w-full rounded-lg mx-auto"
                    />
                  </div>
                )}

                {/* 解答表示/非表示ボタン */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAnswers(prev => ({
                      ...prev,
                      [question.id]: !prev[question.id]
                    }))}
                    className="flex items-center gap-2 px-4 py-2 bg-[#2b6ca3] text-white rounded-lg hover:bg-[#3ab5cd] transition-colors"
                  >
                    {showAnswers[question.id] ? (
                      <>
                        <EyeOff className="w-4 h-4" />
                        解答を隠す
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        解答を表示
                      </>
                    )}
                  </button>

                  {/* 解答 */}
                  {showAnswers[question.id] && question.answer && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">正答:</span>
                      <span className="bg-[#feec00]/30 text-gray-900 px-4 py-2 rounded-lg font-bold text-lg">
                        {question.answer}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
