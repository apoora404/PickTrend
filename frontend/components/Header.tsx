'use client'

import { LayoutGrid, Search, Bell, Moon, Sun, User, Monitor, Smartphone } from 'lucide-react'

interface HeaderProps {
  viewMode: 'mobile' | 'desktop'
  onToggleViewMode: () => void
}

export default function Header({ viewMode, onToggleViewMode }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border-light">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* 좌측: 로고 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-primary rounded-lg p-1.5">
            <LayoutGrid className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-primary hidden sm:block">밈보드</span>
        </div>

        {/* 중앙: 검색바 (데스크탑) */}
        <div className="hidden md:flex flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
            <input
              type="text"
              placeholder="트렌드를 검색해보세요"
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full text-sm
                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white
                transition-all"
            />
          </div>
        </div>

        {/* 우측: 아이콘들 */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* 모바일 검색 버튼 */}
          <button className="md:hidden p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Search className="w-5 h-5 text-text-secondary" />
          </button>

          {/* 알림 */}
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
            <Bell className="w-5 h-5 text-text-secondary" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>

          {/* 뷰 모드 전환 (데스크탑에서만) */}
          <button
            onClick={onToggleViewMode}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 hover:bg-gray-100 rounded-full transition-colors"
            title={viewMode === 'mobile' ? '웹 버전으로 보기' : '모바일 버전으로 보기'}
          >
            {viewMode === 'mobile' ? (
              <>
                <Monitor className="w-4 h-4 text-text-secondary" />
                <span className="text-xs text-text-secondary hidden lg:block">웹</span>
              </>
            ) : (
              <>
                <Smartphone className="w-4 h-4 text-text-secondary" />
                <span className="text-xs text-text-secondary hidden lg:block">모바일</span>
              </>
            )}
          </button>

          {/* 프로필 */}
          <button className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-full transition-colors">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-text-primary hidden lg:block">마이프로필</span>
          </button>
        </div>
      </div>
    </header>
  )
}
