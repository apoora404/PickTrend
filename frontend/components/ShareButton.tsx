'use client'

import { Share2 } from 'lucide-react'

interface ShareButtonProps {
  title: string
  text: string
}

export default function ShareButton({ title, text }: ShareButtonProps) {
  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title,
        text,
        url: window.location.href,
      })
    } else {
      // Fallback: 클립보드에 복사
      navigator.clipboard.writeText(window.location.href)
      alert('링크가 복사되었습니다!')
    }
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full font-medium hover:bg-primary/90 transition-colors"
    >
      <Share2 size={18} />
      공유하기
    </button>
  )
}
