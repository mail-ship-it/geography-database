'use client'

import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'

export default function StudyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // セッションストレージから認証状態を確認
    const auth = sessionStorage.getItem('study_auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
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
        setError('')
      } else {
        setError('パスワードが正しくありません')
        setPassword('')
      }
    } catch (error) {
      setError('エラーが発生しました')
      setPassword('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2b6ca3]"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-[#2b6ca3]/10 p-4 rounded-full">
                <Lock className="w-8 h-8 text-[#2b6ca3]" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center text-[#2b6ca3] mb-2">
              80点インプット
            </h1>
            <p className="text-center text-gray-600 mb-6">
              このコンテンツは会員限定です
            </p>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2b6ca3] focus:border-transparent"
                  placeholder="パスワードを入力"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm mb-4">{error}</p>
              )}
              <button
                type="submit"
                className="w-full bg-[#2b6ca3] text-white py-2 rounded-lg hover:bg-[#3ab5cd] transition-colors font-medium"
              >
                ログイン
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
