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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TruncatedTooltip } from "@/components/ui/tooltip"
import {
  computeCarCompleteness,
  type CompletenessInput,
} from "@/lib/domain/completeness"
import type { CarImage, CompletenessTabKey } from "@/lib/domain/types"

export const COMPLETENESS_TAB_LABELS: Record<CompletenessTabKey, string> = {
  identity: "Identitas & Spek",
  pricing: "Harga & Kredit",
  legality: "Legalitas & Inspeksi",
  media: "Galeri Foto",
  insights: "EV, Video & Insight",
}

export interface CarCompletenessSidebarProps {
  car: CompletenessInput
  images?: CarImage[]
  activeTab: CompletenessTabKey
  onSelectTab: (tab: CompletenessTabKey, targetId?: string) => void
  isNew?: boolean
  className?: string
}

export function scrollToCarField(targetId?: string) {
  if (typeof window === "undefined") return

  window.requestAnimationFrame(() => {
    window.setTimeout(() => {
      const target = targetId
        ? (document.querySelector<HTMLElement>(
            `[data-completeness-id="${targetId}"]`
          ) ?? document.getElementById(targetId))
        : document.querySelector<HTMLElement>('[data-slot="tabs-list"]')

      if (!target) return

      const accordionItem = target.closest<HTMLElement>(
        '[data-slot="accordion-item"]'
      )
      const closedTrigger = accordionItem?.querySelector<HTMLButtonElement>(
        '[data-slot="accordion-trigger"][aria-expanded="false"]'
      )
      if (closedTrigger) {
        closedTrigger.click()
      }

      window.setTimeout(
        () => {
          target.scrollIntoView({ behavior: "smooth", block: "center" })

          const focusable = target.matches(
            'input, select, textarea, button, [role="combobox"], [role="switch"]'
          )
            ? target
            : target.querySelector<HTMLElement>(
                'input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [role="combobox"], [role="switch"]'
              )

          if (focusable) {
            window.setTimeout(() => {
              focusable.focus({ preventScroll: true })
            }, 200)
          }
        },
        closedTrigger ? 80 : 0
      )
    }, 40)
  })
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

  const nextAction = React.useMemo<{
    tab: CompletenessTabKey
    targetId?: string
  }>(() => {
    if (isNew) {
      const nonMediaDim = completeness.dimensions.find(
        (dim) => dim.targetTab !== "media" && dim.missingItems.length > 0
      )
      if (nonMediaDim) {
        return {
          tab: nonMediaDim.targetTab,
          targetId: nonMediaDim.missingItemTargets?.[0]?.targetId,
        }
      }
    }
    const firstDim = completeness.dimensions.find(
      (dim) => dim.targetTab === completeness.suggestedTab
    )
    return {
      tab: completeness.suggestedTab,
      targetId: firstDim?.missingItemTargets?.[0]?.targetId,
    }
  }, [completeness.dimensions, completeness.suggestedTab, isNew])

  const visibleMissingItems = showAllMissing
    ? completeness.missingItems
    : completeness.missingItems.slice(0, 6)
  const hiddenMissingCount =
    completeness.missingItems.length - visibleMissingItems.length

  const completedDimensions = completeness.dimensions.filter(
    (dim) => dim.completedCount >= dim.totalCount
  ).length

  return (
    <aside
      aria-label="Skor Kelengkapan Data Riset"
      className={cn("border border-border bg-card", className)}
    >
      <Accordion
        multiple
        defaultValue={["overview"]}
      >
        {/* Overall Score Header */}
        <AccordionItem value="overview" className="border-border bg-secondary/45">
          <AccordionTrigger className="cursor-pointer items-center px-4 py-3.5 hover:no-underline sm:px-5">
            <div className="flex flex-1 items-center justify-between gap-2 pr-2">
              <span className="font-heading text-base font-bold tracking-tight text-foreground">
                Kelengkapan Data
              </span>
              <span
                className={cn(
                  "font-heading text-sm font-bold tabular-nums",
                  scoreMeta.scoreTextClass
                )}
              >
                {completeness.score}%
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-baseline gap-1.5">
                <span
                  className={cn(
                    "font-heading text-3xl font-bold tracking-tight tabular-nums",
                    scoreMeta.scoreTextClass
                  )}
                >
                  {completeness.score}%
                </span>
                <span className="text-sm font-medium text-muted-foreground">
                  / 100%
                </span>
              </div>
              <Badge variant={scoreMeta.badgeVariant} className="shrink-0">
                {scoreMeta.label}
              </Badge>
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

            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              {scoreMeta.helper}
            </p>

            {completeness.missingItems.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onSelectTab(nextAction.tab, nextAction.targetId)}
                className="mt-3 w-full justify-between text-sm"
              >
                <TruncatedTooltip
                  content={`Lengkapi: ${COMPLETENESS_TAB_LABELS[nextAction.tab]}`}
                  render={<span className="truncate" />}
                >
                  Lengkapi: {COMPLETENESS_TAB_LABELS[nextAction.tab]}
                </TruncatedTooltip>
                <ArrowRight className="size-3.5 shrink-0" aria-hidden="true" />
              </Button>
            ) : (
              <div className="mt-3 flex items-center gap-2 border border-emerald-800/30 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-950">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-700" aria-hidden="true" />
                <span>Semua data wajib lengkap.</span>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* Breakdown Across All 6 Research Dimensions */}
        <AccordionItem value="dimensions" className="border-border">
          <AccordionTrigger className="cursor-pointer items-center px-4 py-3.5 hover:no-underline sm:px-5">
            <div className="flex flex-1 items-center justify-between gap-2 pr-2">
              <span className="font-heading text-sm font-bold tracking-tight text-foreground">
                Rincian Kelengkapan
              </span>
              <span className="text-sm font-medium text-muted-foreground tabular-nums">
                {completedDimensions}/{completeness.dimensions.length}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 sm:px-5 sm:pb-5">
            <ul className="space-y-2">
          {completeness.dimensions.map((dim) => {
            const isComplete = dim.completedCount >= dim.totalCount
            const isActiveDim = activeTab === dim.targetTab
            const isLockedMedia = isNew && dim.targetTab === "media"

            return (
              <li key={dim.key}>
                <button
                  type="button"
                  onClick={() =>
                    onSelectTab(
                      dim.targetTab,
                      dim.missingItemTargets?.[0]?.targetId
                    )
                  }
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
                      <TruncatedTooltip
                        content={dim.label}
                        render={
                          <span className="truncate text-sm font-semibold text-foreground" />
                        }
                      >
                        {dim.label}
                      </TruncatedTooltip>
                    </span>

                    <div className="flex shrink-0 items-center gap-1.5 tabular-nums">
                      <span className="text-sm font-semibold text-foreground">
                        {dim.completedCount}/{dim.totalCount}
                      </span>
                      <span className="text-sm text-muted-foreground">
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

                  {isLockedMedia ? (
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      Tersedia setelah unit disimpan.
                    </p>
                  ) : null}
                </button>
              </li>
            )
          })}
            </ul>
          </AccordionContent>
        </AccordionItem>

        {/* Missing Items Checklist */}
        <AccordionItem value="missing" className="border-border">
          <AccordionTrigger className="cursor-pointer items-center px-4 py-3.5 hover:no-underline sm:px-5">
            <div className="flex flex-1 items-center justify-between gap-2 pr-2">
              <span className="flex items-center gap-2 font-heading text-sm font-bold tracking-tight text-foreground">
                {completeness.missingItems.length > 0 ? (
                  <AlertTriangle
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <Sparkles
                    className="size-4 shrink-0 text-emerald-700"
                    aria-hidden="true"
                  />
                )}
                <span>
                  {completeness.missingItems.length > 0
                    ? "Perlu Dilengkapi"
                    : "Checklist Lengkap"}
                </span>
              </span>
              {completeness.missingItems.length > 0 ? (
                <span className="text-sm font-semibold text-muted-foreground tabular-nums">
                  {completeness.missingItems.length} poin
                </span>
              ) : null}
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 sm:px-5 sm:pb-5">
            {completeness.missingItems.length === 0 ? (
              <div className="space-y-2 border border-border bg-secondary/35 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              Semua poin wajib sudah terisi.
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
            <ul className="mt-3 divide-y divide-border/70 border-y border-border/70">
              {visibleMissingItems.map((item) => (
                <li key={`${item.dimensionKey}-${item.label}`}>
                  <button
                    type="button"
                    onClick={() => onSelectTab(item.targetTab, item.targetId)}
                    className="group flex w-full cursor-pointer items-center justify-between gap-3 px-1 py-2.5 text-left text-sm transition-colors hover:bg-secondary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <span className="min-w-0 leading-snug text-foreground group-hover:text-primary">
                      {item.label}
                    </span>
                    <span className="shrink-0 text-sm font-medium text-muted-foreground group-hover:text-foreground">
                      {COMPLETENESS_TAB_LABELS[item.targetTab].split(" ")[0]}
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
                className="mt-2 w-full text-sm text-muted-foreground"
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  )
}
