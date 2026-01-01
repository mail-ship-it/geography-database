'use client'

import Link from 'next/link'
import { Calendar, Search, FileText, BarChart3, Shuffle, BookOpen } from 'lucide-react'
import Header from './components/Header'

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Header subtitle="2016〜2025年の過去問を収録" />

      {/* メイン選択画面 */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-[#2b6ca3] mb-8">
            表示方式を選択してください
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
            {/* 年度ごとに表示 */}
            <Link href="/year" className="h-full">
              <div className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group h-full flex flex-col">
                <div className="p-8 text-center flex-1 flex flex-col">
                  <div className="bg-[#3ab5cd]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-[#3ab5cd]/20 transition-colors">
                    <Calendar className="w-10 h-10 text-[#3ab5cd]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#2b6ca3] mb-4">
                    年度ごとに表示
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed flex-1 min-h-[80px]">
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
                <div className="bg-[#3ab5cd] text-white py-4 rounded-b-lg text-center font-medium group-hover:bg-[#2b6ca3] transition-colors">
                  年度別表示を開く →
                </div>
              </div>
            </Link>

            {/* 分野ごとに表示 */}
            <Link href="/category" className="h-full">
              <div className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group h-full flex flex-col">
                <div className="p-8 text-center flex-1 flex flex-col">
                  <div className="bg-[#3ab5cd]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-[#3ab5cd]/20 transition-colors">
                    <Search className="w-10 h-10 text-[#3ab5cd]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#2b6ca3] mb-4">
                    分野ごとに表示
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed flex-1 min-h-[80px]">
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
                <div className="bg-[#3ab5cd] text-white py-4 rounded-b-lg text-center font-medium group-hover:bg-[#2b6ca3] transition-colors">
                  分野別検索を開く →
                </div>
              </div>
            </Link>

            {/* ランダム演習 */}
            <Link href="/practice" className="h-full">
              <div className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group h-full flex flex-col">
                <div className="p-8 text-center flex-1 flex flex-col">
                  <div className="bg-[#e63278]/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-[#e63278]/20 transition-colors">
                    <Shuffle className="w-10 h-10 text-[#e63278]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#2b6ca3] mb-4 whitespace-nowrap">
                    ランダム演習
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed flex-1 min-h-[80px]">
                    ランダムに出題される問題を解いて<br />実力を確認できます
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-center">
                      <Shuffle className="w-4 h-4 mr-2" />
                      ランダム出題
                    </div>
                    <div className="flex items-center justify-center">
                      <FileText className="w-4 h-4 mr-2" />
                      正答・解説表示
                    </div>
                  </div>
                </div>
                <div className="bg-[#e63278] text-white py-4 rounded-b-lg text-center font-medium group-hover:bg-[#2b6ca3] transition-colors">
                  演習を始める →
                </div>
              </div>
            </Link>

            {/* 80点突破インプット */}
            <Link href="/study" className="h-full">
              <div className="bg-white border border-[#e2e2e2] rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group h-full flex flex-col">
                <div className="p-8 text-center flex-1 flex flex-col">
                  <div className="bg-[#feec00]/30 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 group-hover:bg-[#feec00]/50 transition-colors">
                    <BookOpen className="w-10 h-10 text-[#2b6ca3]" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#2b6ca3] mb-4 whitespace-nowrap">
                    80点インプット
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed flex-1 min-h-[80px]">
                    頻出76カ国と100のコツで<br />80点突破の基礎を固めます
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <div className="flex items-center justify-center">
                      <BookOpen className="w-4 h-4 mr-2" />
                      頻出76カ国
                    </div>
                    <div className="flex items-center justify-center">
                      <FileText className="w-4 h-4 mr-2" />
                      100のコツ
                    </div>
                  </div>
                </div>
                <div className="bg-[#feec00] text-[#2b6ca3] py-4 rounded-b-lg text-center font-medium group-hover:bg-[#2b6ca3] group-hover:text-white transition-colors">
                  学習を始める →
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}