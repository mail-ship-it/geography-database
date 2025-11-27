'use client'

import Link from 'next/link'

type HeaderProps = {
  title?: string
  subtitle?: string
  showBackLink?: boolean
}

export default function Header({
  title = "共通テスト地理問題データベース",
  subtitle,
  showBackLink = false
}: HeaderProps) {
  return (
    <div className="relative">
      <div className="bg-[#3ab5cd] text-white pt-8 pb-12">
        <div className="container mx-auto px-4 text-center">
          {showBackLink && (
            <div className="mb-4">
              <Link
                href="/"
                className="text-white/80 hover:text-white transition-colors text-sm"
              >
                ← トップページに戻る
              </Link>
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-white/90">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {/* 波形ボーダー */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none translate-y-[1px]">
        <svg
          className="relative block w-full h-[30px]"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C57.1,118.92,156.63,69.08,321.39,56.44Z"
            fill="#ffffff"
          />
        </svg>
      </div>
    </div>
  )
}
