interface AdSlotProps {
  position: 'top' | 'middle' | 'bottom' | 'inline'
  slot?: string  // AdSense 슬롯 ID용
  className?: string
}

// 위치별 기본 사이즈 설정
const positionStyles: Record<string, string> = {
  top: 'min-h-[90px] md:min-h-[100px]',      // 리더보드
  middle: 'min-h-[250px] md:min-h-[280px]',  // 직사각형
  bottom: 'min-h-[90px] md:min-h-[100px]',   // 리더보드
  inline: 'min-h-[100px]',                    // 인라인 (리스트 중간용)
}

export default function AdSlot({ position, slot, className = '' }: AdSlotProps) {
  const sizeStyle = positionStyles[position] || positionStyles.middle

  return (
    <div
      className={`w-full bg-bg-card border border-border-color rounded-lg flex items-center justify-center ${sizeStyle} ${className}`}
      data-ad-slot={slot}
      data-ad-position={position}
    >
      <div className="text-center p-4">
        <span className="text-text-muted text-xs block mb-1">
          광고
        </span>
        <span className="text-text-secondary text-sm">
          AD ({position})
        </span>
        {slot && (
          <span className="text-text-muted text-xs block mt-1">
            Slot: {slot}
          </span>
        )}
      </div>
    </div>
  )
}
