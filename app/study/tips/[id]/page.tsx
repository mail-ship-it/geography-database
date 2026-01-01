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
  const [showExplanation, setShowExplanation] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Tipデータを取得
        const tipResponse = await fetch(`/api/study/tips/${id}`)
        if (tipResponse.ok) {
          const tipData = await tipResponse.json()
          setTip(tipData)

          // 関連問題がある場合、tipのG列、H列を使用
          if (tipData.relatedQuestions) {
            const questionIds = tipData.relatedQuestions
              .split(',')
              .map((q: string) => q.trim())
              .filter((q: string) => q.length > 0)  // 空文字列を除外

            console.log('Tip ID:', tipData.id)
            console.log('Image URL from API:', tipData.imageUrl)
            console.log('Answer from API:', tipData.answer)
            console.log('Question IDs:', questionIds)

            // 問題IDがある場合のみ処理
            if (questionIds.length > 0) {
              // 全ての問題にG列の画像とH列の解答を使用（1つのコツに対して画像は1つ）
              const questions = questionIds.map((qid: string) => ({
                id: qid,
                questionId: qid,
                imageUrl: tipData.imageUrl || '',
                answer: tipData.answer || ''
              }))
              console.log('Questions array:', questions)
              setQuestions(questions)
            }
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
          <div className="space-y-4 mb-6">
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
              </div>
            ))}
          </div>
        )}

        {/* 解答・解説セクション */}
        {(questions.length > 0 || tip.explanationSummary) && (
          <div className="bg-[#3ab5cd]/5 border border-[#3ab5cd]/30 rounded-lg p-6 mb-6">
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="w-full flex items-center justify-between gap-2 mb-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">💡</span>
                <h2 className="font-bold text-gray-900">解答・解説</h2>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[#2b6ca3] text-white rounded-lg hover:bg-[#3ab5cd] transition-colors">
                {showExplanation ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    <span className="text-sm">隠す</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    <span className="text-sm">表示</span>
                  </>
                )}
              </div>
            </button>

            {showExplanation && (
              <div className="space-y-4">
                {/* 解答 */}
                {questions.length > 0 && questions[0].answer && (
                  <div className="border-t border-[#3ab5cd]/20 pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700">正答:</span>
                      <span className="bg-[#feec00]/30 text-gray-900 px-4 py-2 rounded-lg font-bold text-lg">
                        {questions[0].answer}
                      </span>
                    </div>
                  </div>
                )}

                {/* 解説 */}
                {tip.explanationSummary && (
                  <div className="border-t border-[#3ab5cd]/20 pt-4">
                    <p className="text-gray-900 leading-relaxed whitespace-pre-wrap">{tip.explanationSummary}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
