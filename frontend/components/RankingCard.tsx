'use client'

import { Ranking } from '@/lib/supabase'
import { Heart, Eye, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

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

// 커뮤니티별 폴백 스타일 (그라데이션 배경 + 텍스트)
const sourceFallback: Record<string, { bg: string; text: string; label: string }> = {
  dcinside: { bg: 'bg-gradient-to-br from-blue-600 to-blue-800', text: 'text-white', label: '디시인사이드' },
  ruliweb: { bg: 'bg-gradient-to-br from-green-600 to-green-800', text: 'text-white', label: '루리웹' },
  ppomppu: { bg: 'bg-gradient-to-br from-orange-500 to-orange-700', text: 'text-white', label: '뽐뿌' },
  inven: { bg: 'bg-gradient-to-br from-purple-600 to-purple-800', text: 'text-white', label: '인벤' },
}
const defaultFallback = { bg: 'bg-gradient-to-br from-gray-600 to-gray-800', text: 'text-white', label: 'PickTrend' }

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

// 플레이스홀더 이미지 - 더 이상 사용하지 않음 (색상 배경 폴백으로 대체)
// 유지 이유: 이전 버전 호환성
const placeholderImages: Record<string, string> = {
  politics: '',
  sports: '',
  celebrity: '',
  stock: '',
  game: '',
  issue: '',
}

// 이미지 URL을 프록시 URL로 변환 (Hotlinking 우회)
const getProxiedImageUrl = (url: string | null | undefined, fallback: string): string => {
  // null/undefined/빈 문자열이면 fallback 반환
  if (!url || url.trim() === '') {
    return fallback
  }
  // Unsplash는 직접 로딩 허용
  if (url.includes('unsplash.com')) {
    return url
  }
  // 이미 프록시 URL이면 그대로 반환
  if (url.startsWith('/api/image')) {
    return url
  }
  // 외부 이미지는 프록시 경유
  return `/api/image?url=${encodeURIComponent(url)}`
}

// 프록시 URL인지 확인
const isProxyUrl = (url: string): boolean => url.startsWith('/api/image')

export default function RankingCard({ ranking, rank, priority = false }: RankingCardProps & { priority?: boolean }) {
  const badge = categoryBadges[ranking.category] || categoryBadges.issue
  const tags = categoryTags[ranking.category] || categoryTags.issue

  // 출처 정보 추출 (폴백용)
  const sourceUrl = ranking.source_urls?.[0] || null
  const sourceName = ranking.source || (sourceUrl ? getSourceFromUrl(sourceUrl) : null)
  const fallbackStyle = sourceName ? sourceFallback[sourceName] : defaultFallback

  // 이미지 URL 우선순위: thumbnail_url > image_url > null (색상 폴백)
  const hasOriginalImage = !!(ranking.thumbnail_url || ranking.image_url)
  const primaryImageUrl = hasOriginalImage
    ? getProxiedImageUrl(ranking.thumbnail_url || ranking.image_url, '')
    : ''

  // 이미지 로드 실패 시 fallback
  const [imageUrl, setImageUrl] = useState(primaryImageUrl)
  const [imageError, setImageError] = useState(!hasOriginalImage)

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true)
      setImageUrl('') // 색상 폴백으로 전환
    }
  }

  // 유효한 이미지가 있는지 확인
  const hasValidImage = imageUrl && !imageError

  // 출처 정보 (라벨 표시용)
  const sourceInfo = sourceName ? sourceLabels[sourceName] : null

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k'
    }
    return num.toString()
  }

  // 상세 페이지 URL
  const detailUrl = `/issue/${encodeURIComponent(ranking.keyword)}`

  // 프록시 또는 외부 이미지인지 확인 (unoptimized 필요 여부)
  const needsUnoptimized = imageUrl.startsWith('http') || isProxyUrl(imageUrl)

  return (
    <article className="bg-bg-card rounded-3xl shadow-card card-hover overflow-hidden group">
      {/* 썸네일 이미지 - 상세 페이지로 연결 */}
      <Link href={detailUrl}>
        <div className="relative w-full aspect-[16/10] bg-gray-200 overflow-hidden cursor-pointer">
          {hasValidImage ? (
            <Image
              src={imageUrl}
              alt={ranking.keyword}
              width={400}
              height={250}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              unoptimized={needsUnoptimized}
              onError={handleImageError}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
              priority={priority}
            />
          ) : (
            /* 스마트 썸네일: 본문 100자 말풍선 디자인 */
            <div className={`w-full h-full ${fallbackStyle.bg} p-4 flex items-center justify-center transition-transform duration-300 group-hover:scale-105`}>
              {/* 말풍선 컨테이너 */}
              <div className="bg-white/95 dark:bg-gray-100 rounded-xl p-3 shadow-lg max-w-[90%] relative">
                {/* 말풍선 꼬리 */}
                <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white/95 dark:bg-gray-100 rotate-45"></div>

                {/* 본문 미리보기 텍스트 */}
                <p className="text-gray-800 text-sm leading-relaxed line-clamp-3">
                  "{(ranking.summary || ranking.keyword).slice(0, 100)}{(ranking.summary || ranking.keyword).length > 100 ? '...' : ''}"
                </p>

                {/* 출처 라벨 */}
                <span className="text-xs text-gray-500 mt-2 block text-right">
                  - {fallbackStyle.label}
                </span>
              </div>
            </div>
          )}
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
