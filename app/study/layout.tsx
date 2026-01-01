export default function StudyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // パスワード認証を一時的に無効化
  return <>{children}</>
}
