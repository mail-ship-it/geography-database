'use client'

import Link from 'next/link'
import { Calendar, Search, FileText, BarChart3 } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            🌏 共通テスト地理問題データベース
          </h1>
          <p className="text-xl opacity-90 mb-8">
            過去5年分の問題を効率的に学習できます
          </p>
          <div className="text-lg opacity-80">
            2021年〜2025年 | 本試験・追試験対応
          </div>
        </div>
      </div>

      {/* メイン選択画面 */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-8">
            表示方式を選択してください
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 年度ごとに表示 */}
            <Link href="/year">
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group">
                <div className="p-8 text-center">
                  <div className="bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                    <Calendar className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    年度ごとに表示
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    各年度の本試験・追試験の問題PDF、解答PDF、平均点を一覧で確認できます
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-center">
                      <FileText className="w-4 h-4 mr-2" />
                      問題・解答PDF
                    </div>
                    <div className="flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      平均点データ
                    </div>
                  </div>
                </div>
                <div className="bg-blue-600 text-white py-4 rounded-b-lg text-center font-medium group-hover:bg-blue-700 transition-colors">
                  年度別表示を開く →
                </div>
              </div>
            </Link>

            {/* 分野ごとに表示 */}
            <Link href="/category">
              <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer group">
                <div className="p-8 text-center">
                  <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                    <Search className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    分野ごとに表示
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    分野タグや年度で絞り込んで、個別の問題を詳細に確認・検索できます
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-center">
                      <Search className="w-4 h-4 mr-2" />
                      分野別検索
                    </div>
                    <div className="flex items-center justify-center">
                      <FileText className="w-4 h-4 mr-2" />
                      個別問題画像
                    </div>
                  </div>
                </div>
                <div className="bg-green-600 text-white py-4 rounded-b-lg text-center font-medium group-hover:bg-green-700 transition-colors">
                  分野別検索を開く →
                </div>
              </div>
            </Link>
          </div>

          {/* 統計情報 */}
          <div className="mt-12 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              データベース概要
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">5年分</div>
                <div className="text-sm text-gray-600">対象年度</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">10回分</div>
                <div className="text-sm text-gray-600">本試験・追試験</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">150問+</div>
                <div className="text-sm text-gray-600">総問題数</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">分野別</div>
                <div className="text-sm text-gray-600">タグ検索</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}