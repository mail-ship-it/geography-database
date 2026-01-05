import { Mail } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="container mx-auto px-4 py-6">
        <div className="flex justify-center items-center">
          <a
            href="https://forms.gle/8tNoBxyTx8WVeLfC7"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[#2b6ca3] hover:text-[#3ab5cd] transition-colors"
          >
            <Mail className="w-4 h-4" />
            お問い合わせ
          </a>
        </div>
      </div>
    </footer>
  )
}
