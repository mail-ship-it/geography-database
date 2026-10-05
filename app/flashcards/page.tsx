'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Layers, RotateCcw, Check, X, LogOut, ArrowLeftRight, AlertCircle, Shuffle } from 'lucide-react'
import Header from '../components/Header'

type StudyCard = {
  id: string
  subject: string
  unit: string
  front: string
  back: string
  known: boolean
}

type Result = { cardId: string; correct: boolean }

const CODE_KEY = 'flashcard_code'

const shuffle = <T,>(items: T[]) => {
  const a = [...items]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function FlashcardsPage() {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [codeInput, setCodeInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<StudyCard[]>([])
  const [subject, setSubject] = useState('')

  // 学習中の状態
  const [queue, setQueue] = useState<StudyCard[] | null>(null)
  const [sessionTotal, setSessionTotal] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reversed, setReversed] = useState(true) // 既定は「説明 → 用語」
  const [results, setResults] = useState<Result[]>([])
  const [saving, setSaving] = useState(false)
  const [summary, setSummary] = useState<{ correct: number; total: number; missed: StudyCard[] } | null>(null)

  const loadCards = useCallback(async (studentCode: string) => {
    setLoading(true)
    try {
      const res = await fetch('/api/flashcards/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: studentCode }),
      })
      if (res.ok) {
        setCards(await res.json())
      } else {
        setError('カードを読み込めませんでした')
      }
    } catch {
      setError('カードを読み込めませんでした')
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (studentCode: string) => {
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/flashcards/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: studentCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'ログインに失敗しました')
        try { localStorage.removeItem(CODE_KEY) } catch {}
        setLoading(false)
        return
      }
      try { localStorage.setItem(CODE_KEY, data.code) } catch {}
      setCode(data.code)
      setName(data.name)
      await loadCards(data.code)
    } catch {
      setError('ログインに失敗しました')
      setLoading(false)
    }
  }, [loadCards])

  useEffect(() => {
    let saved: string | null = null
    try { saved = localStorage.getItem(CODE_KEY) } catch {}
    if (saved) {
      login(saved)
    } else {
      setLoading(false)
    }
  }, [login])

  const logout = () => {
    try { localStorage.removeItem(CODE_KEY) } catch {}
    setCode('')
    setName('')
    setCards([])
  }

  const subjects = useMemo(() => [...new Set(cards.map(c => c.subject))], [cards])
  const currentSubject = subjects.includes(subject) ? subject : subjects[0] || ''

  const units = useMemo(() => {
    const map = new Map<string, StudyCard[]>()
    cards.filter(c => c.subject === currentSubject).forEach(c => {
      map.set(c.unit, [...(map.get(c.unit) || []), c])
    })
    return [...map.entries()].map(([unit, unitCards]) => ({
      unit,
      cards: unitCards,
      known: unitCards.filter(c => c.known).length,
    }))
  }, [cards, currentSubject])

  const start = (sessionCards: StudyCard[]) => {
    if (sessionCards.length === 0) return
    setQueue(sessionCards)
    setSessionTotal(sessionCards.length)
    setResults([])
    setFlipped(false)
    setSummary(null)
  }

  const finish = async (finalResults: Result[]) => {
    setQueue(null)
    if (finalResults.length === 0) return
    const byId = new Map(cards.map(c => [c.id, c]))
    const missed = finalResults.filter(r => !r.correct).map(r => byId.get(r.cardId)).filter((c): c is StudyCard => !!c)
    setSummary({ correct: finalResults.length - missed.length, total: finalResults.length, missed })
    setSaving(true)
    try {
      const res = await fetch('/api/flashcards/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, results: finalResults }),
      })
      if (!res.ok) setError('学習記録の保存に失敗しました')
    } catch {
      setError('学習記録の保存に失敗しました')
    }
    setSaving(false)
    loadCards(code)
  }

  const answer = (correct: boolean) => {
    if (!queue) return
    const [current, ...rest] = queue
    const nextResults = [...results, { cardId: current.id, correct }]
    setResults(nextResults)
    setFlipped(false)
    // 全カードを1回ずつ見たら終了（覚えていないカードは結果画面から再挑戦できる）
    if (rest.length === 0) {
      finish(nextResults)
    } else {
      setQueue(rest)
    }
  }

  // ---------- ログイン画面 ----------
  if (!code) {
    return (
      <main className="min-h-screen bg-white">
        <Header title="単語カード" subtitle="学校プリントの重要語句" showBackLink />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-sm p-8">
            <div className="flex justify-center mb-6">
              <div className="bg-[#2b6ca3]/10 p-4 rounded-full">
                <Layers className="w-8 h-8 text-[#2b6ca3]" />
              </div>
            </div>
            <p className="text-sm text-gray-600 text-center mb-6">
              先生から受け取った生徒コードを入力してください
            </p>
            <form onSubmit={e => {
              e.preventDefault()
              // 全角英数字（日本語キーボード）も受け付ける
              login(codeInput.normalize('NFKC').replace(/\s/g, '').toUpperCase())
            }}>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
              <input
                value={codeInput}
                // 入力中に値を書き換えるとiPadで文字が重複入力されるため、大文字化は表示(CSS)と送信時のみ
                onChange={e => setCodeInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-[0.3em] font-mono uppercase focus:ring-2 focus:ring-[#2b6ca3] focus:border-transparent outline-none mb-6"
                placeholder="ABC234"
                maxLength={6}
                autoCapitalize="characters"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2b6ca3] text-white py-3 rounded-lg font-medium hover:bg-[#245a8a] transition disabled:opacity-50"
              >
                {loading ? '確認中...' : 'はじめる'}
              </button>
            </form>
          </div>
        </div>
      </main>
    )
  }

  // ---------- 学習画面 ----------
  if (queue) {
    const current = queue[0]
    const question = reversed ? current.back : current.front
    const answerText = reversed ? current.front : current.back
    const answered = results.length
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6 max-w-xl">
          <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
            <button onClick={() => finish(results)} className="hover:text-[#2b6ca3]">
              ← 中断して保存
            </button>
            <span>{current.unit}</span>
            <span>{Math.min(answered + 1, sessionTotal)} / {sessionTotal}</span>
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full mb-6 overflow-hidden">
            <div className="h-full bg-[#3ab5cd] transition-all" style={{ width: `${(answered / sessionTotal) * 100}%` }} />
          </div>

          <button
            onClick={() => setFlipped(f => !f)}
            className="w-full min-h-[320px] bg-white rounded-2xl shadow-md border border-gray-200 p-8 flex flex-col items-center justify-center text-center"
          >
            <div className="text-2xl md:text-3xl font-bold text-gray-800 break-words">{question}</div>
            {flipped ? (
              <div className="mt-6 pt-6 border-t border-gray-200 w-full text-lg text-gray-700 leading-relaxed whitespace-pre-wrap break-words">
                {answerText}
              </div>
            ) : (
              <div className="mt-8 text-sm text-gray-400">タップして答えを見る</div>
            )}
          </button>

          {flipped && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                onClick={() => answer(false)}
                className="flex items-center justify-center gap-2 bg-white border-2 border-[#e63278] text-[#e63278] py-4 rounded-xl font-bold hover:bg-[#e63278]/5"
              >
                <X className="w-5 h-5" /> 覚えていない
              </button>
              <button
                onClick={() => answer(true)}
                className="flex items-center justify-center gap-2 bg-[#2b6ca3] text-white py-4 rounded-xl font-bold hover:bg-[#245a8a]"
              >
                <Check className="w-5 h-5" /> 覚えた
              </button>
            </div>
          )}
        </div>
      </main>
    )
  }

  // ---------- 単元一覧 ----------
  return (
    <main className="min-h-screen bg-white">
      <Header title="単語カード" subtitle="学校プリントの重要語句" showBackLink />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-700"><span className="font-bold">{name}</span> さん</p>
          <div className="flex items-center gap-4 text-sm">
            <button
              onClick={() => setReversed(r => !r)}
              className="flex items-center gap-1 text-gray-600 hover:text-[#2b6ca3]"
            >
              <ArrowLeftRight className="w-4 h-4" />
              {reversed ? '説明 → 用語' : '用語 → 説明'}
            </button>
            <button onClick={logout} className="flex items-center gap-1 text-gray-500 hover:text-gray-800">
              <LogOut className="w-4 h-4" /> ログアウト
            </button>
          </div>
        </div>

        {summary && (
          <div className="bg-[#3ab5cd]/10 border border-[#3ab5cd]/30 rounded-lg p-4 mb-6 text-center">
            <p className="font-bold text-[#2b6ca3]">
              おつかれさま！ {summary.total}枚中 {summary.correct}枚を覚えた
            </p>
            {saving && <p className="text-sm text-gray-600 mt-1">記録を保存中...</p>}
            {summary.missed.length > 0 && (
              <button
                onClick={() => start(shuffle(summary.missed))}
                className="mt-3 bg-[#2b6ca3] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#245a8a]"
              >
                覚えていないカードをもう一度（{summary.missed.length}枚）
              </button>
            )}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {subjects.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {subjects.map(s => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  s === currentSubject ? 'bg-[#2b6ca3] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && cards.length === 0 ? (
          <p className="text-center text-gray-500 py-12">読み込み中...</p>
        ) : units.length === 0 ? (
          <p className="text-center text-gray-500 py-12">まだカードが登録されていません</p>
        ) : (
          <div className="space-y-4">
            {units.length > 1 && (() => {
              // 科目内の全単元を混ぜて出題
              const subjectCards = units.flatMap(u => u.cards)
              const known = subjectCards.filter(c => c.known).length
              const unknownCards = subjectCards.filter(c => !c.known)
              return (
                <div className="border-2 border-[#3ab5cd] bg-[#3ab5cd]/5 rounded-lg p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-lg font-bold text-gray-800">
                      <Shuffle className="w-5 h-5 inline -mt-1 mr-1 text-[#3ab5cd]" />
                      {currentSubject} 全単元ミックス
                    </h3>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      覚えた {known} / {subjectCards.length}
                    </span>
                  </div>
                  <div className="h-2 bg-white rounded-full mb-4 overflow-hidden">
                    <div className="h-full bg-[#3ab5cd]" style={{ width: `${(known / subjectCards.length) * 100}%` }} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => start(shuffle(unknownCards))}
                      disabled={unknownCards.length === 0}
                      className="bg-[#2b6ca3] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#245a8a] disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {unknownCards.length > 0 ? `未習得のカードだけ ${unknownCards.length}枚` : '全部覚えた！'}
                    </button>
                    <button
                      onClick={() => start(shuffle(subjectCards))}
                      className="flex items-center gap-1 text-[#2b6ca3] px-3 py-2 rounded-lg hover:bg-[#2b6ca3]/5"
                    >
                      <RotateCcw className="w-4 h-4" /> 全部 {subjectCards.length}枚
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">途中でやめても「中断して保存」でそこまでの結果が記録されます</p>
                </div>
              )
            })()}
            {units.map(u => {
              const unknownCards = u.cards.filter(c => !c.known)
              return (
                <div key={u.unit} className="border border-gray-200 rounded-lg p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h3 className="text-lg font-bold text-gray-800">{u.unit}</h3>
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      覚えた {u.known} / {u.cards.length}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full mb-4 overflow-hidden">
                    <div className="h-full bg-[#3ab5cd]" style={{ width: `${(u.known / u.cards.length) * 100}%` }} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => start(shuffle(unknownCards))}
                      disabled={unknownCards.length === 0}
                      className="bg-[#2b6ca3] text-white px-5 py-2 rounded-lg font-medium hover:bg-[#245a8a] disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      {unknownCards.length > 0 ? `未習得のカードだけ ${unknownCards.length}枚` : '全部覚えた！'}
                    </button>
                    <button
                      onClick={() => start(shuffle(u.cards))}
                      className="flex items-center gap-1 text-[#2b6ca3] px-3 py-2 rounded-lg hover:bg-[#2b6ca3]/5"
                    >
                      <RotateCcw className="w-4 h-4" /> 全部 {u.cards.length}枚
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
