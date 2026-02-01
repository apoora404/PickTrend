import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '밈보드 - 실시간 밈/이슈 랭킹',
  description: '커뮤니티 인기글 분석 기반 실시간 밈/이슈 랭킹 서비스',
  keywords: ['밈', '이슈', '순위', '커뮤니티', '트렌드', '실시간'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FFFFFF',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
      </head>
      <body className="min-h-screen bg-bg-main antialiased">
        {children}
      </body>
    </html>
  )
}
