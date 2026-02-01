'use client'

import { Category, TimeRange } from '@/lib/supabase'
import TimeFilter from '@/components/TimeFilter'
import {
  LayoutGrid,
  Building2,
  TrendingUp,
  Trophy,
  Star,
  Gamepad2,
  Newspaper,
  ArrowUp,
  Sparkles,
  ArrowDown
} from 'lucide-react'

interface SidebarProps {
  selectedCategory: Category | null
  onSelectCategory: (category: Category | null) => void
  selectedTimeRange?: TimeRange
  onSelectTimeRange?: (timeRange: TimeRange) => void
}

const categories: { value: Category | null; label: string; icon: React.ReactNode }[] = [
  { value: null, label: '전체 트렌드', icon: <LayoutGrid className="w-5 h-5" /> },
  { value: 'politics', label: '정치', icon: <Building2 className="w-5 h-5" /> },
  { value: 'stock', label: '경제', icon: <TrendingUp className="w-5 h-5" /> },
  { value: 'sports', label: '스포츠', icon: <Trophy className="w-5 h-5" /> },
  { value: 'celebrity', label: '연예', icon: <Star className="w-5 h-5" /> },
  { value: 'game', label: '게임', icon: <Gamepad2 className="w-5 h-5" /> },
  { value: 'issue', label: '일반 이슈', icon: <Newspaper className="w-5 h-5" /> },
]

// 급상승 키워드 샘플
const trendingKeywords = [
  { rank: 1, keyword: '아이폰 16 루머', status: 'up' },
  { rank: 2, keyword: '가을 축제 일정', status: 'new' },
  { rank: 3, keyword: '대출금리 실적', status: 'down' },
]

export default function Sidebar({ selectedCategory, onSelectCategory, selectedTimeRange, onSelectTimeRange }: SidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-border-light h-[calc(100vh-64px)] sticky top-16">
      {/* 타임 필터 */}
      {selectedTimeRange && onSelectTimeRange && (
        <div className="p-4 border-b border-border-light">
          <h3 className="text-xs font-semibold text-text-muted mb-3">기간 선택</h3>
          <TimeFilter selected={selectedTimeRange} onSelect={onSelectTimeRange} />
        </div>
      )}

      {/* 카테고리 메뉴 */}
      <nav className="p-4 space-y-1">
        {categories.map((cat) => (
          <button
            key={cat.value ?? 'all'}
            onClick={() => onSelectCategory(cat.value)}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
              transition-all duration-200
              ${
                selectedCategory === cat.value
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
              }
            `}
          >
            {cat.icon}
            <span>{cat.label}</span>
          </button>
        ))}
      </nav>

      {/* 구분선 */}
      <div className="mx-4 border-t border-border-light" />

      {/* 급상승 키워드 */}
      <div className="p-4">
        <h3 className="text-xs font-semibold text-text-muted mb-3 px-2">
          현재 급상승 키워드
        </h3>
        <div className="space-y-2">
          {trendingKeywords.map((item) => (
            <div
              key={item.rank}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <span className="text-sm font-bold text-text-muted w-4">
                {item.rank}.
              </span>
              <span className="text-sm text-text-primary flex-1 truncate">
                {item.keyword}
              </span>
              {item.status === 'up' && (
                <span className="flex items-center text-xs text-red-500 font-medium">
                  <ArrowUp className="w-3 h-3" /> UP
                </span>
              )}
              {item.status === 'new' && (
                <span className="flex items-center text-xs text-primary font-medium">
                  <Sparkles className="w-3 h-3 mr-0.5" /> NEW
                </span>
              )}
              {item.status === 'down' && (
                <span className="flex items-center text-xs text-blue-500 font-medium">
                  <ArrowDown className="w-3 h-3" /> DOWN
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
