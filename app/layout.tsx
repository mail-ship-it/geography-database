import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import Footer from "./components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "共通テスト地理データベース - 80点インプット",
  description: "共通テスト地理B（2016-2025年）の過去問を年度別・分野別で学習できるWebアプリ。頻出76カ国の暗記カード、100のコツなど、効率的な学習をサポートします。",
  keywords: ["共通テスト", "地理", "地理B", "過去問", "学習", "暗記", "データベース"],
  openGraph: {
    title: "共通テスト地理データベース - 80点インプット",
    description: "共通テスト地理Bの過去問10年分を効率的に学習できるWebアプリ",
    url: "https://geography-database.vercel.app",
    siteName: "共通テスト地理データベース",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "共通テスト地理データベース - 80点インプット",
    description: "共通テスト地理Bの過去問10年分を効率的に学習",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
