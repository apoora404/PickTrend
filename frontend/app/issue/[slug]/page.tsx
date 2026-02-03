import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Clock, TrendingUp, Flame } from 'lucide-react'
import Link from 'next/link'
import { getRankingByKeyword, getRelatedRankings, Ranking } from '@/lib/supabase'
import AdSlot from '@/components/AdSlot'
import AISummarySection from './AISummarySection'
import BestCommentsSection from './BestCommentsSection'
import ShareButton from '@/components/ShareButton'

interface IssuePageProps {
  params: { slug: string }
}

// 카테고리 한글 매핑
const categoryLabels: Record<string, string> = {
  politics: '정치',
  sports: '스포츠',
  celebrity: '연예',
  stock: '경제',
  game: '게임',
  issue: '이슈',
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: IssuePageProps): Promise<Metadata> {
  const keyword = decodeURIComponent(params.slug)
  const ranking = await getRankingByKeyword(keyword)

  if (!ranking) {
    return {
      title: '찾을 수 없는 이슈 - 밈보드',
      description: '요청하신 이슈를 찾을 수 없습니다.',
    }
  }

  const title = `${ranking.keyword} - 밈보드`
  const description = ranking.summary || `${ranking.keyword}에 대한 실시간 트렌드 정보`
  const categoryLabel = categoryLabels[ranking.category] || '이슈'

  return {
    title,
    description,
    keywords: [ranking.keyword, categoryLabel, '밈보드', '트렌드', '실시간'],
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: '밈보드',
      locale: 'ko_KR',
      url: `https://memeboard.vercel.app/issue/${encodeURIComponent(ranking.keyword)}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    alternates: {
      canonical: `https://memeboard.vercel.app/issue/${encodeURIComponent(ranking.keyword)}`,
    },
  }
}

// JSON-LD 구조화 데이터
function generateJsonLd(ranking: Ranking) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: ranking.keyword,
    description: ranking.summary || `${ranking.keyword}에 대한 실시간 트렌드 정보`,
    datePublished: ranking.created_at,
    dateModified: ranking.updated_at,
    publisher: {
      '@type': 'Organization',
      name: '밈보드',
      url: 'https://memeboard.vercel.app',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://memeboard.vercel.app/issue/${encodeURIComponent(ranking.keyword)}`,
    },
  }
}

export default async function IssuePage({ params }: IssuePageProps) {
  const keyword = decodeURIComponent(params.slug)
  const ranking = await getRankingByKeyword(keyword)

  if (!ranking) {
    notFound()
  }

  // 관련 이슈 조회
  const relatedRankings = await getRelatedRankings(ranking.category, ranking.keyword, 5)

  const categoryLabel = categoryLabels[ranking.category] || '이슈'
  const jsonLd = generateJsonLd(ranking)

  return (
    <>
      {/* JSON-LD 구조화 데이터 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* 뒤로가기 */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          <span>목록으로</span>
        </Link>

        {/* 헤더 */}
        <header className="bg-bg-card rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3 text-sm text-text-secondary">
            <span className="px-3 py-1 bg-primary text-white rounded-full text-xs font-medium">
              {categoryLabel}
            </span>
            <span className="flex items-center gap-1">
              <Flame size={14} className="text-orange-500" />
              <span className="font-medium">{ranking.popularity_score?.toLocaleString() || 0}점</span>
            </span>
            {ranking.rank_change > 0 && (
              <span className="flex items-center gap-1 text-green-500">
                <TrendingUp size={14} />
                +{ranking.rank_change}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {ranking.keyword}
          </h1>
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              업데이트: {new Date(ranking.updated_at).toLocaleString('ko-KR')}
            </span>
          </div>
        </header>

        {/* 베스트 댓글 (최상단 - DB에서 직접 가져옴, API 무관) */}
        <BestCommentsSection comments={ranking.best_comments} />

        {/* 상단 광고 */}
        <AdSlot position="top" slot="issue-top" />

        {/* AI 요약 + 커뮤니티 반응 (클라이언트 컴포넌트) */}
        <AISummarySection
          keyword={ranking.keyword}
          title={ranking.keyword}
          sourceUrls={ranking.source_urls || []}
          initialSummary={ranking.summary}
          initialAiSummary={ranking.ai_summary}
          initialCommunityReaction={ranking.community_reaction}
        />

        {/* 트렌드 지표 */}
        <section className="bg-bg-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            트렌드 지표
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-bg-main rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {ranking.popularity_score?.toLocaleString() || 0}
              </div>
              <div className="text-xs text-text-secondary mt-1">인기 점수</div>
            </div>
            <div className="text-center p-4 bg-bg-main rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {ranking.source_urls?.length || 0}
              </div>
              <div className="text-xs text-text-secondary mt-1">관련 게시글</div>
            </div>
            <div className="text-center p-4 bg-bg-main rounded-lg">
              <div className="text-2xl font-bold text-orange-500">
                {ranking.rank_change > 0 ? `+${ranking.rank_change}` : ranking.rank_change || '-'}
              </div>
              <div className="text-xs text-text-secondary mt-1">순위 변동</div>
            </div>
          </div>
        </section>

        {/* 출처 목록 */}
        <section className="bg-bg-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            원문 출처
          </h2>
          {ranking.source_urls && ranking.source_urls.length > 0 ? (
            <ul className="space-y-3">
              {ranking.source_urls.map((url, index) => {
                const sourceName = getSourceName(url)
                return (
                  <li key={index}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-bg-main rounded-lg hover:bg-bg-hover transition-colors"
                    >
                      <ExternalLink size={16} className="text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-text-primary truncate block">
                          {sourceName} 원문 #{index + 1}
                        </span>
                        <span className="text-xs text-text-secondary truncate block">
                          {url}
                        </span>
                      </div>
                    </a>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-text-secondary text-sm">출처 정보가 없습니다.</p>
          )}
        </section>

        {/* 관련 이슈 */}
        {relatedRankings.length > 0 && (
          <section className="bg-bg-card rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-primary rounded-full"></span>
              {ranking.category === 'issue' ? '관련 이슈' : `관련 ${categoryLabel} 이슈`}
            </h2>
            <div className="space-y-2">
              {relatedRankings.map((related) => (
                <Link
                  key={related.id}
                  href={`/issue/${encodeURIComponent(related.keyword)}`}
                  className="flex items-center justify-between p-3 bg-bg-main rounded-lg hover:bg-bg-hover transition-colors"
                >
                  <span className="text-sm text-text-primary font-medium truncate">
                    {related.keyword}
                  </span>
                  <span className="text-xs text-text-secondary flex-shrink-0 ml-2">
                    {related.popularity_score?.toLocaleString() || 0}점
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 하단 광고 (관련 이슈 바로 다음) */}
        <AdSlot position="bottom" slot="issue-bottom" />

        {/* 공유 버튼 */}
        <div className="flex justify-center">
          <ShareButton title={ranking.keyword} text={ranking.summary || ''} />
        </div>

        {/* 푸터 */}
        <footer className="text-center text-xs text-text-secondary pt-4 border-t border-border-light">
          <p>MemeBoard - 커뮤니티 인기글 분석 기반 실시간 트렌드</p>
        </footer>
      </div>
    </>
  )
}

// URL에서 출처 이름 추출
function getSourceName(url: string): string {
  if (url.includes('dcinside')) return '디시인사이드'
  if (url.includes('ruliweb')) return '루리웹'
  if (url.includes('ppomppu')) return '뽐뿌'
  if (url.includes('inven')) return '인벤'
  if (url.includes('fmkorea')) return '에펨코리아'
  if (url.includes('theqoo')) return '더쿠'
  return '커뮤니티'
}
