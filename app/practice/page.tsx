'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronRight, Check, X, RotateCcw } from 'lucide-react'
import Header from '../components/Header'

type Question = {
  id: string
  questionId: string
  category: string
  answer: string
  difficulty: string
  imageUrl: string
  year: string
  explanation?: string
}

type YearExam = {
  year: string
  examType: string
  displayName: string
}

export default function PracticePage() {
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ correct: 0, total: 0 })
  const [answeredIds, setAnsweredIds] = useState<Set<string>>(new Set())

  // 年度リストと全問題を取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 年度リストを取得
        const yearResponse = await fetch('/api/sheet-info')
        const yearData = await yearResponse.json()

        if (yearData.yearExams && Array.isArray(yearData.yearExams)) {

          // 全年度の問題を並列取得
          const promises = yearData.yearExams.map(async (yearExam: YearExam) => {
            const examType = yearExam.examType === '本試験' ? 'honshiken' : 'tsuishiken'
            const response = await fetch(`/api/questions?year=${yearExam.year}&examType=${examType}`)
            return response.json()
          })

          const results = await Promise.all(promises)
          const questions = results.flat().filter((item): item is Question =>
            item && typeof item === 'object' && item.imageUrl
          )

          setAllQuestions(questions)

          // 最初の問題をランダムに選択
          if (questions.length > 0) {
            const randomIndex = Math.floor(Math.random() * questions.length)
            setCurrentQuestion(questions[randomIndex])
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  // 次の問題を取得
  const getNextQuestion = useCallback(() => {
    setSelectedAnswer(null)
    setShowResult(false)

    // まだ回答していない問題を優先
    const unansweredQuestions = allQuestions.filter(q => !answeredIds.has(q.id))
    const questionsPool = unansweredQuestions.length > 0 ? unansweredQuestions : allQuestions

    if (questionsPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * questionsPool.length)
      setCurrentQuestion(questionsPool[randomIndex])
    }
  }, [allQuestions, answeredIds])

  // 回答を選択
  const handleAnswerSelect = (answer: string) => {
    if (showResult) return
    setSelectedAnswer(answer)
  }

  // 回答を確定
  const handleSubmit = () => {
    if (!selectedAnswer || !currentQuestion) return

    setShowResult(true)
    setAnsweredIds(prev => new Set(prev).add(currentQuestion.id))

    const isCorrect = selectedAnswer === currentQuestion.answer
    setStats(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1
    }))
  }

  // 統計をリセット
  const resetStats = () => {
    setStats({ correct: 0, total: 0 })
    setAnsweredIds(new Set())
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Header subtitle="ランダム演習" showBackLink />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ab5cd] mx-auto"></div>
            <p className="mt-4 text-gray-600">問題を読み込み中...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!currentQuestion) {
    return (
      <main className="min-h-screen bg-white">
        <Header subtitle="ランダム演習" showBackLink />
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-gray-600">問題が見つかりませんでした</p>
          </div>
        </div>
      </main>
    )
  }

  const isCorrect = selectedAnswer === currentQuestion.answer
  const answerOptions = ['1', '2', '3', '4', '5', '6', '7', '8']

  return (
    <main className="min-h-screen bg-white">
      <Header subtitle="ランダム演習" showBackLink />

      <div className="container mx-auto px-4 py-6">
        {/* 統計表示 */}
        <div className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#2b6ca3]">{stats.total}</div>
                <div className="text-xs text-gray-500">回答数</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.correct}</div>
                <div className="text-xs text-gray-500">正解</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#e63278]">
                  {stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0}%
                </div>
                <div className="text-xs text-gray-500">正答率</div>
              </div>
            </div>
            <button
              onClick={resetStats}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <RotateCcw className="w-4 h-4" />
              リセット
            </button>
          </div>
        </div>

        {/* 問題表示 */}
        <div className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm overflow-hidden">
          {/* 問題ヘッダー */}
          <div className="bg-gray-50 px-6 py-4 border-b border-[#e2e2e2]">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span className="font-bold text-[#2b6ca3] text-lg">
                  {currentQuestion.questionId}
                </span>
                {currentQuestion.category?.split(',').map((cat, index) => (
                  <span
                    key={index}
                    className="inline-block bg-[#3ab5cd]/10 text-[#2b6ca3] px-2 py-1 rounded-md text-xs"
                  >
                    {cat.trim()}
                  </span>
                ))}
              </div>
              {currentQuestion.difficulty && (
                <span
                  className={`inline-block px-3 py-1 rounded-md text-sm font-semibold ${
                    currentQuestion.difficulty === 'A' ? 'bg-[#3ab5cd] text-white' :
                    currentQuestion.difficulty === 'B' ? 'bg-[#2b6ca3] text-white' :
                    currentQuestion.difficulty === 'C' ? 'bg-[#feec00] text-gray-800' :
                    currentQuestion.difficulty === 'D' ? 'bg-[#e63278] text-white' :
                    currentQuestion.difficulty === 'E' ? 'bg-[#e63035] text-white' :
                    'bg-[#e2e2e2] text-gray-700'
                  }`}
                >
                  難易度: {currentQuestion.difficulty}
                </span>
              )}
            </div>
          </div>

          {/* 問題画像 */}
          <div className="p-6">
            {currentQuestion.imageUrl && (
              <div className="mb-6">
                <img
                  src={currentQuestion.imageUrl}
                  alt={`問題 ${currentQuestion.questionId}`}
                  className="max-w-full rounded-lg shadow-sm mx-auto"
                />
              </div>
            )}

            {/* 選択肢 */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">選択肢を選んでください：</p>
              <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
                {answerOptions.map((option) => {
                  let buttonClass = 'border-2 border-[#e2e2e2] bg-white hover:border-[#3ab5cd] hover:bg-[#3ab5cd]/5'

                  if (showResult) {
                    if (option === currentQuestion.answer) {
                      buttonClass = 'border-2 border-green-500 bg-green-50'
                    } else if (option === selectedAnswer && option !== currentQuestion.answer) {
                      buttonClass = 'border-2 border-red-500 bg-red-50'
                    }
                  } else if (selectedAnswer === option) {
                    buttonClass = 'border-2 border-[#3ab5cd] bg-[#3ab5cd]/10'
                  }

                  return (
                    <button
                      key={option}
                      onClick={() => handleAnswerSelect(option)}
                      disabled={showResult}
                      className={`py-4 rounded-lg text-xl font-bold transition-all ${buttonClass} ${
                        showResult ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      {option}
                      {showResult && option === currentQuestion.answer && (
                        <Check className="w-5 h-5 text-green-600 inline ml-1" />
                      )}
                      {showResult && option === selectedAnswer && option !== currentQuestion.answer && (
                        <X className="w-5 h-5 text-red-600 inline ml-1" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 回答確定・次へボタン */}
            <div className="flex justify-center gap-4">
              {!showResult ? (
                <button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer}
                  className={`px-8 py-3 rounded-lg font-medium transition-colors ${
                    selectedAnswer
                      ? 'bg-[#2b6ca3] text-white hover:bg-[#3ab5cd]'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  回答する
                </button>
              ) : (
                <button
                  onClick={getNextQuestion}
                  className="flex items-center gap-2 px-8 py-3 bg-[#e63278] text-white rounded-lg font-medium hover:bg-[#2b6ca3] transition-colors"
                >
                  次の問題へ
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 結果表示 */}
            {showResult && (
              <div className="mt-6">
                <div className={`p-4 rounded-lg ${isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    {isCorrect ? (
                      <>
                        <Check className="w-6 h-6 text-green-600" />
                        <span className="text-lg font-bold text-green-600">正解！</span>
                      </>
                    ) : (
                      <>
                        <X className="w-6 h-6 text-red-600" />
                        <span className="text-lg font-bold text-red-600">
                          不正解... 正答は {currentQuestion.answer} です
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* 解説 */}
                {currentQuestion.explanation && (
                  <div className="mt-4 p-4 bg-[#3ab5cd]/5 rounded-lg border-l-4 border-[#3ab5cd]">
                    <h4 className="text-sm font-semibold text-[#2b6ca3] mb-2">解説</h4>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {currentQuestion.explanation}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
