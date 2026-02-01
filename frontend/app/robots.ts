import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === 'production'

  if (!isProduction) {
    // Preview/Development 환경: 검색 엔진 차단
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    }
  }

  // Production 환경: 정상 색인 허용
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: 'https://picktrend.vercel.app/sitemap.xml',
  }
}
