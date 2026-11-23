import * as React from "react"
import { cn } from "cn"
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Sparkles,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  computeCarCompleteness,
  type CompletenessInput,
} from "@/lib/domain/completeness"
import type { CarImage, CompletenessTabKey } from "@/lib/domain/types"

export const COMPLETENESS_TAB_LABELS: Record<CompletenessTabKey, string> = {
  identity: "Identitas & Spek",
  pricing: "Harga & Kredit",
  legality: "Legalitas & Inspeksi",
  media: "Galeri Foto R2",
  insights: "EV, Video & Insight",
}

export interface CarCompletenessSidebarProps {
  car: CompletenessInput
  images?: CarImage[]
  activeTab: CompletenessTabKey
  onSelectTab: (tab: CompletenessTabKey) => void
  isNew?: boolean
  className?: string
}

function getScoreMeta(score: number): {
  label: string
  badgeVariant: "success" | "default" | "warning" | "destructive"
  barClass: string
  scoreTextClass: string
  helper: string
} {
  if (score >= 85) {
    return {
      label: "Sangat Lengkap",
      badgeVariant: "success",
      barClass: "bg-emerald-700",
      scoreTextClass: "text-emerald-800",
      helper: "Unit memenuhi standar transparansi tinggi untuk katalog publik.",
    }
  }
  if (score >= 70) {
    return {
      label: "Siap Tayang",
      badgeVariant: "default",
      barClass: "bg-[#161514]",
      scoreTextClass: "text-foreground",
      helper:
        "Sudah mencapai ambang minimal 70%. Lengkapi poin tersisa agar makin meyakinkan.",
    }
  }
  if (score >= 45) {
    return {
      label: "Perlu Dilengkapi",
      badgeVariant: "warning",
      barClass: "bg-amber-600",
      scoreTextClass: "text-amber-900",
      helper: "Target minimal 70% agar unit tidak masuk daftar peringatan.",
    }
  }
  return {
    label: "Belum Lengkap",
    badgeVariant: "destructive",
    barClass: "bg-primary",
    scoreTextClass: "text-[#991B1B]",
    helper:
      "Lengkapi identitas, harga, legalitas, dan foto wajib sebelum publikasi.",
  }
}

export function CarCompletenessSidebar({
  car,
  images,
  activeTab,
  onSelectTab,
  isNew = false,
  className,
}: CarCompletenessSidebarProps) {
  const [showAllMissing, setShowAllMissing] = React.useState(false)

  const completeness = React.useMemo(
    () =>
      computeCarCompleteness({
        ...car,
        images: images ?? car.images ?? [],
      }),
    [car, images]
  )

  const scoreMeta = getScoreMeta(completeness.score)

  const nextActionTab = React.useMemo<CompletenessTabKey>(() => {
    if (isNew) {
      const nonMediaDim = completeness.dimensions.find(
        (dim) => dim.targetTab !== "media" && dim.missingItems.length > 0
      )
      if (nonMediaDim) return nonMediaDim.targetTab
    }
    return completeness.suggestedTab
  }, [completeness.dimensions, completeness.suggestedTab, isNew])

  const visibleMissingItems = showAllMissing
    ? completeness.missingItems
    : completeness.missingItems.slice(0, 6)
  const hiddenMissingCount =
    completeness.missingItems.length - visibleMissingItems.length

  return (
    <aside
      aria-label="Skor Kelengkapan Data Riset"
      className={cn("border border-border bg-card", className)}
    >
      {/* Overall Score Header */}
      <div className="border-b border-border bg-secondary/45 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-heading text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
              Skor Kelengkapan Riset
            </p>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span
                className={cn(
                  "font-heading text-3xl font-bold tracking-tight tabular-nums",
                  scoreMeta.scoreTextClass
                )}
              >
                {completeness.score}%
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                / 100%
              </span>
            </div>
          </div>
          <Badge variant={scoreMeta.badgeVariant}>{scoreMeta.label}</Badge>
        </div>

        <div
          role="progressbar"
          aria-label="Persentase kelengkapan data unit"
          aria-valuenow={completeness.score}
          aria-valuemin={0}
          aria-valuemax={100}
          className="mt-3 h-2.5 w-full overflow-hidden border border-border bg-card"
        >
          <div
            className={cn(
              "h-full transition-all duration-300",
              scoreMeta.barClass
            )}
            style={{ width: `${completeness.score}%` }}
          />
        </div>

        <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">
          {scoreMeta.helper}
        </p>

        {completeness.missingItems.length > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelectTab(nextActionTab)}
            className="mt-3 w-full justify-between text-xs"
          >
            <span className="truncate">
              Lengkapi: {COMPLETENESS_TAB_LABELS[nextActionTab]}
            </span>
            <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
          </Button>
        ) : (
          <div className="mt-3 flex items-center gap-2 border border-emerald-800/30 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-950">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <span>Seluruh 6 dimensi riset telah terpenuhi!</span>
          </div>
        )}
      </div>

      {/* Breakdown Across All 6 Research Dimensions */}
      <div className="border-b border-border p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-heading text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
            6 Dimensi Riset
          </h2>
          <span className="text-[11px] text-muted-foreground">
            Klik untuk lompat
          </span>
        </div>

        <ul className="mt-3 space-y-2">
          {completeness.dimensions.map((dim) => {
            const isComplete = dim.completedCount >= dim.totalCount
            const isActiveDim = activeTab === dim.targetTab
            const isLockedMedia = isNew && dim.targetTab === "media"

            return (
              <li key={dim.key}>
                <button
                  type="button"
                  onClick={() => onSelectTab(dim.targetTab)}
                  className={cn(
                    "group w-full cursor-pointer border p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    isActiveDim
                      ? "border-foreground bg-secondary/70"
                      : "border-border bg-background hover:border-foreground/50 hover:bg-secondary/40"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 items-center gap-2">
                      {isComplete ? (
                        <CheckCircle2
                          className="size-3.5 shrink-0 text-emerald-700"
                          aria-hidden="true"
                        />
                      ) : (
                        <Circle
                          className="size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                      <span className="truncate text-xs font-semibold text-foreground">
                        {dim.label}
                      </span>
                    </span>

                    <div className="flex shrink-0 items-center gap-1.5 tabular-nums">
                      {isLockedMedia ? (
                        <span className="border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Pasca Simpan
                        </span>
                      ) : null}
                      <span className="text-[11px] font-semibold text-foreground">
                        {dim.completedCount}/{dim.totalCount}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ({dim.weight}%)
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 h-1.5 w-full overflow-hidden bg-secondary">
                    <div
                      className={cn(
                        "h-full transition-all duration-300",
                        isComplete
                          ? "bg-emerald-700"
                          : dim.percentage >= 50
                            ? "bg-amber-600"
                            : "bg-primary"
                      )}
                      style={{ width: `${dim.percentage}%` }}
                    />
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Missing Items Checklist */}
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 font-heading text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase">
            {completeness.missingItems.length > 0 ? (
              <AlertTriangle
                className="size-3.5 text-primary"
                aria-hidden="true"
              />
            ) : (
              <Sparkles
                className="size-3.5 text-emerald-700"
                aria-hidden="true"
              />
            )}
            <span>
              {completeness.missingItems.length > 0
                ? `Belum Lengkap (${completeness.missingItems.length})`
                : "Checklist Lengkap"}
            </span>
          </h2>
        </div>

        {completeness.missingItems.length === 0 ? (
          <div className="mt-3 space-y-2 border border-border bg-secondary/35 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">
              Tidak ada poin riset wajib yang terlewat.
            </p>
            <p>
              Anda tetap dapat menambahkan video walkaround, spesifikasi
              EV/Hybrid, atau catatan ahli di tab{" "}
              <button
                type="button"
                onClick={() => onSelectTab("insights")}
                className="cursor-pointer font-semibold text-primary underline underline-offset-2 hover:text-foreground"
              >
                EV, Video &amp; Insight
              </button>{" "}
              untuk meningkatkan kepercayaan pembeli.
            </p>
          </div>
        ) : (
          <>
            <ul className="mt-3 space-y-1.5">
              {visibleMissingItems.map((item) => (
                <li key={`${item.dimensionKey}-${item.label}`}>
                  <button
                    type="button"
                    onClick={() => onSelectTab(item.targetTab)}
                    className="group flex w-full cursor-pointer items-start justify-between gap-2 border border-transparent bg-secondary/35 px-2.5 py-2 text-left text-xs transition-colors hover:border-border hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="flex min-w-0 items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 inline-block size-1.5 shrink-0 bg-primary"
                      />
                      <span className="leading-snug text-foreground">
                        {item.label}
                      </span>
                    </span>
                    <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase group-hover:text-primary">
                      <span>{COMPLETENESS_TAB_LABELS[item.targetTab].split(" ")[0]}</span>
                      <ArrowRight className="size-3" aria-hidden="true" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {completeness.missingItems.length > 6 ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAllMissing((prev) => !prev)}
                className="mt-2 w-full text-xs text-muted-foreground"
              >
                {showAllMissing ? (
                  <>
                    <ChevronUp className="size-3.5" aria-hidden="true" />
                    <span>Tampilkan Lebih Ringkas</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                    <span>Lihat {hiddenMissingCount} Poin Lainnya</span>
                  </>
                )}
              </Button>
            ) : null}
          </>
        )}
      </div>
    </aside>
  )
}
