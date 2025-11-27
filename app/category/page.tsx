'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Tag, Calendar } from 'lucide-react'
import Header from '../components/Header'

type Question = {
  id: string
  questionId: string
  category: string
  answer: string
  difficulty: string
  imageUrl: string
  year: string
  questionText?: string
  fullQuestionText?: string
  explanation?: string
}

function CategoryPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedYearExam, setSelectedYearExam] = useState<string>('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showAnswers, setShowAnswers] = useState<{ [key: string]: boolean }>({})
  const [showImages, setShowImages] = useState<{ [key: string]: boolean }>({})
  const [displayCount, setDisplayCount] = useState(5)
  const [availableYearExams, setAvailableYearExams] = useState<string[]>([])

  const fetchQuestions = async () => {
    try {
      // 1. まずシート情報を取得
      const sheetInfoResponse = await fetch('/api/sheet-info')
      const sheetInfoData = await sheetInfoResponse.json()

      if (sheetInfoData.yearExams && Array.isArray(sheetInfoData.yearExams)) {
        // 年度・試験種別リストを設定
        const yearExamOptions = sheetInfoData.yearExams.map(
          (item: { displayName: string }) => item.displayName
        )
        setAvailableYearExams(yearExamOptions)

        // 2. 各シートからデータを取得
        const allQuestions: Question[] = []

        for (const item of sheetInfoData.yearExams) {
          const examType = item.examType === '本試験' ? 'honshiken' : 'tsuishiken'
          const response = await fetch(`/api/questions?year=${item.year}&examType=${examType}`)
          const data = await response.json()

          if (Array.isArray(data) && data.length > 0) {
            allQuestions.push(...data)
          }
        }

        console.log('API Response:', allQuestions)
        console.log('Data length:', allQuestions.length)
        setQuestions(allQuestions)

        // カテゴリを抽出
        const allCategories = new Set<string>()
        allQuestions.forEach((q: Question) => {
          if (q.category) {
            q.category.split(',').forEach(cat => allCategories.add(cat.trim()))
          }
        })
        setCategories(Array.from(allCategories).sort())
      }

      setLoading(false)
    } catch (error) {
      console.error('Error fetching questions:', error)
      setLoading(false)
    }
  }

  const filterQuestions = useCallback(() => {
    let filtered = questions
    console.log('Filtering with questions:', questions)
    console.log('Questions length:', questions.length)

    if (selectedYearExam) {
      // "2025年本試験" → "2025_本試験" に変換
      const yearExamPattern = selectedYearExam.replace('年', '_')
      filtered = filtered.filter(q => q.questionId?.includes(yearExamPattern))
    }

    if (selectedDifficulty) {
      filtered = filtered.filter(q => q.difficulty === selectedDifficulty)
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(q =>
        selectedCategories.every(cat => q.category?.includes(cat))
      )
    }

    if (searchText) {
      const lower = searchText.toLowerCase()
      filtered = filtered.filter(q =>
        q.questionId?.toLowerCase().includes(lower) ||
        q.category?.toLowerCase().includes(lower) ||
        q.difficulty?.toLowerCase().includes(lower) ||
        q.questionText?.toLowerCase().includes(lower) ||
        q.fullQuestionText?.toLowerCase().includes(lower)
      )
    }

    console.log('Filtered questions:', filtered)
    console.log('Filtered length:', filtered.length)
    setFilteredQuestions(filtered)
  }, [questions, selectedYearExam, selectedDifficulty, selectedCategories, searchText])

  useEffect(() => {
    fetchQuestions()
  }, [])

  useEffect(() => {
    filterQuestions()
    setDisplayCount(5) // フィルタ変更時に表示数をリセット
  }, [filterQuestions])


  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const toggleAnswer = (questionId: string) => {
    setShowAnswers(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }))
  }

  const toggleImage = (questionId: string) => {
    setShowImages(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }))
  }

  const isImageVisible = (questionId: string) => {
    // デフォルトで表示（showImages[questionId]がfalseの時のみ非表示）
    return showImages[questionId] !== false
  }

  const loadMore = () => {
    setDisplayCount(prev => prev + 5)
  }


  // APIですでに変換済みのため、URLをそのまま使用
  const convertImageUrl = (url: string) => {
    return url
  }

  return (
    <main className="min-h-screen bg-white">
      <Header subtitle="分野別検索" showBackLink />

      {/* 検索パネル */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            {/* 年度・試験種別選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                年度・試験種別
              </label>
              <select
                value={selectedYearExam}
                onChange={(e) => setSelectedYearExam(e.target.value)}
                className="w-full px-3 py-2 border border-[#e2e2e2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab5cd]"
              >
                <option value="">全て</option>
                {availableYearExams.map(yearExam => (
                  <option key={yearExam} value={yearExam}>
                    {yearExam}
                  </option>
                ))}
              </select>
            </div>

            {/* 難易度選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline w-4 h-4 mr-1" />
                難易度
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 border border-[#e2e2e2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab5cd]"
              >
                <option value="">全て</option>
                <option value="A">A（易）</option>
                <option value="B">B（やや易）</option>
                <option value="C">C（普通）</option>
                <option value="D">D（やや難）</option>
                <option value="E">E（難）</option>
              </select>
            </div>

            {/* キーワード検索 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Search className="inline w-4 h-4 mr-1" />
                キーワード検索
              </label>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="問題ID、分野名で検索"
                className="w-full px-3 py-2 border border-[#e2e2e2] rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab5cd]"
              />
            </div>

            {/* 検索結果数 */}
            <div className="flex items-end">
              <div className="bg-gray-100 px-4 py-2 rounded-md w-full text-center">
                <span className="text-lg font-semibold">
                  {loading ? '読み込み中...' : `${filteredQuestions.length}件`}
                </span>
                <span className="text-sm text-gray-600 ml-1">の問題</span>
              </div>
            </div>
          </div>

          {/* カテゴリタグ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Tag className="inline w-4 h-4 mr-1" />
              分野タグ（複数選択可）
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => toggleCategory(category)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedCategories.includes(category)
                      ? 'bg-[#3ab5cd] text-white'
                      : 'bg-[#3ab5cd]/10 text-[#2b6ca3] hover:bg-[#3ab5cd]/20'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 結果表示 */}
        <div className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ab5cd] mx-auto"></div>
              <p className="mt-4 text-gray-600">データを読み込み中...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">条件に該当する問題が見つかりませんでした</p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {(filteredQuestions || []).slice(0, displayCount).map((question) => (
                  <div key={question.id} className="p-6 hover:bg-gray-50">
                    {/* 問題ヘッダー */}
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-[#2b6ca3]">
                          {question.questionId || 'ID不明'}
                        </span>
                      </div>
                    </div>

                    {/* カテゴリと難易度 */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {question.category?.split(',').map((cat, index) => (
                        <span
                          key={index}
                          className="inline-block bg-[#3ab5cd]/10 text-[#2b6ca3] px-2 py-1 rounded-md text-xs"
                        >
                          {cat.trim()}
                        </span>
                      ))}
                      {question.difficulty && (
                        <span
                          className={`inline-block px-2 py-1 rounded-md text-xs font-semibold ${
                            question.difficulty === 'A' ? 'bg-[#3ab5cd] text-white' :
                            question.difficulty === 'B' ? 'bg-[#2b6ca3] text-white' :
                            question.difficulty === 'C' ? 'bg-[#feec00] text-gray-800' :
                            question.difficulty === 'D' ? 'bg-[#e63278] text-white' :
                            question.difficulty === 'E' ? 'bg-[#e63035] text-white' :
                            'bg-[#e2e2e2] text-gray-700'
                          }`}
                        >
                          難易度: {question.difficulty}
                        </span>
                      )}
                    </div>

                    {/* 問題文 */}
                    {question.fullQuestionText && (
                      <div className="mb-4 p-4 bg-[#3ab5cd]/5 rounded-lg border-l-4 border-[#3ab5cd]">
                        <h3 className="text-sm font-semibold text-[#2b6ca3] mb-2">問題文</h3>
                        <p className="text-gray-800 leading-relaxed">{question.fullQuestionText}</p>
                      </div>
                    )}

                    {/* 問題画像 */}
                    {question.imageUrl && (
                      <div className="mb-4">
                        <button
                          onClick={() => toggleImage(question.id)}
                          className={`px-4 py-2 rounded-md transition-colors text-sm ${
                            isImageVisible(question.id)
                              ? 'bg-[#e2e2e2] text-gray-700 hover:bg-gray-300'
                              : 'bg-[#3ab5cd] text-white hover:bg-[#2b6ca3]'
                          }`}
                        >
                          {isImageVisible(question.id) ? '問題を非表示' : '問題を表示'}
                        </button>
                        {isImageVisible(question.id) && (
                          <div className="mt-3">
                            <img
                              src={convertImageUrl(question.imageUrl)}
                              alt={`問題 ${question.questionId}`}
                              className="max-w-full rounded-lg shadow-sm"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 正答表示 */}
                    <div>
                      <button
                        onClick={() => toggleAnswer(question.id)}
                        className="bg-[#2b6ca3] text-white px-4 py-2 rounded-md hover:bg-[#3ab5cd] transition-colors text-sm"
                      >
                        {showAnswers[question.id] ? '正答・解説を隠す' : '正答・解説を表示'}
                      </button>
                      {showAnswers[question.id] && (
                        <div className="mt-3 space-y-3">
                          <div className="p-3 bg-[#feec00]/20 rounded-lg">
                            <div className="text-lg font-bold text-[#2b6ca3]">
                              正答: {question.answer || '未設定'}
                            </div>
                          </div>
                          {question.explanation && (
                            <div className="p-4 bg-[#3ab5cd]/5 rounded-lg border-l-4 border-[#3ab5cd]">
                              <h4 className="text-sm font-semibold text-[#2b6ca3] mb-2">解説</h4>
                              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{question.explanation}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* さらに読み込むボタン */}
              {displayCount < filteredQuestions.length && (
                <div className="text-center py-6">
                  <button
                    onClick={loadMore}
                    className="bg-[#3ab5cd] text-white px-6 py-3 rounded-lg hover:bg-[#2b6ca3] transition-colors font-medium"
                  >
                    さらに読み込む ({displayCount}/{filteredQuestions.length}問表示中)
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}

export default CategoryPage