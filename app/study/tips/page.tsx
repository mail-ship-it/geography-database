'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, Filter, ChevronRight, Lock } from 'lucide-react'
import Link from 'next/link'
import Header from '../../components/Header'

type TipStatus = 'learned' | 'pending' | 'review' | null

type Tip = {
  id: string
  category: string
  title: string
  content: string
  keywords: string
  relatedQuestions: string
  imageUrl: string
}

const STATUS_OPTIONS = [
  { value: 'learned', label: '覚えた', color: 'bg-green-100 text-green-800' },
  { value: 'pending', label: '保留', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'review', label: '見直す', color: 'bg-red-100 text-red-800' },
  { value: 'none', label: '未設定', color: 'bg-gray-100 text-gray-600' },
]

export default function TipsPage() {
  const [tips, setTips] = useState<Tip[]>([])
  const [filteredTips, setFilteredTips] = useState<Tip[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('全て')
  const [searchText, setSearchText] = useState('')
  const [tipStatuses, setTipStatuses] = useState<Record<string, TipStatus>>({})
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')

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

  // localStorageからステータスを読み込み
  useEffect(() => {
    const saved = localStorage.getItem('tip_statuses')
    if (saved) {
      try {
        setTipStatuses(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading tip statuses:', error)
      }
    }
  }, [])

  // 認証状態を確認
  useEffect(() => {
    const auth = sessionStorage.getItem('study_auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/auth/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsAuthenticated(true)
        sessionStorage.setItem('study_auth', 'true')
        setAuthError('')
        setPassword('')
      } else {
        setAuthError('パスワードが正しくありません')
        setPassword('')
      }
    } catch (error) {
      setAuthError('エラーが発生しました')
      setPassword('')
    }
  }

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
            {filteredTips.map((tip, index) => {
              // ステータス取得
              const status = tipStatuses[tip.id]
              const statusOption = STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS.find(opt => opt.value === 'none')
              const needsAuth = index >= 5 && !isAuthenticated

              return (
                <div key={tip.id} className="relative">
                  <Link
                    href={needsAuth ? '#' : `/study/tips/${tip.id}`}
                    onClick={needsAuth ? (e) => e.preventDefault() : undefined}
                    className={`block bg-white border border-gray-200 rounded-lg p-4 transition-all ${
                      needsAuth ? 'blur-sm pointer-events-none' : 'hover:shadow-md hover:border-[#3ab5cd]'
                    }`}
                  >
                  {/* スマホ: 2段構成 */}
                  <div className="md:hidden">
                    <div className="flex items-center gap-2 mb-2">
                      {/* 分野名 */}
                      <span className="bg-[#2b6ca3]/10 text-[#2b6ca3] px-2 py-1 rounded font-medium text-xs text-center flex-shrink-0 leading-tight whitespace-nowrap">
                        {tip.category}
                      </span>
                      {/* ステータス */}
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusOption?.color} flex-shrink-0`}>
                        {statusOption?.label}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-auto" />
                    </div>
                    {/* タイトル */}
                    <h3 className="font-medium text-gray-900 text-sm">{tip.title}</h3>
                  </div>

                  {/* タブレット以上: 従来通り */}
                  <div className="hidden md:flex items-center justify-between">
                    <div className="flex-1 flex items-center gap-3">
                      <span className="bg-[#2b6ca3]/10 text-[#2b6ca3] px-3 py-1 rounded text-sm font-medium w-32 text-center flex-shrink-0">
                        {tip.category}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusOption?.color}`}>
                        {statusOption?.label}
                      </span>
                      <h3 className="font-medium text-gray-900 text-base">{tip.title}</h3>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                  </div>
                  </Link>

                  {/* 認証オーバーレイ */}
                  {needsAuth && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/95 rounded-lg">
                      <div className="max-w-sm w-full mx-4">
                        <div className="bg-white border-2 border-[#2b6ca3] rounded-lg shadow-lg p-4">
                          <div className="flex justify-center mb-3">
                            <div className="bg-[#2b6ca3]/10 p-2 rounded-full">
                              <Lock className="w-5 h-5 text-[#2b6ca3]" />
                            </div>
                          </div>
                          <h3 className="text-lg font-bold text-center text-[#2b6ca3] mb-1">
                            会員限定コンテンツ
                          </h3>
                          <p className="text-center text-xs text-gray-600 mb-3">
                            6項目目以降は会員登録が必要です
                          </p>
                          <p className="text-center text-xs mb-3">
                            <a
                              href="https://note.com/chirijyuku/n/n0b0ccaee508c"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#2b6ca3] hover:text-[#3ab5cd] underline"
                            >
                              こちらから購入
                            </a>
                          </p>
                          <form onSubmit={handleAuth}>
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b6ca3] mb-2"
                              placeholder="パスワードを入力"
                            />
                            {authError && (
                              <p className="text-red-500 text-xs mb-2">{authError}</p>
                            )}
                            <button
                              type="submit"
                              className="w-full bg-[#2b6ca3] text-white py-1.5 rounded-lg hover:bg-[#3ab5cd] transition-colors text-sm font-medium"
                            >
                              ログイン
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
