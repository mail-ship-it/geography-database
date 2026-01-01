'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Filter, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import Header from '../../components/Header'

type Tip = {
  id: string
  category: string
  title: string
  content: string
  keywords: string
  relatedQuestions: string
  imageUrl: string
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
          <div className="space-y-2">
            {filteredTips.map((tip) => (
              <Link
                key={tip.id}
                href={`/study/tips/${tip.id}`}
                className="block bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-[#3ab5cd] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="bg-[#2b6ca3]/10 text-[#2b6ca3] px-3 py-1 rounded text-sm font-medium min-w-[100px] text-center">
                        {tip.category}
                      </span>
                      <h3 className="font-medium text-gray-900">{tip.title}</h3>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
