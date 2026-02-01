'use client'

import { useState, useEffect, useCallback } from 'react'
import { Category, Ranking, TimeRange, getRankings } from '@/lib/supabase'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import CategoryFilter from '@/components/CategoryFilter'
import RankingCard from '@/components/RankingCard'
import BottomTabBar from '@/components/BottomTabBar'
import FloatingButton from '@/components/FloatingButton'
import TimeFilter from '@/components/TimeFilter'
import AdSlot from '@/components/AdSlot'
import { ChevronDown, RefreshCw, AlertCircle } from 'lucide-react'

// 카드 리스트에 광고 삽입 헬퍼 함수
function insertAdsIntoList(
  rankings: Ranking[],
  renderCard: (ranking: Ranking, index: number) => React.ReactNode,
  adInterval: number = 5  // 5개마다 광고 삽입
): React.ReactNode[] {
  const result: React.ReactNode[] = []

  rankings.forEach((ranking, index) => {
    result.push(renderCard(ranking, index))

    // 매 adInterval개 후에 광고 삽입 (마지막 아이템 제외)
    if ((index + 1) % adInterval === 0 && index < rankings.length - 1) {
      result.push(
        <AdSlot
          key={`ad-inline-${index}`}
          position="inline"
          slot={`main-inline-${Math.floor(index / adInterval)}`}
          className="col-span-1 md:col-span-2 xl:col-span-3"
        />
      )
    }
  })

  return result
}

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [rankings, setRankings] = useState<Ranking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'mobile' | 'desktop'>('desktop')
  const [sortBy, setSortBy] = useState<'popular' | 'latest'>('popular')
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('24h')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // localStorage에서 설정 불러오기
  useEffect(() => {
    const savedCategory = localStorage.getItem('memeboard_category')
    const savedViewMode = localStorage.getItem('memeboard_viewMode')

    if (savedCategory && savedCategory !== 'null') {
      setSelectedCategory(savedCategory as Category)
    }
    if (savedViewMode) {
      setViewMode(savedViewMode as 'mobile' | 'desktop')
    }
  }, [])

  // 설정 변경 시 localStorage 저장
  useEffect(() => {
    localStorage.setItem('memeboard_category', selectedCategory || 'null')
  }, [selectedCategory])

  useEffect(() => {
    localStorage.setItem('memeboard_viewMode', viewMode)
  }, [viewMode])

  // 뷰 모드 전환
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'mobile' ? 'desktop' : 'mobile')
  }

  // 데이터 로드
  const loadRankings = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const data = await getRankings(selectedCategory ?? undefined, 30, selectedTimeRange)
      setRankings(data)
      setLastUpdated(new Date())

      if (data.length === 0) {
        console.log('No data from Supabase, using fallback')
      }
    } catch (err) {
      console.error('Failed to load rankings:', err)
      setError('데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }, [selectedCategory, selectedTimeRange])

  useEffect(() => {
    loadRankings()
  }, [loadRankings])

  // 자동 새로고침 (5분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      loadRankings()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [loadRankings])

  // 폴백용 샘플 데이터 (DB에 데이터가 없을 때만 사용)
  const fallbackRankings: Ranking[] = [
    {
      id: 'sample-1',
      keyword: '데이터를 수집 중입니다',
      category: 'issue',
      popularity_score: 0,
      summary: '백엔드에서 크롤링을 실행하면 이곳에 실시간 트렌드가 표시됩니다. python main.py --classify --save 명령으로 데이터를 수집해주세요.',
      source_urls: [],
      rank_change: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  // 실제 데이터가 없으면 폴백 사용
  const displayRankings = rankings.length > 0 ? rankings : fallbackRankings
  const isUsingFallback = rankings.length === 0

  // 정렬 적용
  const sortedRankings = [...displayRankings].sort((a, b) => {
    if (sortBy === 'popular') {
      return (b.popularity_score || 0) - (a.popularity_score || 0)
    } else {
      return new Date(b.updated_at || b.created_at).getTime() -
             new Date(a.updated_at || a.created_at).getTime()
    }
  })

  // 모바일 뷰
  if (viewMode === 'mobile') {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen bg-bg-main shadow-xl transition-all duration-300">
        <Header viewMode={viewMode} onToggleViewMode={toggleViewMode} />

        <main className="pb-24">
          <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

          {/* 타임 필터 */}
          <div className="px-4 py-2">
            <TimeFilter selected={selectedTimeRange} onSelect={setSelectedTimeRange} />
          </div>

          {/* 업데이트 시간 & 새로고침 */}
          <div className="px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-text-muted">
              {lastUpdated ? `업데이트: ${lastUpdated.toLocaleTimeString('ko-KR')}` : ''}
            </span>
            <button
              onClick={loadRankings}
              disabled={loading}
              className="flex items-center gap-1 text-xs text-text-secondary hover:text-primary transition-colors"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              새로고침
            </button>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* 폴백 데이터 안내 */}
          {isUsingFallback && !loading && (
            <div className="mx-4 mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 text-sm">
              <p className="font-medium">아직 수집된 데이터가 없습니다.</p>
              <p className="text-xs mt-1">백엔드에서 크롤링을 실행해주세요.</p>
            </div>
          )}

          {/* 상단 광고 */}
          <div className="px-4 mb-4">
            <AdSlot position="top" slot="mobile-top" />
          </div>

          <div className="px-4 pb-4 space-y-4">
            {loading ? (
              <LoadingSkeleton count={3} />
            ) : (
              insertAdsIntoList(
                sortedRankings,
                (ranking, index) => (
                  <RankingCard key={ranking.id} ranking={ranking} rank={index + 1} />
                ),
                5
              )
            )}
          </div>

          {/* 하단 광고 */}
          {!loading && sortedRankings.length > 0 && (
            <div className="px-4 pb-4">
              <AdSlot position="bottom" slot="mobile-bottom" />
            </div>
          )}
        </main>

        <BottomTabBar />
        <FloatingButton viewMode={viewMode} onToggleViewMode={toggleViewMode} />
      </div>
    )
  }

  // 데스크탑 뷰
  return (
    <div className="min-h-screen bg-bg-main transition-all duration-300">
      <Header viewMode={viewMode} onToggleViewMode={toggleViewMode} />

      <div className="flex">
        {/* 좌측 사이드바 */}
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedTimeRange={selectedTimeRange}
          onSelectTimeRange={setSelectedTimeRange}
        />

        {/* 메인 콘텐츠 */}
        <main className="flex-1 p-6 lg:p-8">
          {/* 타이틀 섹션 */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-text-primary mb-1">
                실시간 트렌드 랭킹
              </h1>
              <p className="text-sm text-text-secondary">
                현재 대한민국에서 가장 핫한 소식들을 AI가 요약해 드립니다.
              </p>
              {lastUpdated && (
                <p className="text-xs text-text-muted mt-1">
                  마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')}
                </p>
              )}
            </div>

            {/* 정렬 & 새로고침 */}
            <div className="flex items-center gap-3">
              <button
                onClick={loadRankings}
                disabled={loading}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                title="새로고침"
              >
                <RefreshCw size={18} className={`text-text-secondary ${loading ? 'animate-spin' : ''}`} />
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('popular')}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    sortBy === 'popular'
                      ? 'bg-primary text-white'
                      : 'bg-white text-text-secondary border border-border-light hover:border-primary'
                  }`}
                >
                  인기순
                </button>
                <button
                  onClick={() => setSortBy('latest')}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    sortBy === 'latest'
                      ? 'bg-primary text-white'
                      : 'bg-white text-text-secondary border border-border-light hover:border-primary'
                  }`}
                >
                  최신순
                </button>
              </div>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-600">
              <AlertCircle size={20} />
              {error}
              <button
                onClick={loadRankings}
                className="ml-auto text-sm underline hover:no-underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 폴백 데이터 안내 */}
          {isUsingFallback && !loading && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700">
              <p className="font-medium">아직 수집된 데이터가 없습니다.</p>
              <p className="text-sm mt-1">
                백엔드에서 <code className="bg-blue-100 px-1 rounded">python main.py --classify --save</code> 명령을 실행해주세요.
              </p>
            </div>
          )}

          {/* 모바일용 카테고리 필터 (태블릿 사이즈) */}
          <div className="lg:hidden mb-4">
            <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />
          </div>

          {/* 타임 필터 (태블릿 사이즈에서만 표시, 데스크탑은 사이드바에서 표시) */}
          <div className="lg:hidden mb-6">
            <TimeFilter selected={selectedTimeRange} onSelect={setSelectedTimeRange} />
          </div>

          {/* 상단 광고 */}
          <div className="mb-6">
            <AdSlot position="top" slot="desktop-top" />
          </div>

          {/* 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              <LoadingSkeleton count={6} />
            ) : (
              insertAdsIntoList(
                sortedRankings,
                (ranking, index) => (
                  <RankingCard key={ranking.id} ranking={ranking} rank={index + 1} />
                ),
                6
              )
            )}
          </div>

          {/* 하단 광고 */}
          {!loading && sortedRankings.length > 0 && (
            <div className="mt-8">
              <AdSlot position="bottom" slot="desktop-bottom" />
            </div>
          )}

          {/* 더 보기 버튼 */}
          {sortedRankings.length >= 6 && !isUsingFallback && (
            <div className="flex justify-center mt-8">
              <button className="flex items-center gap-2 px-6 py-3 bg-white text-text-secondary border border-border-light rounded-full hover:border-primary hover:text-primary transition-colors">
                <span>더 많은 트렌드 보기</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>

      <FloatingButton viewMode={viewMode} onToggleViewMode={toggleViewMode} />
    </div>
  )
}

// 로딩 스켈레톤 컴포넌트
function LoadingSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-3xl shadow-card overflow-hidden animate-pulse">
          <div className="w-full aspect-[16/10] bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="flex gap-2">
              <div className="h-6 bg-gray-200 rounded-full w-16" />
              <div className="h-6 bg-gray-200 rounded-full w-16" />
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
