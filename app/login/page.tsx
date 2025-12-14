'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/Header'

function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnTo = searchParams.get('returnTo') || '/study'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const success = await login(password)

    if (success) {
      router.push(returnTo)
    } else {
      setError('パスワードが正しくありません')
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">
      <Header subtitle="会員ログイン" showBackLink />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-[#2b6ca3]/10 p-4 rounded-full">
                <Lock className="w-8 h-8 text-[#2b6ca3]" />
              </div>
            </div>

            <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
              会員専用コンテンツ
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              学習コンテンツを閲覧するにはパスワードを入力してください
            </p>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2b6ca3] focus:border-transparent outline-none transition"
                  placeholder="パスワードを入力"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#2b6ca3] text-white py-3 rounded-lg font-medium hover:bg-[#245a8a] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'ログイン中...' : 'ログイン'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-gray-500">読み込み中...</div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  )
}
