import {
  BatteryCharging,
  ExternalLink,
  Lightbulb,
  PlayCircle,
} from "lucide-react"
import { cn } from "cn"
import type { CarUnit, CreatorInsights, EvSpecs } from "@/lib/domain/types"
import { buttonVariants } from "@/components/ui/button"

export interface CarInsightsSectionProps {
  car: CarUnit
}

function extractYouTubeEmbedUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl)
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase()

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0]
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (parsed.pathname === "/watch") {
        const id = parsed.searchParams.get("v")
        return id ? `https://www.youtube-nocookie.com/embed/${id}` : null
      }

      const segments = parsed.pathname.split("/").filter(Boolean)
      if (
        (segments[0] === "embed" || segments[0] === "shorts") &&
        segments[1]
      ) {
        return `https://www.youtube-nocookie.com/embed/${segments[1]}`
      }
    }
  } catch {
    return null
  }

  return null
}

function buildEvSpecRows(
  evSpecs: EvSpecs | null,
): Array<{ label: string; value: string }> {
  if (!evSpecs) return []

  const rows: Array<{ label: string; value: string }> = []

  if (
    evSpecs.batterySohPercent !== null &&
    evSpecs.batterySohPercent !== undefined
  ) {
    rows.push({
      label: "Battery State of Health (SOH)",
      value: `${evSpecs.batterySohPercent}%`,
    })
  }

  if (
    evSpecs.batteryCapacityKwh !== null &&
    evSpecs.batteryCapacityKwh !== undefined
  ) {
    rows.push({
      label: "Kapasitas Baterai",
      value: `${evSpecs.batteryCapacityKwh.toLocaleString("id-ID")} kWh`,
    })
  }

  if (
    evSpecs.claimedRangeKm !== null &&
    evSpecs.claimedRangeKm !== undefined
  ) {
    rows.push({
      label: "Jarak Tempuh Klaim",
      value: `${evSpecs.claimedRangeKm.toLocaleString("id-ID")} km`,
    })
  }

  if (evSpecs.realRangeKm !== null && evSpecs.realRangeKm !== undefined) {
    rows.push({
      label: "Estimasi Jarak Tempuh Riil",
      value: `${evSpecs.realRangeKm.toLocaleString("id-ID")} km`,
    })
  }

  if (evSpecs.chargingPortType?.trim()) {
    rows.push({
      label: "Tipe Port Charging",
      value: evSpecs.chargingPortType.trim(),
    })
  }

  if (evSpecs.fastChargingInfo?.trim()) {
    rows.push({
      label: "Waktu Fast Charging",
      value: evSpecs.fastChargingInfo.trim(),
    })
  }

  const chargers: string[] = []
  if (evSpecs.portableChargerIncluded) {
    chargers.push("Portable Charger")
  }
  if (evSpecs.wallChargerIncluded) {
    chargers.push("Wall Charger")
  }
  if (chargers.length > 0) {
    rows.push({
      label: "Kelengkapan Charger",
      value: `${chargers.join(" & ")} Termasuk`,
    })
  }

  const warrantyParts: string[] = []
  if (evSpecs.batteryWarrantyInfo?.trim()) {
    warrantyParts.push(evSpecs.batteryWarrantyInfo.trim())
  }
  if (evSpecs.batteryWarrantyTransferable !== undefined) {
    warrantyParts.push(
      evSpecs.batteryWarrantyTransferable
        ? "Garansi Bisa Ditransfer"
        : "Garansi Mengikuti Pemilik Awal",
    )
  }
  if (warrantyParts.length > 0) {
    rows.push({
      label: "Garansi Baterai",
      value: warrantyParts.join(" • "),
    })
  }

  return rows
}

function hasCreatorInsightsContent(
  insights: CreatorInsights | null,
): insights is CreatorInsights {
  if (!insights) return false
  return Boolean(
    insights.realWorldFuelConsumption?.trim() ||
      insights.estimatedMaintenanceCost?.trim() ||
      insights.commonIssuesChecked?.trim() ||
      insights.expertNotes?.trim(),
  )
}

export function CarInsightsSection({ car }: CarInsightsSectionProps) {
  const evSpecRows = buildEvSpecRows(car.evSpecs)
  const videoUrl = car.videoWalkaroundUrl?.trim() ?? ""
  const youtubeEmbedUrl = videoUrl ? extractYouTubeEmbedUrl(videoUrl) : null
  const hasInsights = hasCreatorInsightsContent(car.creatorInsights)

  if (evSpecRows.length === 0 && !videoUrl && !hasInsights) {
    return null
  }

  const insights = car.creatorInsights

  return (
    <section aria-labelledby="insights-heading" className="space-y-6">
      <h2
        id="insights-heading"
        className="font-heading text-xl font-semibold tracking-tight text-foreground"
      >
        Catatan Ahli, Video &amp; Spesifikasi Lanjutan
      </h2>

      {evSpecRows.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
            <BatteryCharging className="size-4 shrink-0" aria-hidden="true" />
            <h3>Spesifikasi Baterai &amp; Sistem EV / Hybrid</h3>
          </div>

          <dl className="grid grid-cols-1 border-t border-l border-border bg-card sm:grid-cols-2">
            {evSpecRows.map((row) => (
              <div
                key={row.label}
                className="border-r border-b border-border px-4 py-3.5"
              >
                <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  {row.label}
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {hasInsights && insights ? (
        <div className="space-y-4 border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
            <Lightbulb className="size-4 shrink-0" aria-hidden="true" />
            <h3>Catatan Ahli &amp; Estimasi Kepemilikan</h3>
          </div>

          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {insights.realWorldFuelConsumption?.trim() ? (
              <div className="border border-border bg-secondary/50 p-3.5">
                <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Konsumsi BBM / Energi Riil
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">
                  {insights.realWorldFuelConsumption.trim()}
                </dd>
              </div>
            ) : null}

            {insights.estimatedMaintenanceCost?.trim() ? (
              <div className="border border-border bg-secondary/50 p-3.5">
                <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                  Estimasi Biaya Perawatan Tahunan
                </dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">
                  {insights.estimatedMaintenanceCost.trim()}
                </dd>
              </div>
            ) : null}
          </dl>

          {insights.commonIssuesChecked?.trim() ? (
            <div className="border-t border-border pt-3.5">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Titik Penyakit Khas yang Sudah Dicek
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {insights.commonIssuesChecked.trim()}
              </p>
            </div>
          ) : null}

          {insights.expertNotes?.trim() ? (
            <div className="border-t border-border pt-3.5">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Catatan Ahli Garasi 571
              </p>
              <p className="mt-1 text-sm leading-relaxed text-foreground">
                {insights.expertNotes.trim()}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {videoUrl ? (
        <div className="space-y-3 border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-primary uppercase">
              <PlayCircle className="size-4 shrink-0" aria-hidden="true" />
              <h3>Video Walkaround Unit</h3>
            </div>

            <a
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "no-underline",
              )}
            >
              <span>Tonton Video Walkaround Unit</span>
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          </div>

          {youtubeEmbedUrl ? (
            <div className="aspect-video w-full overflow-hidden border border-border bg-secondary">
              <iframe
                src={youtubeEmbedUrl}
                title={`Video walkaround ${car.name}`}
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tonton video walkaround eksterior, interior, dan suara mesin unit
              ini melalui tautan resmi di atas.
            </p>
          )}
        </div>
      ) : null}
    </section>
  )
}
