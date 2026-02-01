import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const metadata: Metadata = {
  title: 'PickTrend - 실시간 트렌드 랭킹',
  description: '커뮤니티 인기글 분석 기반 실시간 트렌드 랭킹 서비스',
  keywords: ['트렌드', '이슈', '순위', '커뮤니티', '밈', '실시간'],
  metadataBase: new URL('https://picktrend.vercel.app'),
  openGraph: {
    title: 'PickTrend - 실시간 트렌드 랭킹',
    description: '커뮤니티 인기글 분석 기반 실시간 트렌드 랭킹 서비스',
    url: 'https://picktrend.vercel.app',
    siteName: 'PickTrend',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PickTrend - 실시간 트렌드 랭킹',
    description: '커뮤니티 인기글 분석 기반 실시간 트렌드 랭킹 서비스',
  },
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
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_ID

  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
        />
        {/* Preview/Development 환경에서 검색 엔진 색인 차단 */}
        {process.env.VERCEL_ENV !== 'production' && (
          <meta name="robots" content="noindex, nofollow" />
        )}
        {/* Google AdSense - 승인 후 NEXT_PUBLIC_ADSENSE_ID 환경변수 설정 시 활성화 */}
        {adsenseId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </head>
      <body className="min-h-screen bg-bg-main antialiased">
        {children}
      </body>
    </html>
  )
}
