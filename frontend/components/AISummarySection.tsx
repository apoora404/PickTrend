'use client'

import { useState, useEffect } from 'react'
import { Sparkles, MessageCircle, Loader2, AlertCircle } from 'lucide-react'

interface AISummarySectionProps {
  keyword: string
  title: string
  sourceUrls: string[]
  initialSummary?: string | null
}

export default function AISummarySection({
  keyword,
  title,
  sourceUrls,
  initialSummary
}: AISummarySectionProps) {
  const [aiSummary, setAiSummary] = useState<string | null>(initialSummary || null)
  const [communityReaction, setCommunityReaction] = useState<string | null>(null)
  const [loading, setLoading] = useState(!initialSummary)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 이미 요약이 있으면 스킵
    if (initialSummary) {
      setLoading(false)
      return
    }

    const fetchSummary = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword,
            title,
            source_urls: sourceUrls
          })
        })

        if (!response.ok) {
          throw new Error('요약 생성에 실패했습니다')
        }

        const data = await response.json()
        setAiSummary(data.ai_summary)
        setCommunityReaction(data.community_reaction)
      } catch (err) {
        console.error('AI Summary error:', err)
        setError('AI 요약을 불러오는 중 오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [keyword, title, sourceUrls, initialSummary])

  // 로딩 상태
  if (loading) {
    return (
      <section className="bg-bg-card rounded-lg p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="animate-spin text-primary" size={20} />
          <span className="text-text-secondary">AI가 요약을 생성하고 있습니다...</span>
        </div>
      </section>
    )
  }

  // 에러 상태
  if (error) {
    return (
      <section className="bg-bg-card rounded-lg p-6">
        <div className="flex items-center gap-3 text-orange-500">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </section>
    )
  }

  return (
    <>
      {/* AI 핵심 요약 */}
      {aiSummary && (
        <section className="bg-bg-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Sparkles className="text-primary" size={20} />
            AI 핵심 요약
          </h2>
          <p className="text-text-secondary leading-relaxed whitespace-pre-line">
            {aiSummary}
          </p>
        </section>
      )}

      {/* 커뮤니티 반응 */}
      {communityReaction && (
        <section className="bg-bg-card rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <MessageCircle className="text-green-500" size={20} />
            커뮤니티 반응
          </h2>
          <p className="text-text-secondary leading-relaxed whitespace-pre-line">
            {communityReaction}
          </p>
        </section>
      )}
    </>
  )
}
