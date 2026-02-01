'use client'

import { Category } from '@/lib/supabase'

interface CategoryFilterProps {
  selected: Category | null
  onSelect: (category: Category | null) => void
}

const categories: { value: Category | null; label: string }[] = [
  { value: null, label: '전체' },
  { value: 'politics', label: '정치' },
  { value: 'stock', label: '경제' },
  { value: 'sports', label: '스포츠' },
  { value: 'celebrity', label: '연예' },
  { value: 'game', label: '게임' },
  { value: 'issue', label: '일반 이슈' },
]

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="category-scroll hide-scrollbar flex gap-2 px-4 py-3">
      {categories.map((cat) => (
        <button
          key={cat.value ?? 'all'}
          onClick={() => onSelect(cat.value)}
          className={`
            flex-shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold
            transition-all duration-200 ease-out
            ${
              selected === cat.value
                ? 'bg-primary text-white shadow-md'
                : 'bg-white text-text-secondary border border-border-light hover:border-primary hover:text-primary'
            }
          `}
        >
          {cat.label}
        </button>
      ))}
    </div>
  )
}
