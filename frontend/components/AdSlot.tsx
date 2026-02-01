interface AdSlotProps {
  position: 'top' | 'middle' | 'bottom'
}

export default function AdSlot({ position }: AdSlotProps) {
  return (
    <div className="w-full bg-bg-card border border-border-color rounded-lg p-4 text-center">
      <span className="text-text-secondary text-sm">
        광고 영역 ({position})
      </span>
    </div>
  )
}
