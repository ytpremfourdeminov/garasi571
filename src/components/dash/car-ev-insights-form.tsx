import * as React from "react"
import { cn } from "cn"
import {
  AlertCircle,
  AlertTriangle,
  BatteryCharging,
  CheckCircle2,
  ExternalLink,
  Fuel,
  Gauge,
  Info,
  PlayCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Video,
  Wrench,
  X,
  Zap,
} from "lucide-react"
import {
  FormSectionAccordion,
  FormSectionAccordionItem,
} from "@/components/dash/form-section-accordion"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useStableDialogData,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { CarUpsertInput } from "@/lib/domain/schemas"
import type { CreatorInsights, EvSpecs, FuelType } from "@/lib/domain/types"

export interface CarEvInsightsFormProps {
  value: CarUpsertInput
  onChange: (patch: Partial<CarUpsertInput>) => void
  errors?: Record<string, string>
  disabled?: boolean
}

const CHARGING_PORT_PRESETS = [
  "Type 2 / CCS2",
  "GB/T (AC & DC)",
  "CHAdeMO + Type 1",
  "Type 2 (AC Only)",
] as const

const FAST_CHARGE_PRESETS = [
  "DC Fast Charge 30-80% ±30 menit",
  "DC Fast Charge 10-80% ±35 menit (maks 80 kW)",
  "AC Home Charging 7 kW ±7 jam penuh",
] as const

const BATTERY_WARRANTY_PRESETS = [
  "Garansi baterai ATPM 8 tahun / 160.000 km",
  "Garansi baterai seumur hidup (S&K ATPM)",
  "Garansi baterai 8 tahun / 150.000 km aktif",
] as const

const FUEL_CONSUMPTION_PRESETS_ICE = [
  "11–13 km/L dalam kota, 15–17 km/L tol",
  "14–16 km/L dalam kota, 19–21 km/L tol",
  "9–11 km/L dalam kota, 13–15 km/L luar kota",
] as const

const FUEL_CONSUMPTION_PRESETS_HYBRID = [
  "18–22 km/L kombinasi dalam kota & tol",
  "20–24 km/L dalam kota, 18–20 km/L tol",
] as const

const FUEL_CONSUMPTION_PRESETS_EV = [
  "6,5–7,5 km/kWh pemakaian harian dalam kota",
  "5,8–6,5 km/kWh kombinasi dalam kota & tol",
] as const

const MAINTENANCE_COST_PRESETS = [
  "Rp2–3 jt/tahun (servis berkala rutin)",
  "Rp3,5–5 jt/tahun (oli, filter & inspeksi berkala)",
  "Rp1–1,5 jt/tahun (perawatan berkala EV)",
  "Rp6–9 jt/tahun (servis spesialis Eropa)",
] as const

const COMMON_ISSUE_PRESETS = [
  "Kaki-kaki & rack steer senyap tanpa bunyi",
  "Transmisi matic halus tanpa jeda / jedug",
  "AC dingin merata, kompresor & evaporator aman",
  "Sistem pendingin, radiator & thermostat normal",
  "Mesin kering bebas rembes oli & gasket aman",
  "Injector, turbo & EGR bersih (Diesel)",
  "Modul baterai & inverter normal tanpa fault code",
] as const

const FUEL_LABELS: Record<FuelType, string> = {
  bensin: "Bensin",
  diesel: "Diesel",
  hybrid: "Hybrid (HEV)",
  phev: "Plug-in Hybrid (PHEV)",
  ev: "Listrik Murni (EV)",
}

function getFieldError(
  errors: Record<string, string> | undefined,
  ...keys: string[]
): string | undefined {
  if (!errors) return undefined
  for (const key of keys) {
    const message = errors[key]
    if (message) return message
  }
  return undefined
}

function isEmptyEvSpecs(specs: EvSpecs): boolean {
  return (
    (specs.batterySohPercent === undefined ||
      specs.batterySohPercent === null) &&
    (specs.batteryCapacityKwh === undefined ||
      specs.batteryCapacityKwh === null) &&
    (specs.claimedRangeKm === undefined || specs.claimedRangeKm === null) &&
    (specs.realRangeKm === undefined || specs.realRangeKm === null) &&
    !specs.chargingPortType?.trim() &&
    !specs.fastChargingInfo?.trim() &&
    !specs.portableChargerIncluded &&
    !specs.wallChargerIncluded &&
    !specs.batteryWarrantyInfo?.trim() &&
    !specs.batteryWarrantyTransferable
  )
}

function isEmptyCreatorInsights(insights: CreatorInsights): boolean {
  return (
    !insights.realWorldFuelConsumption?.trim() &&
    !insights.estimatedMaintenanceCost?.trim() &&
    !insights.commonIssuesChecked?.trim() &&
    !insights.expertNotes?.trim()
  )
}

function parseIssueTags(raw: string | null | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/\r?\n/)
    .map((line) => line.replace(/^(?:[-*•▪◦]+|\d+[.)])\s*/, "").trim())
    .filter((line) => line.length > 0)
}

function serializeIssueTags(items: string[]): string | null {
  const cleaned = items.map((item) => item.trim()).filter(Boolean)
  return cleaned.length > 0 ? cleaned.join("\n") : null
}

function parseHttpUrl(raw: string | null | undefined): URL | null {
  const trimmed = raw?.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

function detectVideoPlatform(url: URL | null): {
  label: string
  variant: "primary" | "default" | "secondary"
} | null {
  if (!url) return null
  const host = url.hostname.toLowerCase().replace(/^www\./, "")
  const path = url.pathname.toLowerCase()

  if (host === "youtu.be" || host.endsWith("youtube.com")) {
    return {
      label: path.includes("/shorts/") ? "YouTube Shorts" : "YouTube",
      variant: "primary",
    }
  }
  if (host.endsWith("instagram.com")) {
    return {
      label: path.includes("/reel") ? "Instagram Reels" : "Instagram",
      variant: "default",
    }
  }
  if (host.endsWith("tiktok.com")) {
    return {
      label: "TikTok",
      variant: "default",
    }
  }
  return {
    label: "Tautan Video",
    variant: "secondary",
  }
}

function getSohStatus(soh: number | null | undefined): {
  label: string
  variant: "success" | "warning" | "destructive"
} | null {
  if (typeof soh !== "number" || !Number.isFinite(soh)) return null
  if (soh >= 90) return { label: "Sangat Sehat", variant: "success" }
  if (soh >= 80) return { label: "Kondisi Baik", variant: "warning" }
  return { label: "Perlu Catatan", variant: "destructive" }
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-destructive"
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  )
}

export function CarEvInsightsForm({
  value,
  onChange,
  errors,
  disabled = false,
}: CarEvInsightsFormProps) {
  const idPrefix = React.useId()
  const [issueDraft, setIssueDraft] = React.useState("")
  const [hybridDismissed, setHybridDismissed] = React.useState(false)
  const prevFuelTypeRef = React.useRef<FuelType>(value.fuelType)

  // Automatically re-open Hybrid EV specs whenever staff switches fuelType into "hybrid"
  React.useEffect(() => {
    if (prevFuelTypeRef.current !== value.fuelType) {
      prevFuelTypeRef.current = value.fuelType
      if (value.fuelType === "hybrid") {
        setHybridDismissed(false)
      }
    }
  }, [value.fuelType])

  const isMandatoryEv = value.fuelType === "ev" || value.fuelType === "phev"
  const isHybrid = value.fuelType === "hybrid"
  const isElectrified = isMandatoryEv || isHybrid
  const isEvSectionOpen =
    isMandatoryEv || (isHybrid && (!hybridDismissed || value.evSpecs !== null))

  const evSpecs: EvSpecs = value.evSpecs ?? {}
  const hasSavedEvSpecs =
    value.evSpecs !== null &&
    value.evSpecs !== undefined &&
    !isEmptyEvSpecs(value.evSpecs)

  const insights: CreatorInsights = value.creatorInsights ?? {}
  const issueItems = React.useMemo(
    () => parseIssueTags(insights.commonIssuesChecked),
    [insights.commonIssuesChecked]
  )

  const parsedVideoUrl = React.useMemo(
    () => parseHttpUrl(value.videoWalkaroundUrl),
    [value.videoWalkaroundUrl]
  )
  const videoPlatform = React.useMemo(
    () => detectVideoPlatform(parsedVideoUrl),
    [parsedVideoUrl]
  )
  const sohStatus = getSohStatus(evSpecs.batterySohPercent)

  const fuelConsumptionPresets =
    value.fuelType === "ev"
      ? FUEL_CONSUMPTION_PRESETS_EV
      : value.fuelType === "hybrid" || value.fuelType === "phev"
        ? FUEL_CONSUMPTION_PRESETS_HYBRID
        : FUEL_CONSUMPTION_PRESETS_ICE

  function updateEvSpecs(patch: Partial<EvSpecs>) {
    const next: EvSpecs = {
      ...evSpecs,
      ...patch,
    }
    onChange({
      evSpecs: isEmptyEvSpecs(next) ? null : next,
    })
  }

  function handleHybridToggle(checked: boolean) {
    if (disabled) return
    if (checked) {
      setHybridDismissed(false)
      onChange({
        evSpecs: value.evSpecs ?? {},
      })
    } else {
      setHybridDismissed(true)
      onChange({
        evSpecs: null,
      })
    }
  }

  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    kind: "evSpecs" | "video" | "issue" | "issuesAll"
    index?: number
  } | null>(null)
  const displayedDeleteConfirm = useStableDialogData(deleteConfirm)

  function handleClearEvSpecs() {
    if (disabled) return
    onChange({ evSpecs: null })
    setDeleteConfirm(null)
  }

  function handleEvNumberChange(
    field:
      | "batterySohPercent"
      | "batteryCapacityKwh"
      | "claimedRangeKm"
      | "realRangeKm",
    raw: string,
    integerOnly: boolean
  ) {
    const trimmed = raw.trim()
    if (!trimmed) {
      updateEvSpecs({ [field]: null })
      return
    }
    const parsed = integerOnly
      ? Number.parseInt(trimmed, 10)
      : Number.parseFloat(trimmed)
    if (Number.isFinite(parsed)) {
      updateEvSpecs({ [field]: parsed })
    }
  }

  function updateCreatorInsights(patch: Partial<CreatorInsights>) {
    const next: CreatorInsights = {
      ...insights,
      ...patch,
    }
    onChange({
      creatorInsights: isEmptyCreatorInsights(next) ? null : next,
    })
  }

  function handleAddIssue(rawText: string) {
    if (disabled) return
    const cleaned = rawText.trim()
    if (!cleaned) return
    const exists = issueItems.some(
      (item) => item.toLowerCase() === cleaned.toLowerCase()
    )
    if (exists) {
      setIssueDraft("")
      return
    }
    updateCreatorInsights({
      commonIssuesChecked: serializeIssueTags([...issueItems, cleaned]),
    })
    setIssueDraft("")
  }

  function handleRemoveIssue(index: number) {
    if (disabled) return
    const next = issueItems.filter((_, idx) => idx !== index)
    updateCreatorInsights({
      commonIssuesChecked: serializeIssueTags(next),
    })
    setDeleteConfirm(null)
  }

  const evSpecsError = getFieldError(errors, "evSpecs")
  const batterySohError = getFieldError(errors, "evSpecs.batterySohPercent")
  const batteryCapacityError = getFieldError(
    errors,
    "evSpecs.batteryCapacityKwh"
  )
  const claimedRangeError = getFieldError(errors, "evSpecs.claimedRangeKm")
  const realRangeError = getFieldError(errors, "evSpecs.realRangeKm")
  const chargingPortError = getFieldError(errors, "evSpecs.chargingPortType")
  const fastChargeError = getFieldError(errors, "evSpecs.fastChargingInfo")
  const batteryWarrantyError = getFieldError(
    errors,
    "evSpecs.batteryWarrantyInfo"
  )
  const videoUrlError = getFieldError(errors, "videoWalkaroundUrl")
  const fuelConsumptionError = getFieldError(
    errors,
    "creatorInsights.realWorldFuelConsumption"
  )
  const maintenanceCostError = getFieldError(
    errors,
    "creatorInsights.estimatedMaintenanceCost"
  )
  const commonIssuesError = getFieldError(
    errors,
    "creatorInsights.commonIssuesChecked"
  )
  const expertNotesError = getFieldError(errors, "creatorInsights.expertNotes")

  return (
    <div className="space-y-6">
      <FormSectionAccordion
        defaultValue={["ev-specs", "video-walkaround", "creator-insights"]}
      >
        {/* SECTION 01 — EV & HYBRID SPECS (CONDITIONAL) */}
        <FormSectionAccordionItem
          value="ev-specs"
          headingId={`${idPrefix}-ev-heading`}
          eyebrow="01 / EV & Hybrid"
          title="Spesifikasi Baterai & Pengisian"
          icon={BatteryCharging}
          badge={
            <Badge variant={isElectrified ? "primary" : "secondary"}>
              <Zap className="size-3" aria-hidden="true" />
              {FUEL_LABELS[value.fuelType]}
            </Badge>
          }
          actions={
            isHybrid ? (
              <Switch
                checked={isEvSectionOpen}
                disabled={disabled}
                aria-label="Aktifkan spesifikasi baterai Hybrid"
                onCheckedChange={handleHybridToggle}
              />
            ) : null
          }
        >

        {!isElectrified ? (
          <div className="space-y-3">
            <div className="flex items-start gap-3 border border-border bg-secondary/40 p-4 text-sm leading-relaxed text-muted-foreground">
              <Info
                className="mt-0.5 size-4 shrink-0 text-foreground"
                aria-hidden="true"
              />
              <div>
                <p className="font-semibold text-foreground">
                  Panel nonaktif untuk unit {FUEL_LABELS[value.fuelType]}
                </p>
                <p className="mt-0.5">
                  Ubah{" "}
                  <strong className="font-semibold text-foreground">
                    Jenis Bahan Bakar
                  </strong>{" "}
                  di tab Identitas &amp; Spek ke Hybrid, PHEV, atau EV untuk
                  mengisi.
                </p>
              </div>
            </div>

            {hasSavedEvSpecs ? (
              <div
                role="status"
                className="flex flex-col gap-3 border border-amber-700/35 bg-amber-50 p-4 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle
                    className="mt-0.5 size-4 shrink-0 text-amber-800"
                    aria-hidden="true"
                  />
                  <div>
                    <p className="font-semibold">
                      Masih tersimpan data EV/Hybrid dari pilihan bahan bakar
                      sebelumnya
                    </p>
                    <p className="mt-0.5 text-amber-900">
                      Bersihkan data ini agar informasi baterai tidak ikut
                      tersimpan pada unit non-listrik.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => setDeleteConfirm({ kind: "evSpecs" })}
                  className="shrink-0 border-amber-800/40 bg-white text-amber-950 hover:bg-amber-100"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  <span>Bersihkan Data EV</span>
                </Button>
              </div>
            ) : null}
          </div>
        ) : !isEvSectionOpen ? (
          <div className="mt-5 flex flex-col gap-3 border border-dashed border-border bg-secondary/30 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>
              Spesifikasi baterai Hybrid nonaktif. Aktifkan sakelar di kanan
              atas untuk mengisi SOH atau garansi baterai.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={() => handleHybridToggle(true)}
              className="shrink-0"
            >
              Aktifkan Panel Hybrid
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {isHybrid ? (
              <div className="flex items-start gap-2.5 border border-border bg-secondary/35 px-3.5 py-2.5 text-sm text-muted-foreground">
                <Info
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  Isi kolom yang relevan untuk <strong>Hybrid (HEV)</strong>{" "}
                  (mis. SOH &amp; garansi baterai).
                </span>
              </div>
            ) : null}

            {/* Row 1: SOH, Kapasitas kWh, Range Klaim, Range Riil */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={`${idPrefix}-soh`}
                    className="text-sm font-semibold tracking-wider text-foreground uppercase"
                  >
                    SOH Baterai (%)
                  </label>
                  {sohStatus ? (
                    <Badge variant={sohStatus.variant}>{sohStatus.label}</Badge>
                  ) : null}
                </div>
                <Input
                  id={`${idPrefix}-soh`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="0.5"
                  value={evSpecs.batterySohPercent ?? ""}
                  disabled={disabled}
                  aria-invalid={Boolean(batterySohError)}
                  onChange={(e) =>
                    handleEvNumberChange(
                      "batterySohPercent",
                      e.target.value,
                      false
                    )
                  }
                  placeholder="96"
                  className="tabular-nums"
                />
                <FieldError message={batterySohError} />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor={`${idPrefix}-kwh`}
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Kapasitas Baterai (kWh)
                </label>
                <Input
                  id={`${idPrefix}-kwh`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.1"
                  value={evSpecs.batteryCapacityKwh ?? ""}
                  disabled={disabled}
                  aria-invalid={Boolean(batteryCapacityError)}
                  onChange={(e) =>
                    handleEvNumberChange(
                      "batteryCapacityKwh",
                      e.target.value,
                      false
                    )
                  }
                  placeholder="50.4"
                  className="tabular-nums"
                />
                <FieldError message={batteryCapacityError} />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor={`${idPrefix}-range-claimed`}
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Jarak Tempuh Klaim (km)
                </label>
                <Input
                  id={`${idPrefix}-range-claimed`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={evSpecs.claimedRangeKm ?? ""}
                  disabled={disabled}
                  aria-invalid={Boolean(claimedRangeError)}
                  onChange={(e) =>
                    handleEvNumberChange("claimedRangeKm", e.target.value, true)
                  }
                  placeholder="410 (WLTP / NEDC)"
                  className="tabular-nums"
                />
                <FieldError message={claimedRangeError} />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor={`${idPrefix}-range-real`}
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Jarak Tempuh Riil (km)
                </label>
                <Input
                  id={`${idPrefix}-range-real`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  value={evSpecs.realRangeKm ?? ""}
                  disabled={disabled}
                  aria-invalid={Boolean(realRangeError)}
                  onChange={(e) =>
                    handleEvNumberChange("realRangeKm", e.target.value, true)
                  }
                  placeholder="340 (AC menyala)"
                  className="tabular-nums"
                />
                <FieldError message={realRangeError} />
              </div>
            </div>

            {/* Row 2: Charging Port & Fast Charging */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor={`${idPrefix}-charging-port`}
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Tipe Port Charging
                </label>
                <Input
                  id={`${idPrefix}-charging-port`}
                  value={evSpecs.chargingPortType ?? ""}
                  disabled={disabled}
                  aria-invalid={Boolean(chargingPortError)}
                  onChange={(e) =>
                    updateEvSpecs({
                      chargingPortType: e.target.value || null,
                    })
                  }
                  placeholder="Type 2 / CCS2"
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {CHARGING_PORT_PRESETS.map((preset) => {
                    const active =
                      (evSpecs.chargingPortType ?? "").trim() === preset
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          updateEvSpecs({ chargingPortType: preset })
                        }
                        className={cn(
                          "min-h-8 cursor-pointer border px-2.5 py-1 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-secondary/60 text-foreground hover:bg-secondary"
                        )}
                      >
                        {preset}
                      </button>
                    )
                  })}
                </div>
                <FieldError message={chargingPortError} />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor={`${idPrefix}-fast-charge`}
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Info Fast Charging &amp; Durasi
                </label>
                <Input
                  id={`${idPrefix}-fast-charge`}
                  value={evSpecs.fastChargingInfo ?? ""}
                  disabled={disabled}
                  aria-invalid={Boolean(fastChargeError)}
                  onChange={(e) =>
                    updateEvSpecs({
                      fastChargingInfo: e.target.value || null,
                    })
                  }
                  placeholder="DC Fast Charge 30-80% ±35 menit"
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {FAST_CHARGE_PRESETS.map((preset) => {
                    const active =
                      (evSpecs.fastChargingInfo ?? "").trim() === preset
                    return (
                      <button
                        key={preset}
                        type="button"
                        disabled={disabled}
                        onClick={() =>
                          updateEvSpecs({ fastChargingInfo: preset })
                        }
                        className={cn(
                          "min-h-8 cursor-pointer border px-2.5 py-1 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                          active
                            ? "border-foreground bg-foreground text-background"
                            : "border-border bg-secondary/60 text-foreground hover:bg-secondary"
                        )}
                      >
                        {preset}
                      </button>
                    )
                  })}
                </div>
                <FieldError message={fastChargeError} />
              </div>
            </div>

            {/* Row 3: Charger Inclusion Switches */}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex items-center justify-between gap-3 border border-border bg-background/70 p-3.5">
                <div className="space-y-0.5">
                  <label
                    htmlFor={`${idPrefix}-portable-charger`}
                    className="block text-sm font-semibold text-foreground"
                  >
                    Portable Charger Termasuk
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Kabel pengisian AC rumahan.
                  </p>
                </div>
                <Switch
                  id={`${idPrefix}-portable-charger`}
                  checked={Boolean(evSpecs.portableChargerIncluded)}
                  disabled={disabled}
                  className="shrink-0"
                  onCheckedChange={(checked) =>
                    updateEvSpecs({ portableChargerIncluded: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between gap-3 border border-border bg-background/70 p-3.5">
                <div className="space-y-0.5">
                  <label
                    htmlFor={`${idPrefix}-wall-charger`}
                    className="block text-sm font-semibold text-foreground"
                  >
                    Wall Charger Termasuk
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Unit wallbox AC 7 kW ikut disertakan.
                  </p>
                </div>
                <Switch
                  id={`${idPrefix}-wall-charger`}
                  checked={Boolean(evSpecs.wallChargerIncluded)}
                  disabled={disabled}
                  className="shrink-0"
                  onCheckedChange={(checked) =>
                    updateEvSpecs({ wallChargerIncluded: checked })
                  }
                />
              </div>
            </div>

            {/* Row 4: Battery Warranty + Transferable */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor={`${idPrefix}-battery-warranty`}
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Garansi Baterai
                </label>
                <Input
                  id={`${idPrefix}-battery-warranty`}
                  value={evSpecs.batteryWarrantyInfo ?? ""}
                  disabled={disabled}
                  aria-invalid={Boolean(batteryWarrantyError)}
                  onChange={(e) =>
                    updateEvSpecs({
                      batteryWarrantyInfo: e.target.value || null,
                    })
                  }
                  placeholder="Garansi baterai ATPM 8 tahun / 160.000 km"
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {BATTERY_WARRANTY_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      disabled={disabled}
                      onClick={() =>
                        updateEvSpecs({ batteryWarrantyInfo: preset })
                      }
                      className="min-h-8 cursor-pointer border border-border bg-secondary/60 px-2.5 py-1 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                <FieldError message={batteryWarrantyError} />
              </div>

              <div className="flex items-center justify-between gap-4 border border-border bg-background/70 p-3.5">
                <div className="space-y-0.5">
                  <label
                    htmlFor={`${idPrefix}-warranty-transferable`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-foreground"
                  >
                    <ShieldCheck
                      className="size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>Garansi Pindah Tangan</span>
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Tetap berlaku untuk pemilik berikutnya.
                  </p>
                </div>
                <Switch
                  id={`${idPrefix}-warranty-transferable`}
                  checked={Boolean(evSpecs.batteryWarrantyTransferable)}
                  disabled={disabled}
                  className="shrink-0"
                  onCheckedChange={(checked) =>
                    updateEvSpecs({ batteryWarrantyTransferable: checked })
                  }
                />
              </div>
            </div>

            <FieldError message={evSpecsError} />
          </div>
        )}
      </FormSectionAccordionItem>

      {/* SECTION 02 — VIDEO WALKAROUND */}
      <FormSectionAccordionItem
        value="video-walkaround"
        headingId={`${idPrefix}-video-heading`}
        eyebrow="02 / Video"
        title="Walkaround & Review"
        description="YouTube, Instagram Reels, atau TikTok."
        icon={Video}
        badge={
          videoPlatform ? (
            <Badge variant={videoPlatform.variant}>
              <PlayCircle className="size-3" aria-hidden="true" />
              {videoPlatform.label}
            </Badge>
          ) : null
        }
      >
        <div className="space-y-2">
          <label
            htmlFor={`${idPrefix}-video-url`}
            className="block text-sm font-semibold tracking-wider text-foreground uppercase"
          >
            URL Video Walkaround (Opsional)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={`${idPrefix}-video-url`}
              type="url"
              value={value.videoWalkaroundUrl ?? ""}
              disabled={disabled}
              aria-invalid={Boolean(videoUrlError)}
              aria-describedby={
                videoUrlError ? `${idPrefix}-video-url-error` : undefined
              }
              onChange={(e) =>
                onChange({
                  videoWalkaroundUrl: e.target.value ? e.target.value : null,
                })
              }
              placeholder="Tautan YouTube, Instagram Reels, atau TikTok"
              className="flex-1"
            />
            <div className="flex shrink-0 items-center gap-2">
              {parsedVideoUrl ? (
                <a
                  href={parsedVideoUrl.toString()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "no-underline"
                  )}
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  <span>Pratinjau Video</span>
                </a>
              ) : (
                <Button type="button" variant="outline" disabled>
                  <ExternalLink className="size-4" aria-hidden="true" />
                  <span>Pratinjau Video</span>
                </Button>
              )}

              {value.videoWalkaroundUrl ? (
                <Tooltip>
                  <TooltipTrigger render={<span className="inline-flex" />}>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={disabled}
                      aria-label="Hapus tautan video"
                      onClick={() => setDeleteConfirm({ kind: "video" })}
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Hapus tautan video</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </div>

          <FieldError
            id={`${idPrefix}-video-url-error`}
            message={videoUrlError}
          />
        </div>
      </FormSectionAccordionItem>

      {/* SECTION 03 — CREATOR / EXPERT INSIGHTS */}
      <FormSectionAccordionItem
        value="creator-insights"
        headingId={`${idPrefix}-insights-heading`}
        eyebrow="03 / Insight"
        title="Catatan Ahli & Pemakaian Riil"
        icon={Sparkles}
        badge={
          issueItems.length > 0 ? (
            <Badge variant="success" className="tabular-nums">
              <CheckCircle2 className="size-3" aria-hidden="true" />
              {issueItems.length} titik dicek
            </Badge>
          ) : null
        }
      >
        <div className="space-y-6">
          {/* Konsumsi BBM & Biaya Perawatan */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="space-y-1.5">
              <label
                htmlFor={`${idPrefix}-fuel-consumption`}
                className="flex items-center gap-1.5 text-sm font-semibold tracking-wider text-foreground uppercase"
              >
                <Fuel
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>
                  {value.fuelType === "ev"
                    ? "Efisiensi Listrik Riil"
                    : "Konsumsi BBM Riil"}
                </span>
              </label>
              <Input
                id={`${idPrefix}-fuel-consumption`}
                value={insights.realWorldFuelConsumption ?? ""}
                disabled={disabled}
                aria-invalid={Boolean(fuelConsumptionError)}
                onChange={(e) =>
                  updateCreatorInsights({
                    realWorldFuelConsumption: e.target.value || null,
                  })
                }
                placeholder={
                  value.fuelType === "ev"
                    ? "6,8 km/kWh dalam kota"
                    : "12–14 km/L dalam kota, 16–18 km/L tol"
                }
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {fuelConsumptionPresets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      updateCreatorInsights({
                        realWorldFuelConsumption: preset,
                      })
                    }
                    className="min-h-8 cursor-pointer border border-border bg-secondary/60 px-2.5 py-1 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <FieldError message={fuelConsumptionError} />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor={`${idPrefix}-maintenance-cost`}
                className="flex items-center gap-1.5 text-sm font-semibold tracking-wider text-foreground uppercase"
              >
                <Wrench
                  className="size-3.5 text-muted-foreground"
                  aria-hidden="true"
                />
                <span>Biaya Perawatan / Tahun</span>
              </label>
              <Input
                id={`${idPrefix}-maintenance-cost`}
                value={insights.estimatedMaintenanceCost ?? ""}
                disabled={disabled}
                aria-invalid={Boolean(maintenanceCostError)}
                onChange={(e) =>
                  updateCreatorInsights({
                    estimatedMaintenanceCost: e.target.value || null,
                  })
                }
                placeholder="Rp2,5–3,5 jt/tahun (servis berkala)"
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {MAINTENANCE_COST_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      updateCreatorInsights({
                        estimatedMaintenanceCost: preset,
                      })
                    }
                    className="min-h-8 cursor-pointer border border-border bg-secondary/60 px-2.5 py-1 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {preset}
                  </button>
                ))}
              </div>
              <FieldError message={maintenanceCostError} />
            </div>
          </div>

          {/* Penyakit Khas / Titik Kritis Sudah Dicek (Dynamic Tag/List) */}
          <div className="border border-border bg-background/60 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Gauge
                  className="size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <h4 className="font-heading text-sm font-bold text-foreground">
                  Titik Kritis yang Sudah Dicek
                </h4>
              </div>
              {issueItems.length > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() => setDeleteConfirm({ kind: "issuesAll" })}
                  className="min-h-8 border-destructive/30 px-2.5 text-sm text-destructive hover:border-destructive hover:bg-destructive/10 hover:text-[#991B1B]"
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  <span>Kosongkan</span>
                </Button>
              ) : null}
            </div>

            {issueItems.length > 0 ? (
              <ul
                className="mt-3 flex flex-wrap gap-2"
                aria-label="Daftar titik kritis yang sudah dicek"
              >
                {issueItems.map((item, idx) => (
                  <li
                    key={`${item}-${idx}`}
                    className="inline-flex min-h-9 items-center gap-2 border border-emerald-800/30 bg-emerald-50 py-1 pr-1.5 pl-3 text-sm font-medium text-emerald-950"
                  >
                    <CheckCircle2
                      className="size-3.5 shrink-0 text-emerald-700"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={`Hapus poin ${item}`}
                      onClick={() => setDeleteConfirm({ kind: "issue", index: idx })}
                      className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center text-emerald-800 transition-colors hover:bg-emerald-200/70 hover:text-emerald-950 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <X className="size-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-3 border border-dashed border-border bg-card px-4 py-4 text-center text-sm text-muted-foreground">
                Belum ada titik pengecekan.
              </div>
            )}

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <Input
                id={`${idPrefix}-common-issue-input`}
                aria-label="Tambah titik kritis yang sudah dicek"
                value={issueDraft}
                disabled={disabled}
                onChange={(e) => setIssueDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddIssue(issueDraft)
                  }
                }}
                placeholder="Rack steer senyap & motor EPS sehat"
                className="flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                disabled={disabled || issueDraft.trim().length === 0}
                onClick={() => handleAddIssue(issueDraft)}
              >
                <Plus className="size-4" aria-hidden="true" />
                <span>Tambah</span>
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {COMMON_ISSUE_PRESETS.map((preset) => {
                const alreadyAdded = issueItems.some(
                  (item) => item.toLowerCase() === preset.toLowerCase()
                )
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={disabled || alreadyAdded}
                    onClick={() => handleAddIssue(preset)}
                    className={cn(
                      "min-h-8 cursor-pointer border px-2.5 py-1 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45",
                      alreadyAdded
                        ? "border-emerald-800/30 bg-emerald-50 text-emerald-900"
                        : "border-border bg-card text-foreground hover:bg-secondary"
                    )}
                  >
                    {alreadyAdded ? "✓ " : "+ "}
                    {preset}
                  </button>
                )
              })}
            </div>

            <FieldError message={commonIssuesError} />
          </div>

          {/* Catatan Ahli */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={`${idPrefix}-expert-notes`}
                className="block text-sm font-semibold tracking-wider text-foreground uppercase"
              >
                Catatan Ahli
              </label>
              <span className="text-sm text-muted-foreground tabular-nums">
                {(insights.expertNotes ?? "").length} karakter
              </span>
            </div>
            <Textarea
              id={`${idPrefix}-expert-notes`}
              rows={5}
              value={insights.expertNotes ?? ""}
              disabled={disabled}
              aria-invalid={Boolean(expertNotesError)}
              onChange={(e) =>
                updateCreatorInsights({
                  expertNotes: e.target.value || null,
                })
              }
              placeholder="Rangkuman karakter mobil, profil pembeli yang cocok, dan kelebihan utama..."
            />
            <FieldError message={expertNotesError} />
          </div>
        </div>
      </FormSectionAccordionItem>
      </FormSectionAccordion>

      <Dialog
        open={Boolean(deleteConfirm)}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {displayedDeleteConfirm?.kind === "evSpecs"
                ? "Bersihkan Data Spesifikasi EV?"
                : displayedDeleteConfirm?.kind === "video"
                  ? "Hapus Tautan Video?"
                  : displayedDeleteConfirm?.kind === "issuesAll"
                    ? "Kosongkan Semua Titik Kritis?"
                    : "Hapus Poin Pengecekan?"}
            </DialogTitle>
            <DialogDescription>
              {displayedDeleteConfirm?.kind === "evSpecs"
                ? "Seluruh data spesifikasi baterai EV yang tersimpan sebelumnya akan dibersihkan dari unit ini."
                : displayedDeleteConfirm?.kind === "video"
                  ? "Tautan video walkaround & review unit akan dihapus."
                  : displayedDeleteConfirm?.kind === "issuesAll"
                    ? "Seluruh daftar titik kritis yang sudah dicek akan dihapus."
                    : displayedDeleteConfirm?.index !== undefined &&
                        issueItems[displayedDeleteConfirm.index]
                      ? `Poin "${issueItems[displayedDeleteConfirm.index]}" akan dihapus dari daftar titik kritis yang sudah dicek.`
                      : "Poin pengecekan akan dihapus dari daftar."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Batal
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (!deleteConfirm) return
                if (deleteConfirm.kind === "evSpecs") {
                  handleClearEvSpecs()
                } else if (deleteConfirm.kind === "video") {
                  onChange({ videoWalkaroundUrl: null })
                  setDeleteConfirm(null)
                } else if (deleteConfirm.kind === "issuesAll") {
                  updateCreatorInsights({ commonIssuesChecked: null })
                  setDeleteConfirm(null)
                } else if (deleteConfirm.index !== undefined) {
                  handleRemoveIssue(deleteConfirm.index)
                }
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              <span>Ya, Hapus</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
