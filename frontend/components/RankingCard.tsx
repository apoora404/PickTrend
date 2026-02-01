'use client'

import { Ranking } from '@/lib/supabase'
import { Heart, Eye, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface RankingCardProps {
  ranking: Ranking
  rank: number
}

// 출처별 라벨 및 색상
const sourceLabels: Record<string, { name: string; color: string }> = {
  dcinside: { name: '디시인사이드', color: 'text-blue-500' },
  ruliweb: { name: '루리웹', color: 'text-green-500' },
  ppomppu: { name: '뽐뿌', color: 'text-orange-500' },
  inven: { name: '인벤', color: 'text-purple-500' },
}

// URL에서 출처 추출
const getSourceFromUrl = (url: string): string | null => {
  if (url.includes('dcinside')) return 'dcinside'
  if (url.includes('ruliweb')) return 'ruliweb'
  if (url.includes('ppomppu')) return 'ppomppu'
  if (url.includes('inven')) return 'inven'
  return null
}

// 카테고리별 뱃지 색상
const categoryBadges: Record<string, { label: string; bgColor: string; textColor: string }> = {
  politics: { label: 'POLITICS', bgColor: 'bg-orange-500', textColor: 'text-white' },
  sports: { label: 'SPORTS', bgColor: 'bg-green-500', textColor: 'text-white' },
  celebrity: { label: 'ENTERTAINMENT', bgColor: 'bg-pink-500', textColor: 'text-white' },
  stock: { label: 'FINANCE', bgColor: 'bg-emerald-400', textColor: 'text-white' },
  game: { label: 'GAMING', bgColor: 'bg-indigo-500', textColor: 'text-white' },
  issue: { label: 'TRENDING', bgColor: 'bg-purple-500', textColor: 'text-white' },
}

// 카테고리별 태그
const categoryTags: Record<string, string[]> = {
  politics: ['#정치', '#뉴스', '#여론조사'],
  sports: ['#스포츠', '#축구'],
  celebrity: ['#연예', '#아이돌'],
  stock: ['#주식', '#경제'],
  game: ['#게임', '#e스포츠', '#스팀'],
  issue: ['#실시간', '#인기', '#트렌드'],
}

// 플레이스홀더 이미지
const placeholderImages: Record<string, string> = {
  politics: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=400&h=250&fit=crop',
  sports: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&h=250&fit=crop',
  celebrity: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop',
  stock: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
  game: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=250&fit=crop',
  issue: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&h=250&fit=crop',
}

export default function RankingCard({ ranking, rank }: RankingCardProps) {
  const badge = categoryBadges[ranking.category] || categoryBadges.general
  const tags = categoryTags[ranking.category] || categoryTags.general
  const imageUrl = ranking.image_url || placeholderImages[ranking.category] || placeholderImages.general

  // 출처 정보 추출
  const sourceUrl = ranking.source_urls?.[0] || null
  const sourceName = ranking.source || (sourceUrl ? getSourceFromUrl(sourceUrl) : null)
  const sourceInfo = sourceName ? sourceLabels[sourceName] : null

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  // 상세 페이지 URL
  const detailUrl = `/issue/${encodeURIComponent(ranking.keyword)}`

  return (
    <article className="bg-bg-card rounded-3xl shadow-card card-hover overflow-hidden group">
      {/* 썸네일 이미지 - 상세 페이지로 연결 */}
      <Link href={detailUrl}>
        <div className="relative w-full aspect-[16/10] bg-gray-200 overflow-hidden cursor-pointer">
          <img
            src={imageUrl}
            alt={ranking.keyword}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* 카테고리 뱃지 */}
          <span className={`absolute top-3 left-3 px-3 py-1 text-xs font-bold rounded-full ${badge.bgColor} ${badge.textColor}`}>
            {badge.label}
          </span>
        </div>
      </Link>

      {/* 컨텐츠 영역 */}
      <div className="p-4">
        {/* 출처 표시 */}
        {sourceInfo && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`text-xs font-medium ${sourceInfo.color}`}>
              {sourceInfo.name}
            </span>
          </div>
        )}

        {/* 제목 - 상세 페이지로 연결 */}
        <Link href={detailUrl} className="block">
          <h3 className="text-base lg:text-lg font-bold text-text-primary mb-2 leading-tight line-clamp-2 hover:text-primary transition-colors cursor-pointer">
            {ranking.keyword}
          </h3>
        </Link>

        {/* 요약문 - 상세 페이지로 연결 */}
        {ranking.summary && (
          <Link href={detailUrl} className="block">
            <p className="text-sm text-text-secondary line-clamp-3 mb-3 leading-relaxed cursor-pointer hover:text-text-primary transition-colors">
              {ranking.summary}
            </p>
          </Link>
        )}

        {/* 태그 */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 text-xs font-medium bg-tag-bg text-tag-text rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* 하단: 좋아요, 조회수, 버튼들 */}
        <div className="flex items-center justify-between pt-3 border-t border-border-light">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Heart className="w-4 h-4 text-primary" fill="#3B82F6" />
              <span className="text-sm font-medium">
                {formatNumber(ranking.popularity_score || 0)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary">
              <Eye className="w-4 h-4" />
              <span className="text-sm font-medium">
                {formatNumber((ranking.popularity_score || 0) * 10)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 상세 페이지 버튼 */}
            <Link
              href={detailUrl}
              className="px-3 py-1.5 text-sm font-semibold text-text-secondary border border-border-light rounded-full hover:border-primary hover:text-primary transition-colors"
            >
              자세히
            </Link>
            {/* 원문 보기 버튼 */}
            {sourceUrl && (
              <a
                href={sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-primary border border-primary rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                원문
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}
