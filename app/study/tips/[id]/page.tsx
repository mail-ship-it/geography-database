'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Lightbulb, Tag, FileText } from 'lucide-react'
import Header from '../../../components/Header'

type Tip = {
  id: string
  category: string
  title: string
  content: string
  keywords: string
  relatedQuestions: string
  imageUrl: string
}

export default function TipDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [tip, setTip] = useState<Tip | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTip = async () => {
      try {
        const response = await fetch(`/api/study/tips/${id}`)
        if (response.ok) {
          const data = await response.json()
          setTip(data)
        }
      } catch (error) {
        console.error('Error fetching tip:', error)
      }
      setLoading(false)
    }
    fetchTip()
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

        {/* 画像 */}
        {tip.imageUrl && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
            <img
              src={tip.imageUrl}
              alt={tip.title}
              className="max-w-full rounded-lg mx-auto"
            />
          </div>
        )}

        {/* キーワード */}
        {tip.keywords && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-[#2b6ca3]" />
              <h2 className="font-bold text-gray-900">キーワード</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {tip.keywords.split(',').map((kw, i) => (
                <span
                  key={i}
                  className="bg-[#3ab5cd]/10 text-[#2b6ca3] px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  {kw.trim()}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 関連問題 */}
        {tip.relatedQuestions && (
          <div className="bg-[#feec00]/20 border border-[#feec00]/50 rounded-lg p-6">
            <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-lg">📝</span>
              関連問題
            </h2>
            <div className="flex flex-wrap gap-2">
              {tip.relatedQuestions.split(',').map((q, i) => (
                <span
                  key={i}
                  className="bg-white border border-gray-300 text-gray-900 px-3 py-1.5 rounded-md text-sm font-medium"
                >
                  {q.trim()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
