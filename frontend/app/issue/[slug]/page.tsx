import { ArrowLeft, ExternalLink, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface IssuePageProps {
  params: { slug: string }
}

export default function IssuePage({ params }: IssuePageProps) {
  // TODO: slug로 실제 데이터 조회
  const keyword = decodeURIComponent(params.slug)

  // 샘플 데이터
  const issue = {
    keyword,
    category: 'general',
    popularity_score: 12500,
    summary: '이 이슈에 대한 상세 요약입니다. 실제 구현 시 Supabase에서 데이터를 조회합니다.',
    source_urls: [
      { title: '에펨코리아 게시글 1', url: 'https://fmkorea.com' },
      { title: '디시인사이드 개념글', url: 'https://dcinside.com' },
      { title: '더쿠 핫게시판', url: 'https://theqoo.net' },
    ],
    updated_at: new Date().toISOString(),
  }

  return (
    <div className="space-y-6">
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
        <div className="flex items-center gap-2 mb-2 text-sm text-text-secondary">
          <span className="px-2 py-0.5 bg-bg-hover rounded text-xs">
            {issue.category}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp size={14} />
            {issue.popularity_score.toLocaleString()}점
          </span>
        </div>
        <h1 className="text-2xl font-bold text-text-primary">
          {issue.keyword}
        </h1>
        <div className="flex items-center gap-1 mt-2 text-xs text-text-secondary">
          <Clock size={12} />
          <span>업데이트: {new Date(issue.updated_at).toLocaleString('ko-KR')}</span>
        </div>
      </header>

      {/* 요약 */}
      <section className="bg-bg-card rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3">요약</h2>
        <p className="text-text-secondary leading-relaxed">
          {issue.summary}
        </p>
      </section>

      {/* 출처 */}
      <section className="bg-bg-card rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3">출처</h2>
        <ul className="space-y-2">
          {issue.source_urls.map((source, index) => (
            <li key={index}>
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-signal-positive hover:underline"
              >
                <ExternalLink size={14} />
                <span>{source.title}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {/* 푸터 */}
      <footer className="text-center text-xs text-text-secondary pt-4">
        <p>MemeBoard - 커뮤니티 인기글 분석 기반 순위</p>
      </footer>
    </div>
  )
}
