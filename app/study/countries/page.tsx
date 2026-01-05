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
  mapUrl: string
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
  const [mode, setMode] = useState<'list' | 'memorize'>('memorize')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [step, setStep] = useState(0)  // 0: 地図, 1: 国名, 2: 人口, 3: 所得, 4: 気候, 5: キーワード
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

    // デフォルトでシャッフル
    const shuffled = [...filtered].sort(() => Math.random() - 0.5)
    setFilteredCountries(shuffled)
    setCurrentIndex(0)
    setStep(0)
  }, [countries, selectedRegion, searchText])

  const shuffleCards = () => {
    const shuffled = [...filteredCountries].sort(() => Math.random() - 0.5)
    setFilteredCountries(shuffled)
    setCurrentIndex(0)
    setStep(0)
  }

  const nextCard = () => {
    if (currentIndex < filteredCountries.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setStep(0)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setStep(0)
    }
  }

  const nextStep = () => {
    if (step < 5) {
      setStep(step + 1)
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
            onClick={() => { setMode('memorize'); setStep(0); }}
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
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{country.region}</td>
                    <td className="px-4 py-3 text-gray-900">
                      {country.gdpLevel}<br />({country.gdpEstimate}ドル)
                    </td>
                    <td className="px-4 py-3 text-gray-900">
                      {country.populationLevel}<br />({country.populationEstimate}万人)
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
                  onClick={nextStep}
                  className="bg-white border-2 border-[#3ab5cd] rounded-xl p-8 min-h-[400px] cursor-pointer hover:shadow-lg transition-shadow flex flex-col items-center justify-center"
                >
                  {step === 0 && (
                    /* Step 0: 地図表示 + 国名は？ */
                    <div className="flex flex-col items-center justify-center h-full w-full">
                      {currentCountry?.mapUrl ? (
                        <img
                          src={currentCountry.mapUrl}
                          alt="国の位置"
                          className="max-w-full max-h-[300px] rounded-lg mb-4"
                        />
                      ) : (
                        <Globe className="w-24 h-24 text-[#3ab5cd] mb-4" />
                      )}
                      <div className="bg-[#3ab5cd]/10 border-2 border-[#3ab5cd] rounded-lg px-6 py-4 mt-6">
                        <p className="text-2xl font-bold text-[#2b6ca3]">国名は？</p>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    /* Step 1: 国名表示 + 人口規模は？ */
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <h2 className="text-4xl font-bold text-[#2b6ca3]">
                        {currentCountry?.name}
                      </h2>
                      <div className="bg-[#3ab5cd]/10 border-2 border-[#3ab5cd] rounded-lg px-6 py-4 mt-8">
                        <p className="text-2xl font-bold text-[#2b6ca3]">人口規模は？</p>
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    /* Step 2: 人口規模表示 + 所得レベルは？ */
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-[#2b6ca3] mb-2">
                          {currentCountry?.populationLevel}
                        </p>
                        <p className="text-xl text-gray-600">
                          ({currentCountry?.populationEstimate}万人)
                        </p>
                      </div>
                      <div className="bg-[#3ab5cd]/10 border-2 border-[#3ab5cd] rounded-lg px-6 py-4 mt-8">
                        <p className="text-2xl font-bold text-[#2b6ca3]">所得レベルは？</p>
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    /* Step 3: 所得レベル表示 + 気候は？ */
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-[#2b6ca3] mb-2">
                          {currentCountry?.gdpLevel}
                        </p>
                        <p className="text-xl text-gray-600">
                          ({currentCountry?.gdpEstimate}ドル)
                        </p>
                      </div>
                      <div className="bg-[#3ab5cd]/10 border-2 border-[#3ab5cd] rounded-lg px-6 py-4 mt-8">
                        <p className="text-2xl font-bold text-[#2b6ca3]">気候は？</p>
                      </div>
                    </div>
                  )}

                  {step === 4 && (
                    /* Step 4: 気候表示 + キーワードは？ */
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <p className="text-3xl font-bold text-[#2b6ca3]">
                        {currentCountry?.climate}
                      </p>
                      <div className="bg-[#3ab5cd]/10 border-2 border-[#3ab5cd] rounded-lg px-6 py-4 mt-8">
                        <p className="text-2xl font-bold text-[#2b6ca3]">キーワードは？</p>
                      </div>
                    </div>
                  )}

                  {step === 5 && (
                    /* Step 5: キーワード表示 */
                    <div className="flex flex-col items-center justify-center h-full space-y-4">
                      <p className="text-2xl font-bold text-[#2b6ca3] text-center px-4">
                        {currentCountry?.keywords}
                      </p>
                      <p className="text-gray-500 text-sm mt-6">次のカードへ進んでください</p>
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
