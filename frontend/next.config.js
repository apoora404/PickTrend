/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Unsplash (placeholder 이미지)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Supabase Storage
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      // 디시인사이드
      {
        protocol: 'https',
        hostname: 'dcimg1.dcinside.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'dcimg2.dcinside.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'dcimg3.dcinside.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'dcimg4.dcinside.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'dcimg5.dcinside.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'dcimg6.dcinside.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'dcimg7.dcinside.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'dcimg8.dcinside.co.kr',
      },
      {
        protocol: 'https',
        hostname: 'dcimg9.dcinside.co.kr',
      },
      // 루리웹
      {
        protocol: 'https',
        hostname: '*.ruliweb.com',
      },
      {
        protocol: 'http',
        hostname: '*.ruliweb.com',
      },
      // 뽐뿌
      {
        protocol: 'https',
        hostname: '*.ppomppu.co.kr',
      },
      {
        protocol: 'http',
        hostname: '*.ppomppu.co.kr',
      },
      // 인벤
      {
        protocol: 'https',
        hostname: '*.inven.co.kr',
      },
      {
        protocol: 'http',
        hostname: '*.inven.co.kr',
      },
      // 일반 HTTPS 이미지 (다양한 출처)
      {
        protocol: 'https',
        hostname: '**',
      },
      // HTTP 이미지 (fallback)
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
}

module.exports = nextConfig
