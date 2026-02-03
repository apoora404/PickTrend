'use client'

import { MessageCircle, ThumbsUp, Flame } from 'lucide-react'

interface BestComment {
  author?: string
  content: string
  likes?: number
}

interface BestCommentsSectionProps {
  comments?: BestComment[] | null
}

export default function BestCommentsSection({ comments }: BestCommentsSectionProps) {
  if (!comments || comments.length === 0) {
    return null
  }

  return (
    <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Flame size={22} className="text-orange-500" />
        <span className="text-text-primary">지금 핫한 댓글</span>
        <MessageCircle size={18} className="text-blue-500" />
      </h2>
      <div className="grid gap-3">
        {comments.map((comment, index) => (
          <div
            key={index}
            className="bg-white/80 dark:bg-bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* 댓글 내용 */}
            <p className="text-base font-medium text-text-primary leading-relaxed mb-2">
              "{comment.content}"
            </p>

            {/* 댓글 하단: 작성자 + 좋아요 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-text-secondary">
                - {comment.author || `익명${index + 1}`}
              </span>
              {comment.likes !== undefined && comment.likes > 0 && (
                <span className="flex items-center gap-1 text-sm text-primary font-medium">
                  <ThumbsUp size={14} fill="currentColor" />
                  {comment.likes}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
