'use client'

import { Plus, Monitor, Smartphone } from 'lucide-react'

interface FloatingButtonProps {
  viewMode: 'mobile' | 'desktop'
  onToggleViewMode: () => void
}

export default function FloatingButton({ viewMode, onToggleViewMode }: FloatingButtonProps) {
  return (
    <div className="fixed bottom-24 lg:bottom-8 right-4 lg:right-8 flex flex-col gap-3 z-40">
      {/* 새 글 작성 버튼 */}
      <button
        className="w-14 h-14 bg-primary text-white rounded-full shadow-lg
          flex items-center justify-center
          hover:bg-primary-dark hover:scale-110
          transition-all duration-200 ease-out"
        title="새 글 작성"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* 뷰 모드 전환 버튼 (모바일에서만 표시) */}
      <button
        onClick={onToggleViewMode}
        className="sm:hidden w-12 h-12 bg-white text-text-secondary rounded-full shadow-lg border border-border-light
          flex flex-col items-center justify-center gap-0.5
          hover:text-primary hover:border-primary
          transition-all duration-200"
        title={viewMode === 'mobile' ? '웹 버전으로 보기' : '모바일 버전으로 보기'}
      >
        {viewMode === 'mobile' ? (
          <Monitor className="w-5 h-5" />
        ) : (
          <Smartphone className="w-5 h-5" />
        )}
      </button>
    </div>
  )
}
