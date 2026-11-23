import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import type { CarStatus } from "@/lib/domain/types"

export const CAR_STATUS_LABELS: Record<CarStatus, string> = {
  ready: "Siap Jual",
  booked: "Dibooking",
  sold: "Terjual",
  draft: "Draft",
  archived: "Diarsipkan",
}

const CAR_STATUS_STYLES: Record<
  CarStatus,
  {
    badge: string
    dot: string
  }
> = {
  ready: {
    badge: "border-emerald-800/35 bg-emerald-50 text-emerald-950",
    dot: "bg-emerald-700",
  },
  booked: {
    badge: "border-amber-800/40 bg-amber-50 text-amber-950",
    dot: "bg-amber-600",
  },
  sold: {
    badge: "border-[#161514] bg-[#161514] text-[#FAF9F7]",
    dot: "bg-[#B91C1C]",
  },
  draft: {
    badge: "border-[#766F68]/50 bg-[#F2F0EC] text-[#161514]",
    dot: "bg-[#766F68]",
  },
  archived: {
    badge: "border-[#D6D0C8] bg-card text-[#544F4A]",
    dot: "bg-[#A39B92]",
  },
}

export interface CarStatusBadgeProps {
  status: CarStatus
  className?: string
}

export function CarStatusBadge({ status, className }: CarStatusBadgeProps) {
  const style = CAR_STATUS_STYLES[status]

  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 rounded-none px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase",
        style.badge,
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn("inline-block size-1.5 shrink-0", style.dot)}
      />
      <span>{CAR_STATUS_LABELS[status]}</span>
    </Badge>
  )
}
