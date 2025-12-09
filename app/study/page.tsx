'use client'

import Link from 'next/link'
import { Globe, Lightbulb, Target } from 'lucide-react'
import Header from '../components/Header'

export default function StudyPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header subtitle="80点突破インプット" showBackLink />

      <div className="container mx-auto px-4 py-8">
        {/* 目標説明 */}
        <div className="bg-gradient-to-r from-[#2b6ca3] to-[#3ab5cd] text-white rounded-lg p-6 mb-8">
          <div className="flex items-center mb-3">
            <Target className="w-6 h-6 mr-2" />
            <h2 className="text-xl font-bold">共通テスト地理80点を目指す</h2>
          </div>
          <p className="text-white/90">
            頻出72カ国の基本情報と100の必須知識をマスターして、安定して80点以上を取れる実力をつけましょう。
          </p>
        </div>

        {/* メニュー */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 72カ国 */}
          <Link href="/study/countries" className="block">
            <div className="bg-white border-2 border-[#3ab5cd] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-[#3ab5cd]/10 p-3 rounded-full mr-4">
                  <Globe className="w-8 h-8 text-[#3ab5cd]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#2b6ca3]">頻出72カ国</h3>
                  <p className="text-sm text-gray-600">共通テストに出る国を完全網羅</p>
                </div>
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>・地域別に整理された国データ</li>
                <li>・GDP・人口・気候・産業の要点</li>
                <li>・試験で使えるストーリー</li>
              </ul>
              <div className="mt-4 text-[#3ab5cd] font-medium text-sm">
                学習を始める →
              </div>
            </div>
          </Link>

          {/* 100のコツ */}
          <Link href="/study/tips" className="block">
            <div className="bg-white border-2 border-[#2b6ca3] rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center mb-4">
                <div className="bg-[#2b6ca3]/10 p-3 rounded-full mr-4">
                  <Lightbulb className="w-8 h-8 text-[#2b6ca3]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#2b6ca3]">100のコツ</h3>
                  <p className="text-sm text-gray-600">得点に直結する必須知識</p>
                </div>
              </div>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>・分野別に整理された重要ポイント</li>
                <li>・覚えるべき数値・用語</li>
                <li>・よく出るパターンの攻略法</li>
              </ul>
              <div className="mt-4 text-[#2b6ca3] font-medium text-sm">
                学習を始める →
              </div>
            </div>
          </Link>
        </div>
      </div>
    </main>
  )
}
