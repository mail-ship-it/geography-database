'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, List, Brain, ChevronLeft, ChevronRight, Shuffle, Filter } from 'lucide-react'
import Header from '../../components/Header'

type Tip = {
  id: string
  category: string
  title: string
  content: string
  keywords: string
  note: string
}

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([])
  const [filteredTips, setFilteredTips] = useState<Tip[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | 'memorize'>('list')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('全て')
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    const fetchTips = async () => {
      try {
        const response = await fetch('/api/study/tips')
        const data = await response.json()
        if (Array.isArray(data)) {
          setTips(data)
          setFilteredTips(data)
          // カテゴリを抽出
          const cats = [...new Set(data.map((t: Tip) => t.category).filter(Boolean))]
          setCategories(cats as string[])
        }
      } catch (error) {
        console.error('Error fetching tips:', error)
      }
      setLoading(false)
    }
    fetchTips()
  }, [])

  useEffect(() => {
    let filtered = tips

    if (selectedCategory !== '全て') {
      filtered = filtered.filter(t => t.category === selectedCategory)
    }

    if (searchText) {
      const lower = searchText.toLowerCase()
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(lower) ||
        t.content.toLowerCase().includes(lower) ||
        t.keywords.toLowerCase().includes(lower)
      )
    }

    setFilteredTips(filtered)
    setCurrentIndex(0)
    setShowAnswer(false)
  }, [tips, selectedCategory, searchText])

  const shuffleCards = () => {
    const shuffled = [...filteredTips].sort(() => Math.random() - 0.5)
    setFilteredTips(shuffled)
    setCurrentIndex(0)
    setShowAnswer(false)
  }

  const nextCard = () => {
    if (currentIndex < filteredTips.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowAnswer(false)
    }
  }

  const currentTip = filteredTips[currentIndex]

  return (
    <main className="min-h-screen bg-white">
      <Header subtitle="100のコツ" showBackLink backHref="/study" />

      <div className="container mx-auto px-4 py-6">
        {/* モード切り替え */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('list')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'list'
                ? 'bg-[#2b6ca3] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List className="w-4 h-4 mr-2" />
            一覧モード
          </button>
          <button
            onClick={() => { setMode('memorize'); setShowAnswer(false); }}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'memorize'
                ? 'bg-[#2b6ca3] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Brain className="w-4 h-4 mr-2" />
            暗記モード
          </button>
        </div>

        {/* フィルター */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2b6ca3]"
              >
                <option value="全て">全て</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="キーワードで検索"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2b6ca3]"
            />
            <div className="text-sm text-gray-600 flex items-center">
              {filteredTips.length}項目
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2b6ca3] mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : tips.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">データ準備中です</p>
            <p className="text-sm text-gray-500 mt-2">100のコツは近日公開予定</p>
          </div>
        ) : mode === 'list' ? (
          /* 一覧モード */
          <div className="space-y-4">
            {filteredTips.map((tip) => (
              <div
                key={tip.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-[#2b6ca3]/10 text-[#2b6ca3] px-2 py-1 rounded text-xs font-medium">
                        {tip.category}
                      </span>
                      <span className="text-gray-400 text-xs">#{tip.id}</span>
                    </div>
                    <h3 className="font-bold text-[#2b6ca3] mb-2">{tip.title}</h3>
                    <p className="text-gray-700 text-sm">{tip.content}</p>
                    {tip.keywords && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {tip.keywords.split(',').map((kw, i) => (
                          <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                            {kw.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* 暗記モード */
          <div className="max-w-2xl mx-auto">
            {filteredTips.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                該当する項目がありません
              </div>
            ) : (
              <>
                {/* 進捗 */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">
                    {currentIndex + 1} / {filteredTips.length}
                  </span>
                  <button
                    onClick={shuffleCards}
                    className="flex items-center text-sm text-[#2b6ca3] hover:underline"
                  >
                    <Shuffle className="w-4 h-4 mr-1" />
                    シャッフル
                  </button>
                </div>

                {/* プログレスバー */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div
                    className="bg-[#2b6ca3] h-2 rounded-full transition-all"
                    style={{ width: `${((currentIndex + 1) / filteredTips.length) * 100}%` }}
                  />
                </div>

                {/* カード */}
                <div
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="bg-white border-2 border-[#2b6ca3] rounded-xl p-8 min-h-[250px] cursor-pointer hover:shadow-lg transition-shadow"
                >
                  {!showAnswer ? (
                    /* 表面: タイトルのみ */
                    <div className="flex flex-col items-center justify-center h-full">
                      <span className="bg-[#2b6ca3]/10 text-[#2b6ca3] px-3 py-1 rounded-full text-sm mb-4">
                        {currentTip?.category}
                      </span>
                      <h2 className="text-2xl font-bold text-[#2b6ca3] text-center mb-4">
                        {currentTip?.title}
                      </h2>
                      <p className="text-gray-500 text-sm">タップで答えを表示</p>
                    </div>
                  ) : (
                    /* 裏面: 内容 */
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#2b6ca3]/10 text-[#2b6ca3] px-3 py-1 rounded-full text-sm">
                          {currentTip?.category}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-[#2b6ca3]">
                        {currentTip?.title}
                      </h2>
                      <div className="bg-[#feec00]/20 p-4 rounded-lg">
                        <p className="text-gray-800 leading-relaxed">{currentTip?.content}</p>
                      </div>
                      {currentTip?.note && (
                        <p className="text-sm text-gray-600">{currentTip?.note}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* ナビゲーション */}
                <div className="flex justify-between mt-6">
                  <button
                    onClick={prevCard}
                    disabled={currentIndex === 0}
                    className={`flex items-center px-4 py-2 rounded-lg ${
                      currentIndex === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#2b6ca3] text-white hover:bg-[#3ab5cd]'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    前へ
                  </button>
                  <button
                    onClick={nextCard}
                    disabled={currentIndex === filteredTips.length - 1}
                    className={`flex items-center px-4 py-2 rounded-lg ${
                      currentIndex === filteredTips.length - 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#2b6ca3] text-white hover:bg-[#3ab5cd]'
                    }`}
                  >
                    次へ
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
