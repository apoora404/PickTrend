'use client'

import { TimeRange } from '@/lib/supabase'
import { Clock } from 'lucide-react'

interface TimeFilterProps {
  selected: TimeRange
  onSelect: (timeRange: TimeRange) => void
  className?: string
}

const timeOptions: { value: TimeRange; label: string }[] = [
  { value: 'realtime', label: '실시간' },
  { value: '1h', label: '1시간' },
  { value: '12h', label: '12시간' },
  { value: '24h', label: '24시간' },
]

export default function TimeFilter({ selected, onSelect, className = '' }: TimeFilterProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="w-4 h-4 text-text-muted" />
      <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
        {timeOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onSelect(opt.value)}
            className={`
              px-3 py-1.5 text-xs font-semibold rounded-md transition-all
              ${selected === opt.value
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-200'
              }
            `}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
