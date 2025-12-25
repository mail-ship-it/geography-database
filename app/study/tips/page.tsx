'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Filter } from 'lucide-react'
import Header from '../../components/Header'

type Tip = {
  id: string
  category: string
  title: string
  content: string
  keywords: string
}

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([])
  const [filteredTips, setFilteredTips] = useState<Tip[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
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
  }, [tips, selectedCategory, searchText])

  return (
    <main className="min-h-screen bg-white">
      <Header subtitle="100のコツ" showBackLink backHref="/study" />

      <div className="container mx-auto px-4 py-6">
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
        ) : (
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
        )}
      </div>
    </main>
  )
}
