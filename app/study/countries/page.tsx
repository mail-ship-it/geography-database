'use client'

import { useState, useEffect } from 'react'
import { Globe, List, Brain, ChevronLeft, ChevronRight, Shuffle, Filter } from 'lucide-react'
import Header from '../../components/Header'

type Country = {
  id: string
  name: string
  region: string
  gdpLevel: string
  gdpEstimate: string
  populationLevel: string
  populationEstimate: string
  climate: string
  keywords: string
  description: string
}

const REGIONS = [
  '全て',
  'ヨーロッパ',
  'アジア',
  'アフリカ',
  '北アメリカ',
  '南アメリカ',
  'オセアニア',
]

export default function CountriesPage() {
  const [countries, setCountries] = useState<Country[]>([])
  const [filteredCountries, setFilteredCountries] = useState<Country[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'list' | 'memorize'>('list')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState('全て')
  const [searchText, setSearchText] = useState('')

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const response = await fetch('/api/study/countries')
        const data = await response.json()
        if (Array.isArray(data)) {
          setCountries(data)
          setFilteredCountries(data)
        }
      } catch (error) {
        console.error('Error fetching countries:', error)
      }
      setLoading(false)
    }
    fetchCountries()
  }, [])

  useEffect(() => {
    let filtered = countries

    if (selectedRegion !== '全て') {
      filtered = filtered.filter(c => c.region === selectedRegion)
    }

    if (searchText) {
      const lower = searchText.toLowerCase()
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(lower) ||
        c.keywords.toLowerCase().includes(lower) ||
        c.description.toLowerCase().includes(lower)
      )
    }

    setFilteredCountries(filtered)
    setCurrentIndex(0)
    setShowAnswer(false)
  }, [countries, selectedRegion, searchText])

  const shuffleCards = () => {
    const shuffled = [...filteredCountries].sort(() => Math.random() - 0.5)
    setFilteredCountries(shuffled)
    setCurrentIndex(0)
    setShowAnswer(false)
  }

  const nextCard = () => {
    if (currentIndex < filteredCountries.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setShowAnswer(false)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setShowAnswer(false)
    }
  }

  const currentCountry = filteredCountries[currentIndex]

  return (
    <main className="min-h-screen bg-white">
      <Header subtitle="頻出76カ国" showBackLink backHref="/study" />

      <div className="container mx-auto px-4 py-6">
        {/* モード切り替え */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('list')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'list'
                ? 'bg-[#3ab5cd] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List className="w-4 h-4 mr-2" />
            一覧モード
          </button>
          <button
            onClick={() => { setMode('memorize'); setShowAnswer(false); }}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              mode === 'memorize'
                ? 'bg-[#3ab5cd] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Brain className="w-4 h-4 mr-2" />
            暗記モード
          </button>
        </div>

        {/* フィルター */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab5cd]"
              >
                {REGIONS.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
            <input
              type="text"
              placeholder="国名・キーワードで検索"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="flex-1 min-w-[200px] px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#3ab5cd]"
            />
            <div className="text-sm text-gray-600 flex items-center">
              {filteredCountries.length}カ国
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3ab5cd] mx-auto"></div>
            <p className="mt-4 text-gray-600">読み込み中...</p>
          </div>
        ) : mode === 'list' ? (
          /* 一覧モード */
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#2b6ca3] text-white">
                  <th className="px-4 py-3 text-left font-medium">国名</th>
                  <th className="px-4 py-3 text-left font-medium">地域</th>
                  <th className="px-4 py-3 text-left font-medium">GDP</th>
                  <th className="px-4 py-3 text-left font-medium">人口</th>
                  <th className="px-4 py-3 text-left font-medium">気候</th>
                  <th className="px-4 py-3 text-left font-medium hidden md:table-cell">キーワード</th>
                </tr>
              </thead>
              <tbody>
                {filteredCountries.map((country, index) => (
                  <tr
                    key={country.id}
                    className={`border-b border-gray-200 hover:bg-[#3ab5cd]/10 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-3 font-medium text-[#2b6ca3]">{country.name}</td>
                    <td className="px-4 py-3 text-gray-900">{country.region}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {country.gdpLevel} ({country.gdpEstimate}ドル)
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {country.populationLevel} ({country.populationEstimate}万人)
                    </td>
                    <td className="px-4 py-3 text-gray-900">{country.climate}</td>
                    <td className="px-4 py-3 text-gray-900 hidden md:table-cell">{country.keywords}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* 暗記モード */
          <div className="max-w-2xl mx-auto">
            {filteredCountries.length === 0 ? (
              <div className="text-center py-12 text-gray-600">
                該当する国がありません
              </div>
            ) : (
              <>
                {/* 進捗 */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-600">
                    {currentIndex + 1} / {filteredCountries.length}
                  </span>
                  <button
                    onClick={shuffleCards}
                    className="flex items-center text-sm text-[#3ab5cd] hover:underline"
                  >
                    <Shuffle className="w-4 h-4 mr-1" />
                    シャッフル
                  </button>
                </div>

                {/* プログレスバー */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                  <div
                    className="bg-[#3ab5cd] h-2 rounded-full transition-all"
                    style={{ width: `${((currentIndex + 1) / filteredCountries.length) * 100}%` }}
                  />
                </div>

                {/* カード */}
                <div
                  onClick={() => setShowAnswer(!showAnswer)}
                  className="bg-white border-2 border-[#3ab5cd] rounded-xl p-8 min-h-[300px] cursor-pointer hover:shadow-lg transition-shadow"
                >
                  {!showAnswer ? (
                    /* 表面: 国名のみ */
                    <div className="flex flex-col items-center justify-center h-full">
                      <Globe className="w-12 h-12 text-[#3ab5cd] mb-4" />
                      <h2 className="text-3xl font-bold text-[#2b6ca3] mb-2">
                        {currentCountry?.name}
                      </h2>
                      <p className="text-gray-500 text-sm">タップで詳細を表示</p>
                    </div>
                  ) : (
                    /* 裏面: 詳細情報 */
                    <div className="space-y-3">
                      <h2 className="text-2xl font-bold text-[#2b6ca3] border-b pb-2">
                        {currentCountry?.name}
                      </h2>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-700">地域:</span>
                          <span className="ml-2 font-medium text-gray-900">{currentCountry?.region}</span>
                        </div>
                        <div>
                          <span className="text-gray-700">気候:</span>
                          <span className="ml-2 font-medium text-gray-900">{currentCountry?.climate}</span>
                        </div>
                        <div>
                          <span className="text-gray-700">GDP:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {currentCountry?.gdpLevel} ({currentCountry?.gdpEstimate}ドル)
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-700">人口:</span>
                          <span className="ml-2 font-medium text-gray-900">
                            {currentCountry?.populationLevel} ({currentCountry?.populationEstimate}万人)
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-700 text-sm">キーワード:</span>
                        <p className="font-medium text-gray-900">{currentCountry?.keywords}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* ナビゲーション */}
                <div className="flex justify-between mt-6">
                  <button
                    onClick={prevCard}
                    disabled={currentIndex === 0}
                    className={`flex items-center px-4 py-2 rounded-lg ${
                      currentIndex === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#2b6ca3] text-white hover:bg-[#3ab5cd]'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" />
                    前へ
                  </button>
                  <button
                    onClick={nextCard}
                    disabled={currentIndex === filteredCountries.length - 1}
                    className={`flex items-center px-4 py-2 rounded-lg ${
                      currentIndex === filteredCountries.length - 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-[#2b6ca3] text-white hover:bg-[#3ab5cd]'
                    }`}
                  >
                    次へ
                    <ChevronRight className="w-5 h-5 ml-1" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  )
}
