'use client'

import { useState, useEffect } from 'react'
import { Sparkles, MessageSquare, RefreshCw } from 'lucide-react'

interface AISummarySectionProps {
  keyword: string
  title?: string
  sourceUrls: string[]
  initialSummary?: string | null
  initialAiSummary?: string | null
  initialCommunityReaction?: string | null
}

export default function AISummarySection({
  keyword,
  title,
  sourceUrls,
  initialSummary,
  initialAiSummary,
  initialCommunityReaction
}: AISummarySectionProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(initialAiSummary || null)
  const [communityReaction, setCommunityReaction] = useState<string | null>(initialCommunityReaction || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 캐시된 요약이 없으면 자동으로 생성
  useEffect(() => {
    if (!initialAiSummary && sourceUrls?.length > 0) {
      fetchSummary()
    }
  }, [keyword])

  const fetchSummary = async (forceRefresh = false) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          title: title || keyword,
          source_urls: sourceUrls,
          force_refresh: forceRefresh
        })
      })

      if (!response.ok) {
        throw new Error('AI 요약 생성에 실패했습니다')
      }

      const data = await response.json()
      setAiSummary(data.ai_summary)
      setCommunityReaction(data.community_reaction)
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <section className="bg-bg-card rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-primary rounded-full"></span>
          <Sparkles size={18} className="text-yellow-500" />
          AI 요약
        </h2>
        <div className="flex items-center gap-3 text-text-secondary">
          <div className="animate-spin">
            <RefreshCw size={20} />
          </div>
          <span>AI가 원문을 분석하고 있습니다...</span>
        </div>
      </section>
    )
  }

  // 에러 상태
  if (error && !aiSummary) {
    return (
      <section className="bg-bg-card rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <span className="w-1 h-5 bg-primary rounded-full"></span>
          AI 요약
        </h2>
        <p className="text-text-secondary leading-relaxed">
          {initialSummary || '이 이슈에 대한 요약 정보가 준비 중입니다.'}
        </p>
      </section>
    )
  }

  return (
    <>
      {/* AI 요약 섹션 */}
      <section className="bg-bg-card rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            <Sparkles size={18} className="text-yellow-500" />
            AI 요약
          </h2>
          {aiSummary && (
            <button
              onClick={() => fetchSummary(true)}
              disabled={loading}
              className="text-xs text-text-secondary hover:text-primary flex items-center gap-1 transition-colors"
              title="요약 새로고침"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              새로고침
            </button>
          )}
        </div>

        {aiSummary ? (
          <div className="space-y-2">
            {aiSummary.split('\n').filter(line => line.trim()).map((line, index) => (
              <p key={index} className="text-text-secondary leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-text-secondary leading-relaxed">
            {initialSummary || '이 이슈에 대한 요약 정보가 준비 중입니다.'}
          </p>
        )}
      </section>

      {/* 커뮤니티 반응 섹션 */}
      {communityReaction && (
        <section className="bg-bg-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <span className="w-1 h-5 bg-orange-500 rounded-full"></span>
            <MessageSquare size={18} className="text-orange-500" />
            커뮤니티 반응
          </h2>
          <div className="bg-bg-main rounded-lg p-4 border-l-4 border-orange-500">
            {communityReaction.split('\n').filter(line => line.trim()).map((line, index) => (
              <p key={index} className="text-text-secondary leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        </section>
      )}
    </>
  )
}
