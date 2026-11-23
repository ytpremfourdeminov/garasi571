import * as React from "react"
import { cn } from "cn"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Info,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { formatRupiah } from "@/lib/domain/formatters"
import type { CarUpsertInput } from "@/lib/domain/schemas"
import type {
  CarImperfection,
  DocumentChecklist,
  ImperfectionSeverity,
  InspectionSummary,
} from "@/lib/domain/types"

export interface CarLegalityInspectionFormProps {
  value: CarUpsertInput
  onChange: (patch: Partial<CarUpsertInput>) => void
  errors?: Record<string, string>
  disabled?: boolean
}

const UNSET_SELECT_VALUE = "__unset__"

const PLATE_AREA_PRESETS = ["AD", "B", "AB", "H", "D", "L", "K"] as const

const PLATE_ODD_EVEN_OPTIONS: ReadonlyArray<{ value: string; label: string }> =
  [
    { value: UNSET_SELECT_VALUE, label: "Belum dipilih" },
    { value: "Ganjil", label: "Ganjil" },
    { value: "Genap", label: "Genap" },
    { value: "-", label: "- (Tidak berlaku / Bebas)" },
  ]

const TAX_STATUS_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: UNSET_SELECT_VALUE, label: "Belum dipilih" },
  { value: "Hidup", label: "Hidup (Aktif)" },
  { value: "Pajak Baru", label: "Pajak Baru (Baru Diperpanjang)" },
  { value: "Mati", label: "Mati / Terlambat" },
]

const OWNERSHIP_TYPE_OPTIONS: ReadonlyArray<{ value: string; label: string }> =
  [
    { value: UNSET_SELECT_VALUE, label: "Belum dipilih" },
    { value: "Perorangan", label: "Perorangan (Atas Nama Pribadi)" },
    { value: "PT/Perusahaan", label: "PT / Perusahaan" },
  ]

const OWNERSHIP_HAND_PRESETS = [1, 2, 3] as const

const USAGE_HISTORY_PRESETS = [
  "Pemakaian pribadi",
  "Pemakaian pribadi dalam kota",
  "Eks operasional kantor",
] as const

interface DocumentChecklistMeta {
  key: keyof DocumentChecklist
  label: string
  description: string
  tier: "wajib" | "opsional" | "bawaan"
}

const DOCUMENT_CHECKLIST_ITEMS: ReadonlyArray<DocumentChecklistMeta> = [
  {
    key: "stnk",
    label: "STNK Asli",
    description: "Surat Tanda Nomor Kendaraan fisik tersedia & terbaca jelas",
    tier: "wajib",
  },
  {
    key: "bpkb",
    label: "BPKB Asli",
    description: "Buku Pemilik Kendaraan Bermotor asli siap serah terima",
    tier: "wajib",
  },
  {
    key: "faktur",
    label: "Faktur Pembelian",
    description: "Faktur resmi dealer / ATPM untuk kemudahan balik nama",
    tier: "wajib",
  },
  {
    key: "nik",
    label: "Sertifikat NIK / Form A",
    description: "Nomor Identifikasi Kendaraan atau Form A (khusus CBU)",
    tier: "opsional",
  },
  {
    key: "manualBook",
    label: "Buku Manual",
    description: "Buku panduan pemilik bawaan pabrikan tersimpan rapi",
    tier: "bawaan",
  },
  {
    key: "serviceBook",
    label: "Buku Servis / Record",
    description: "Catatan perawatan berkala bengkel resmi atau spesialis",
    tier: "bawaan",
  },
  {
    key: "spareKey",
    label: "Kunci Serep",
    description: "Kunci cadangan (keyless / immobilizer / standar) berfungsi",
    tier: "bawaan",
  },
]

const GRADE_PRESETS = ["A", "A-", "B+", "B", "C"] as const

const TIRE_CONDITION_PRESETS = [
  "Tebal 85-90% (4 ban merata)",
  "Tebal 70-80%",
  "Baru ganti 4 ban",
  "Depan 80% / Belakang 65%",
] as const

const WARRANTY_PRESETS = [
  "Garansi Mesin & Transmisi 30 Hari + Buyback 100% Bebas Banjir/Tabrak",
  "Garansi Buyback 100% Bebas Banjir & Tabrak Besar (S&K berlaku)",
  "Garansi Mesin, Transmisi & AC 14 Hari + Bantuan Balik Nama",
] as const

const MAINTENANCE_PRESETS = [
  "Ganti oli mesin baru",
  "Aki baru",
  "Filter oli & udara baru",
  "Kampas rem baru",
  "Spooring & balancing",
  "Servis AC & isi freon",
  "Detailing interior & eksterior",
] as const

const SEVERITY_ITEMS: Record<ImperfectionSeverity, string> = {
  minor: "Minor — Kosmetik / wajar pemakaian",
  moderate: "Moderate — Perlu perhatian / perbaikan",
}

const MONTH_SHORT_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const

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

function buildSelectOptions(
  base: ReadonlyArray<{ value: string; label: string }>,
  currentValue: string | null | undefined
): {
  options: Array<{ value: string; label: string }>
  itemsMap: Record<string, string>
  selectedValue: string
} {
  const options = [...base]
  const trimmed = currentValue?.trim() ?? ""
  const hasCurrent =
    trimmed.length > 0 && options.some((opt) => opt.value === trimmed)

  if (trimmed.length > 0 && !hasCurrent) {
    options.push({ value: trimmed, label: trimmed })
  }

  const itemsMap: Record<string, string> = {}
  for (const opt of options) {
    itemsMap[opt.value] = opt.label
  }

  return {
    options,
    itemsMap,
    selectedValue: trimmed.length > 0 ? trimmed : UNSET_SELECT_VALUE,
  }
}

function formatMonthYearId(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(isoDate.trim())
  if (!match) return null
  const year = match[1]
  const monthIndex = Number.parseInt(match[2], 10) - 1
  if (monthIndex < 0 || monthIndex > 11) return null
  return `${MONTH_SHORT_ID[monthIndex]} ${year}`
}

function buildSuggestedPlateInfo(value: CarUpsertInput): string | null {
  const parts: string[] = []
  const area = value.plateAreaCode?.trim().toUpperCase()
  const status = value.taxStatus?.trim()
  const expiryLabel = formatMonthYearId(value.taxExpiryDate)

  if (area) {
    parts.push(`Plat ${area}`)
  }

  if (status === "Pajak Baru") {
    parts.push(expiryLabel ? `Pajak baru s/d ${expiryLabel}` : "Pajak baru")
  } else if (status === "Hidup") {
    parts.push(expiryLabel ? `Pajak hidup s/d ${expiryLabel}` : "Pajak panjang")
  } else if (status === "Mati") {
    parts.push(expiryLabel ? `Pajak off sejak ${expiryLabel}` : "Pajak off")
  } else if (expiryLabel) {
    parts.push(`Pajak s/d ${expiryLabel}`)
  }

  return parts.length > 0 ? parts.join(" - ") : null
}

function SectionHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  trailing,
}: {
  eyebrow: string
  title: string
  description?: string
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.14em] text-primary uppercase">
          <Icon className="size-3.5 shrink-0" aria-hidden={true} />
          <span>{eyebrow}</span>
        </div>
        <h3 className="font-heading text-lg font-bold tracking-tight text-foreground">
          {title}
        </h3>
        {description ? (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  )
}

function FieldError({ id, message }: { id?: string; message?: string }) {
  if (!message) return null
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 text-sm font-medium text-destructive"
    >
      {message}
    </p>
  )
}

export function CarLegalityInspectionForm({
  value,
  onChange,
  errors,
  disabled = false,
}: CarLegalityInspectionFormProps) {
  const idPrefix = React.useId()
  const [maintenanceDraft, setMaintenanceDraft] = React.useState("")

  const checklist = value.documentChecklist
  const inspection = value.inspectionSummary
  const recentMaintenance = value.recentMaintenance
  const imperfections = value.imperfections

  const checkedDocsCount = DOCUMENT_CHECKLIST_ITEMS.filter((item) =>
    Boolean(checklist[item.key])
  ).length
  const requiredDocsChecked =
    Boolean(checklist.stnk) &&
    Boolean(checklist.bpkb) &&
    Boolean(checklist.faktur)
  const allDocsChecked = checkedDocsCount === DOCUMENT_CHECKLIST_ITEMS.length

  const plateOddEvenSelect = buildSelectOptions(
    PLATE_ODD_EVEN_OPTIONS,
    value.plateOddEven
  )
  const taxStatusSelect = buildSelectOptions(
    TAX_STATUS_OPTIONS,
    value.taxStatus
  )
  const ownershipTypeSelect = buildSelectOptions(
    OWNERSHIP_TYPE_OPTIONS,
    value.ownershipType
  )

  const suggestedPlateInfo = buildSuggestedPlateInfo(value)

  function updateChecklist(patch: Partial<DocumentChecklist>) {
    onChange({
      documentChecklist: {
        ...checklist,
        ...patch,
      },
    })
  }

  function updateInspection(patch: Partial<InspectionSummary>) {
    onChange({
      inspectionSummary: {
        ...inspection,
        ...patch,
      },
    })
  }

  function handleAddMaintenanceItem(rawText: string) {
    const trimmed = rawText.trim()
    if (!trimmed) return
    const exists = recentMaintenance.some(
      (item) => item.trim().toLowerCase() === trimmed.toLowerCase()
    )
    if (exists) {
      setMaintenanceDraft("")
      return
    }
    onChange({
      recentMaintenance: [...recentMaintenance, trimmed],
    })
    setMaintenanceDraft("")
  }

  function handleUpdateMaintenanceItem(index: number, nextValue: string) {
    const next = recentMaintenance.map((item, i) =>
      i === index ? nextValue : item
    )
    onChange({ recentMaintenance: next })
  }

  function handleRemoveMaintenanceItem(index: number) {
    onChange({
      recentMaintenance: recentMaintenance.filter((_, i) => i !== index),
    })
  }

  function handleAddImperfection() {
    onChange({
      imperfections: [
        ...imperfections,
        {
          area: "",
          description: "",
          severity: "minor",
        },
      ],
    })
  }

  function handleUpdateImperfection(
    index: number,
    patch: Partial<CarImperfection>
  ) {
    const next = imperfections.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    )
    onChange({ imperfections: next })
  }

  function handleRemoveImperfection(index: number) {
    onChange({
      imperfections: imperfections.filter((_, i) => i !== index),
    })
  }

  const plateInfoError = getFieldError(errors, "plateInfo")
  const plateAreaCodeError = getFieldError(errors, "plateAreaCode")
  const plateOddEvenError = getFieldError(errors, "plateOddEven")
  const taxStatusError = getFieldError(errors, "taxStatus")
  const taxExpiryDateError = getFieldError(errors, "taxExpiryDate")
  const stnk5yrExpiryDateError = getFieldError(errors, "stnk5yrExpiryDate")
  const estimatedAnnualTaxError = getFieldError(errors, "estimatedAnnualTax")
  const ownershipTypeError = getFieldError(errors, "ownershipType")
  const ownershipHandError = getFieldError(errors, "ownershipHand")
  const usageHistoryError = getFieldError(errors, "usageHistory")
  const documentChecklistError = getFieldError(errors, "documentChecklist")
  const inspectionSummaryError = getFieldError(errors, "inspectionSummary")
  const exteriorGradeError = getFieldError(
    errors,
    "inspectionSummary.exteriorGrade"
  )
  const interiorGradeError = getFieldError(
    errors,
    "inspectionSummary.interiorGrade"
  )
  const engineTransmissionGradeError = getFieldError(
    errors,
    "inspectionSummary.engineTransmissionGrade"
  )
  const undercarriageSuspensionGradeError = getFieldError(
    errors,
    "inspectionSummary.undercarriageSuspensionGrade"
  )
  const tireConditionError = getFieldError(
    errors,
    "inspectionSummary.tireCondition"
  )
  const inspectionNotesError = getFieldError(errors, "inspectionSummary.notes")
  const warrantyInfoError = getFieldError(errors, "warrantyInfo")
  const recentMaintenanceError = getFieldError(errors, "recentMaintenance")
  const imperfectionsError = getFieldError(errors, "imperfections")

  return (
    <div className="space-y-6">
      {/* Section A: Legalitas, Plat & Pajak */}
      <section
        aria-labelledby={`${idPrefix}-sec-a-title`}
        className="space-y-5 border border-border bg-card p-5 sm:p-6"
      >
        <div id={`${idPrefix}-sec-a-title`}>
          <SectionHeader
            eyebrow="Bagian A · Legalitas & Pajak"
            title="Legalitas, Plat Nomor & Status Pajak"
            icon={FileCheck2}
          />
        </div>

        {/* Ringkasan Plat (tampil di kartu katalog) */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor={`${idPrefix}-plateInfo`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Ringkasan Plat &amp; Pajak (Kartu Katalog){" "}
              <span className="text-primary">*</span>
            </label>
            {suggestedPlateInfo ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onChange({ plateInfo: suggestedPlateInfo })}
                className="min-h-8 px-2.5 text-sm"
              >
                <Sparkles className="size-3" aria-hidden={true} />
                Gunakan: &ldquo;{suggestedPlateInfo}&rdquo;
              </Button>
            ) : null}
          </div>
          <Input
            id={`${idPrefix}-plateInfo`}
            value={value.plateInfo}
            onChange={(e) => onChange({ plateInfo: e.target.value })}
            placeholder="Contoh: AD - Pajak panjang Nov 2026"
            disabled={disabled}
            aria-invalid={Boolean(plateInfoError)}
            aria-describedby={
              plateInfoError
                ? `${idPrefix}-plateInfo-error`
                : `${idPrefix}-plateInfo-hint`
            }
          />
          <p
            id={`${idPrefix}-plateInfo-hint`}
            className="text-sm text-muted-foreground"
          >
            Teks ringkas yang tampil langsung pada kartu unit dan halaman
            katalog publik.
          </p>
          <FieldError
            id={`${idPrefix}-plateInfo-error`}
            message={plateInfoError}
          />
        </div>

        {/* Kode Wilayah, Ganjil/Genap, Status Pajak */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-plateAreaCode`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Kode Wilayah Plat
            </label>
            <Input
              id={`${idPrefix}-plateAreaCode`}
              value={value.plateAreaCode ?? ""}
              onChange={(e) => {
                const raw = e.target.value.toUpperCase()
                onChange({ plateAreaCode: raw.trim() ? raw : null })
              }}
              placeholder="Contoh: AD, B, AB, D, L, K"
              maxLength={8}
              disabled={disabled}
              aria-invalid={Boolean(plateAreaCodeError)}
              className="uppercase"
            />
            <div
              className="flex flex-wrap gap-1.5 pt-1"
              role="group"
              aria-label="Pilihan cepat kode wilayah plat"
            >
              {PLATE_AREA_PRESETS.map((code) => {
                const isSelected =
                  (value.plateAreaCode ?? "").trim().toUpperCase() === code
                return (
                  <button
                    key={code}
                    type="button"
                    disabled={disabled}
                    aria-pressed={isSelected}
                    onClick={() =>
                      onChange({ plateAreaCode: isSelected ? null : code })
                    }
                    className={cn(
                      "min-h-7 cursor-pointer border px-2 py-0.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-secondary text-secondary-foreground hover:border-foreground/50"
                    )}
                  >
                    {code}
                  </button>
                )
              })}
            </div>
            <FieldError message={plateAreaCodeError} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-plateOddEven`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Ganjil / Genap
            </label>
            <Select
              items={plateOddEvenSelect.itemsMap}
              value={plateOddEvenSelect.selectedValue}
              disabled={disabled}
              onValueChange={(next) => {
                if (!next || next === UNSET_SELECT_VALUE) {
                  onChange({ plateOddEven: null })
                  return
                }
                onChange({ plateOddEven: next })
              }}
            >
              <SelectTrigger
                id={`${idPrefix}-plateOddEven`}
                aria-invalid={Boolean(plateOddEvenError)}
                className="min-h-11 w-full bg-card px-3.5 text-sm text-foreground data-[size=default]:h-11"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {plateOddEvenSelect.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={plateOddEvenError} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-taxStatus`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Status Pajak
            </label>
            <Select
              items={taxStatusSelect.itemsMap}
              value={taxStatusSelect.selectedValue}
              disabled={disabled}
              onValueChange={(next) => {
                if (!next || next === UNSET_SELECT_VALUE) {
                  onChange({ taxStatus: null })
                  return
                }
                onChange({ taxStatus: next })
              }}
            >
              <SelectTrigger
                id={`${idPrefix}-taxStatus`}
                aria-invalid={Boolean(taxStatusError)}
                className="min-h-11 w-full bg-card px-3.5 text-sm text-foreground data-[size=default]:h-11"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {taxStatusSelect.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={taxStatusError} />
          </div>
        </div>

        {/* Jatuh Tempo Pajak Tahunan, Kaleng 5 Tahunan, Estimasi PKB */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-taxExpiryDate`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Jatuh Tempo Pajak Tahunan
            </label>
            <Input
              id={`${idPrefix}-taxExpiryDate`}
              type="date"
              value={value.taxExpiryDate ?? ""}
              onChange={(e) =>
                onChange({
                  taxExpiryDate: e.target.value ? e.target.value : null,
                })
              }
              disabled={disabled}
              aria-invalid={Boolean(taxExpiryDateError)}
            />
            <FieldError message={taxExpiryDateError} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-stnk5yrExpiryDate`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Masa Berlaku Kaleng (5 Tahunan)
            </label>
            <Input
              id={`${idPrefix}-stnk5yrExpiryDate`}
              type="date"
              value={value.stnk5yrExpiryDate ?? ""}
              onChange={(e) =>
                onChange({
                  stnk5yrExpiryDate: e.target.value ? e.target.value : null,
                })
              }
              disabled={disabled}
              aria-invalid={Boolean(stnk5yrExpiryDateError)}
            />
            <FieldError message={stnk5yrExpiryDateError} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-estimatedAnnualTax`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Estimasi PKB Tahunan (Rp)
            </label>
            <Input
              id={`${idPrefix}-estimatedAnnualTax`}
              type="number"
              inputMode="numeric"
              min={0}
              step={50000}
              value={value.estimatedAnnualTax ?? ""}
              onChange={(e) => {
                const raw = e.target.value.trim()
                if (!raw) {
                  onChange({ estimatedAnnualTax: null })
                  return
                }
                const parsed = Number.parseInt(raw, 10)
                if (!Number.isNaN(parsed) && parsed >= 0) {
                  onChange({ estimatedAnnualTax: parsed })
                }
              }}
              placeholder="Contoh: 3250000"
              disabled={disabled}
              aria-invalid={Boolean(estimatedAnnualTaxError)}
              aria-describedby={`${idPrefix}-estimatedAnnualTax-hint`}
            />
            <p
              id={`${idPrefix}-estimatedAnnualTax-hint`}
              className="text-sm text-muted-foreground tabular-nums"
            >
              {typeof value.estimatedAnnualTax === "number" &&
              Number.isFinite(value.estimatedAnnualTax) ? (
                <span>
                  Tampil di publik:{" "}
                  <strong className="font-semibold text-foreground">
                    {formatRupiah(value.estimatedAnnualTax)} / tahun
                  </strong>
                </span>
              ) : (
                "Isi angka penuh tanpa titik, mis. 3250000."
              )}
            </p>
            <FieldError message={estimatedAnnualTaxError} />
          </div>
        </div>

        {/* Kepemilikan, Tangan ke-N, Riwayat Pakai */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-ownershipType`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Atas Nama Kepemilikan
            </label>
            <Select
              items={ownershipTypeSelect.itemsMap}
              value={ownershipTypeSelect.selectedValue}
              disabled={disabled}
              onValueChange={(next) => {
                if (!next || next === UNSET_SELECT_VALUE) {
                  onChange({ ownershipType: null })
                  return
                }
                onChange({ ownershipType: next })
              }}
            >
              <SelectTrigger
                id={`${idPrefix}-ownershipType`}
                aria-invalid={Boolean(ownershipTypeError)}
                className="min-h-11 w-full bg-card px-3.5 text-sm text-foreground data-[size=default]:h-11"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ownershipTypeSelect.options.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={ownershipTypeError} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-ownershipHand`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Tangan Ke-
            </label>
            <Input
              id={`${idPrefix}-ownershipHand`}
              type="number"
              inputMode="numeric"
              min={1}
              max={20}
              value={value.ownershipHand ?? ""}
              onChange={(e) => {
                const raw = e.target.value.trim()
                if (!raw) {
                  onChange({ ownershipHand: null })
                  return
                }
                const parsed = Number.parseInt(raw, 10)
                if (!Number.isNaN(parsed)) {
                  onChange({ ownershipHand: parsed })
                }
              }}
              placeholder="Contoh: 1"
              disabled={disabled}
              aria-invalid={Boolean(ownershipHandError)}
            />
            <div
              className="flex flex-wrap gap-1.5 pt-1"
              role="group"
              aria-label="Pilihan cepat tangan kepemilikan"
            >
              {OWNERSHIP_HAND_PRESETS.map((hand) => {
                const isSelected = value.ownershipHand === hand
                return (
                  <button
                    key={hand}
                    type="button"
                    disabled={disabled}
                    aria-pressed={isSelected}
                    onClick={() =>
                      onChange({ ownershipHand: isSelected ? null : hand })
                    }
                    className={cn(
                      "min-h-7 cursor-pointer border px-2 py-0.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-secondary text-secondary-foreground hover:border-foreground/50"
                    )}
                  >
                    Tangan ke-{hand}
                  </button>
                )
              })}
            </div>
            <FieldError message={ownershipHandError} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-usageHistory`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Riwayat Pemakaian
            </label>
            <Input
              id={`${idPrefix}-usageHistory`}
              value={value.usageHistory ?? ""}
              onChange={(e) =>
                onChange({
                  usageHistory: e.target.value.trim() ? e.target.value : null,
                })
              }
              placeholder="Contoh: Pemakaian pribadi / Eks operasional"
              disabled={disabled}
              aria-invalid={Boolean(usageHistoryError)}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {USAGE_HISTORY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ usageHistory: preset })}
                  className="min-h-7 cursor-pointer border border-border bg-secondary px-2 py-0.5 text-sm font-medium text-secondary-foreground transition-colors hover:border-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {preset}
                </button>
              ))}
            </div>
            <FieldError message={usageHistoryError} />
          </div>
        </div>

        {/* Switches Legalitas: STNK Tidak Terblokir & No. Rangka/Mesin Cocok */}
        <div className="grid grid-cols-1 gap-3 pt-1 md:grid-cols-2">
          <div
            className={cn(
              "flex items-center justify-between gap-4 border p-4 transition-colors",
              value.stnkBlockFree
                ? "border-emerald-700/30 bg-emerald-50/50"
                : "border-border bg-secondary/40"
            )}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor={`${idPrefix}-stnkBlockFree`}
                  className="cursor-pointer text-sm font-semibold text-foreground"
                >
                  STNK Tidak Terblokir
                </label>
                <Badge variant={value.stnkBlockFree ? "success" : "warning"}>
                  {value.stnkBlockFree ? "Aman" : "Perlu Cek"}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Bebas blokir pajak progresif, e-TLE tertunggak, maupun blokir
                jual.
              </p>
            </div>
            <Switch
              id={`${idPrefix}-stnkBlockFree`}
              checked={value.stnkBlockFree}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onChange({ stnkBlockFree: checked })
              }
            />
          </div>

          <div
            className={cn(
              "flex items-center justify-between gap-4 border p-4 transition-colors",
              value.vinEngineMatched
                ? "border-emerald-700/30 bg-emerald-50/50"
                : "border-border bg-secondary/40"
            )}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor={`${idPrefix}-vinEngineMatched`}
                  className="cursor-pointer text-sm font-semibold text-foreground"
                >
                  No. Rangka &amp; Mesin Cocok
                </label>
                <Badge variant={value.vinEngineMatched ? "success" : "warning"}>
                  {value.vinEngineMatched ? "Sesuai" : "Belum Cek"}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Nomor rangka &amp; mesin fisik sesuai dengan STNK, BPKB, dan
                faktur.
              </p>
            </div>
            <Switch
              id={`${idPrefix}-vinEngineMatched`}
              checked={value.vinEngineMatched}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onChange({ vinEngineMatched: checked })
              }
            />
          </div>
        </div>
      </section>

      {/* Section B: Checklist 7 Dokumen & Bawaan */}
      <section
        aria-labelledby={`${idPrefix}-sec-b-title`}
        className="space-y-5 border border-border bg-card p-5 sm:p-6"
      >
        <div id={`${idPrefix}-sec-b-title`}>
          <SectionHeader
            eyebrow="Bagian B · Dokumen & Bawaan"
            title="Checklist 7 Dokumen & Kelengkapan Unit"
            icon={ClipboardCheck}
            trailing={
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={requiredDocsChecked ? "success" : "warning"}
                  className="tabular-nums"
                >
                  {checkedDocsCount}/7 Tersedia
                </Badge>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled || requiredDocsChecked}
                  onClick={() =>
                    updateChecklist({
                      stnk: true,
                      bpkb: true,
                      faktur: true,
                    })
                  }
                >
                  <CheckCircle2 className="size-3.5" aria-hidden={true} />
                  Centang Semua Wajib (STNK, BPKB, Faktur)
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={disabled || allDocsChecked}
                  onClick={() =>
                    updateChecklist({
                      stnk: true,
                      bpkb: true,
                      faktur: true,
                      nik: true,
                      manualBook: true,
                      serviceBook: true,
                      spareKey: true,
                    })
                  }
                >
                  Centang Semua (7/7)
                </Button>
              </div>
            }
          />
        </div>

        <FieldError message={documentChecklistError} />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOCUMENT_CHECKLIST_ITEMS.map((item) => {
            const isChecked = Boolean(checklist[item.key])
            const itemError = getFieldError(
              errors,
              `documentChecklist.${item.key}`
            )

            return (
              <div key={item.key} className="space-y-1">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={isChecked}
                  disabled={disabled}
                  onClick={() => updateChecklist({ [item.key]: !isChecked })}
                  className={cn(
                    "flex h-full w-full cursor-pointer items-start gap-3 border p-3.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60",
                    isChecked
                      ? "border-foreground bg-secondary/70"
                      : "border-border bg-card hover:border-foreground/50 hover:bg-secondary/30"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center border transition-colors",
                      isChecked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-card text-transparent"
                    )}
                  >
                    <Check className="size-3.5 stroke-[2.5]" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground">
                        {item.label}
                      </span>
                      <Badge
                        variant={
                          item.tier === "wajib"
                            ? isChecked
                              ? "success"
                              : "primary"
                            : "secondary"
                        }
                        className="px-1.5 py-0 text-sm"
                      >
                        {item.tier === "wajib"
                          ? "Wajib"
                          : item.tier === "opsional"
                            ? "Opsional"
                            : "Bawaan"}
                      </Badge>
                    </span>
                    <span className="block text-sm leading-relaxed text-muted-foreground">
                      {item.description}
                    </span>
                  </span>
                </button>
                <FieldError message={itemError} />
              </div>
            )
          })}
        </div>
      </section>

      {/* Section C: Laporan Inspeksi & Garansi Showroom */}
      <section
        aria-labelledby={`${idPrefix}-sec-c-title`}
        className="space-y-5 border border-border bg-card p-5 sm:p-6"
      >
        <div id={`${idPrefix}-sec-c-title`}>
          <SectionHeader
            eyebrow="Bagian C · Inspeksi & Garansi"
            title="Laporan Inspeksi Teknis & Garansi Showroom"
            icon={ShieldCheck}
          />
        </div>

        <FieldError message={inspectionSummaryError} />

        {/* Prominent Trust Switches: Bebas Banjir & Bebas Tabrak Besar */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div
            className={cn(
              "flex items-center justify-between gap-4 border-2 p-4 transition-colors",
              inspection.floodFree
                ? "border-emerald-700/50 bg-emerald-50/70"
                : "border-amber-700/35 bg-amber-50/40"
            )}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor={`${idPrefix}-floodFree`}
                  className="cursor-pointer font-heading text-base font-bold text-foreground"
                >
                  Bebas Banjir
                </label>
                <Badge variant={inspection.floodFree ? "success" : "warning"}>
                  {inspection.floodFree ? "Terjamin" : "Belum Dikonfirmasi"}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tidak ada bekas lumpur/korosi di bawah karpet, soket
                kelistrikan, maupun bau lembap bekas terendam air.
              </p>
            </div>
            <Switch
              id={`${idPrefix}-floodFree`}
              checked={Boolean(inspection.floodFree)}
              disabled={disabled}
              onCheckedChange={(checked) =>
                updateInspection({ floodFree: checked })
              }
            />
          </div>

          <div
            className={cn(
              "flex items-center justify-between gap-4 border-2 p-4 transition-colors",
              inspection.majorAccidentFree
                ? "border-emerald-700/50 bg-emerald-50/70"
                : "border-amber-700/35 bg-amber-50/40"
            )}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor={`${idPrefix}-majorAccidentFree`}
                  className="cursor-pointer font-heading text-base font-bold text-foreground"
                >
                  Bebas Tabrak Besar
                </label>
                <Badge
                  variant={inspection.majorAccidentFree ? "success" : "warning"}
                >
                  {inspection.majorAccidentFree
                    ? "Terjamin"
                    : "Belum Dikonfirmasi"}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Tulang sasis, apron depan, pilar A/B/C, dan bullhead utuh tanpa
                bekas las struktur atau perbaikan tabrak berat.
              </p>
            </div>
            <Switch
              id={`${idPrefix}-majorAccidentFree`}
              checked={Boolean(inspection.majorAccidentFree)}
              disabled={disabled}
              onCheckedChange={(checked) =>
                updateInspection({ majorAccidentFree: checked })
              }
            />
          </div>
        </div>

        {/* Grade 4 Sektor */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-exteriorGrade`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Grade Eksterior &amp; Bodi
            </label>
            <Input
              id={`${idPrefix}-exteriorGrade`}
              value={inspection.exteriorGrade ?? ""}
              onChange={(e) =>
                updateInspection({
                  exteriorGrade: e.target.value.trim() ? e.target.value : null,
                })
              }
              placeholder="Contoh: A — Cat orisinil mulus, minim baret"
              disabled={disabled}
              aria-invalid={Boolean(exteriorGradeError)}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {GRADE_PRESETS.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateInspection({ exteriorGrade: grade })}
                  className={cn(
                    "min-h-7 cursor-pointer border px-2 py-0.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    (inspection.exteriorGrade ?? "").trim() === grade
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-secondary text-secondary-foreground hover:border-foreground/50"
                  )}
                >
                  {grade}
                </button>
              ))}
            </div>
            <FieldError message={exteriorGradeError} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-interiorGrade`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Grade Interior &amp; Kabin
            </label>
            <Input
              id={`${idPrefix}-interiorGrade`}
              value={inspection.interiorGrade ?? ""}
              onChange={(e) =>
                updateInspection({
                  interiorGrade: e.target.value.trim() ? e.target.value : null,
                })
              }
              placeholder="Contoh: A — Jok bersih, plafon rapi, tombol fungsi normal"
              disabled={disabled}
              aria-invalid={Boolean(interiorGradeError)}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {GRADE_PRESETS.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateInspection({ interiorGrade: grade })}
                  className={cn(
                    "min-h-7 cursor-pointer border px-2 py-0.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    (inspection.interiorGrade ?? "").trim() === grade
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-secondary text-secondary-foreground hover:border-foreground/50"
                  )}
                >
                  {grade}
                </button>
              ))}
            </div>
            <FieldError message={interiorGradeError} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-engineTransmissionGrade`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Grade Mesin &amp; Transmisi
            </label>
            <Input
              id={`${idPrefix}-engineTransmissionGrade`}
              value={inspection.engineTransmissionGrade ?? ""}
              onChange={(e) =>
                updateInspection({
                  engineTransmissionGrade: e.target.value.trim()
                    ? e.target.value
                    : null,
                })
              }
              placeholder="Contoh: A — Mesin halus, kering, perpindahan gigi responsif"
              disabled={disabled}
              aria-invalid={Boolean(engineTransmissionGradeError)}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {GRADE_PRESETS.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    updateInspection({ engineTransmissionGrade: grade })
                  }
                  className={cn(
                    "min-h-7 cursor-pointer border px-2 py-0.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    (inspection.engineTransmissionGrade ?? "").trim() === grade
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-secondary text-secondary-foreground hover:border-foreground/50"
                  )}
                >
                  {grade}
                </button>
              ))}
            </div>
            <FieldError message={engineTransmissionGradeError} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-undercarriageSuspensionGrade`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Grade Kaki-Kaki &amp; Kolong
            </label>
            <Input
              id={`${idPrefix}-undercarriageSuspensionGrade`}
              value={inspection.undercarriageSuspensionGrade ?? ""}
              onChange={(e) =>
                updateInspection({
                  undercarriageSuspensionGrade: e.target.value.trim()
                    ? e.target.value
                    : null,
                })
              }
              placeholder="Contoh: B+ — Suspensi senyap, kolong bersih bebas karat"
              disabled={disabled}
              aria-invalid={Boolean(undercarriageSuspensionGradeError)}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {GRADE_PRESETS.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    updateInspection({ undercarriageSuspensionGrade: grade })
                  }
                  className={cn(
                    "min-h-7 cursor-pointer border px-2 py-0.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    (inspection.undercarriageSuspensionGrade ?? "").trim() ===
                      grade
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-secondary text-secondary-foreground hover:border-foreground/50"
                  )}
                >
                  {grade}
                </button>
              ))}
            </div>
            <FieldError message={undercarriageSuspensionGradeError} />
          </div>
        </div>

        {/* Kondisi Ban & Catatan Inspeksi */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-tireCondition`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Kondisi &amp; Ketebalan Ban
            </label>
            <Input
              id={`${idPrefix}-tireCondition`}
              value={inspection.tireCondition ?? ""}
              onChange={(e) =>
                updateInspection({
                  tireCondition: e.target.value.trim() ? e.target.value : null,
                })
              }
              placeholder="Contoh: 4 ban tebal 85%, produksi 2024"
              disabled={disabled}
              aria-invalid={Boolean(tireConditionError)}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {TIRE_CONDITION_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateInspection({ tireCondition: preset })}
                  className="min-h-7 cursor-pointer border border-border bg-secondary px-2 py-0.5 text-sm font-medium text-secondary-foreground transition-colors hover:border-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {preset}
                </button>
              ))}
            </div>
            <FieldError message={tireConditionError} />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-inspectionNotes`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Catatan Hasil Inspeksi
            </label>
            <Textarea
              id={`${idPrefix}-inspectionNotes`}
              value={inspection.notes ?? ""}
              onChange={(e) =>
                updateInspection({
                  notes: e.target.value.trim() ? e.target.value : null,
                })
              }
              placeholder="Ringkasan hasil cek fisik, kondisi AC, kelistrikan, nama inspektor/bengkel pengecek, atau catatan test drive..."
              disabled={disabled}
              aria-invalid={Boolean(inspectionNotesError)}
              className="min-h-24"
            />
            <FieldError message={inspectionNotesError} />
          </div>
        </div>

        {/* Garansi Showroom & Izin Cek Mekanik */}
        <div className="space-y-4 border-t border-border pt-4">
          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-warrantyInfo`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Informasi Garansi Showroom
            </label>
            <Textarea
              id={`${idPrefix}-warrantyInfo`}
              value={value.warrantyInfo ?? ""}
              onChange={(e) =>
                onChange({
                  warrantyInfo: e.target.value.trim() ? e.target.value : null,
                })
              }
              placeholder="Contoh: Garansi Mesin & Transmisi 30 Hari + Buyback 100% Bebas Banjir/Tabrak"
              disabled={disabled}
              aria-invalid={Boolean(warrantyInfoError)}
              className="min-h-20"
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
              {WARRANTY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange({ warrantyInfo: preset })}
                  className="min-h-7 cursor-pointer border border-border bg-secondary px-2.5 py-1 text-left text-sm font-medium text-secondary-foreground transition-colors hover:border-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {preset}
                </button>
              ))}
            </div>
            <FieldError message={warrantyInfoError} />
          </div>

          <div
            className={cn(
              "flex items-center justify-between gap-4 border p-4 transition-colors",
              value.mechanicCheckAllowed
                ? "border-emerald-700/30 bg-emerald-50/50"
                : "border-border bg-secondary/40"
            )}
          >
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <label
                  htmlFor={`${idPrefix}-mechanicCheckAllowed`}
                  className="cursor-pointer text-sm font-semibold text-foreground"
                >
                  Boleh Bawa Mekanik / Cek Bengkel Resmi
                </label>
                <Badge
                  variant={value.mechanicCheckAllowed ? "success" : "secondary"}
                >
                  {value.mechanicCheckAllowed ? "Diperbolehkan" : "Tidak Aktif"}
                </Badge>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Pembeli diperbolehkan membawa mekanik pribadi, jasa inspeksi
                independen, atau general check-up ke bengkel resmi.
              </p>
            </div>
            <Switch
              id={`${idPrefix}-mechanicCheckAllowed`}
              checked={value.mechanicCheckAllowed}
              disabled={disabled}
              onCheckedChange={(checked) =>
                onChange({ mechanicCheckAllowed: checked })
              }
            />
          </div>
        </div>
      </section>

      {/* Section D: Peremajaan Part & Transparansi Minus */}
      <section
        aria-labelledby={`${idPrefix}-sec-d-title`}
        className="space-y-6 border border-border bg-card p-5 sm:p-6"
      >
        <div id={`${idPrefix}-sec-d-title`}>
          <SectionHeader
            eyebrow="Bagian D · Rekondisi & Transparansi"
            title="Peremajaan Part & Catatan Minus Jujur"
            icon={Wrench}
          />
        </div>

        {/* Sub-block D1: Recent Maintenance */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h4 className="font-heading text-sm font-bold text-foreground">
                Peremajaan Part / Servis Terakhir
              </h4>
              <p className="text-sm text-muted-foreground">
                Catat perawatan atau penggantian suku cadang terbaru sebelum
                unit masuk showroom.
              </p>
            </div>
            <Badge variant="secondary" className="tabular-nums">
              {recentMaintenance.length} item
            </Badge>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={`${idPrefix}-maintenance-draft`}
              value={maintenanceDraft}
              onChange={(e) => setMaintenanceDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddMaintenanceItem(maintenanceDraft)
                }
              }}
              placeholder="Contoh: Ganti oli mesin & filter baru (tekan Enter)"
              disabled={disabled}
              aria-label="Tambah catatan peremajaan part"
            />
            <Button
              type="button"
              variant="outline"
              disabled={disabled || !maintenanceDraft.trim()}
              onClick={() => handleAddMaintenanceItem(maintenanceDraft)}
              className="shrink-0"
            >
              <Plus className="size-4" aria-hidden={true} />
              Tambah
            </Button>
          </div>

          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="Pilihan cepat peremajaan part"
          >
            {MAINTENANCE_PRESETS.map((preset) => {
              const alreadyAdded = recentMaintenance.some(
                (item) => item.trim().toLowerCase() === preset.toLowerCase()
              )
              return (
                <button
                  key={preset}
                  type="button"
                  disabled={disabled || alreadyAdded}
                  onClick={() => handleAddMaintenanceItem(preset)}
                  className={cn(
                    "inline-flex min-h-7 cursor-pointer items-center gap-1 border px-2.5 py-0.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-55",
                    alreadyAdded
                      ? "border-emerald-700/30 bg-emerald-50 text-emerald-900"
                      : "border-border bg-secondary text-secondary-foreground hover:border-foreground/50"
                  )}
                >
                  {alreadyAdded ? (
                    <Check className="size-3" aria-hidden={true} />
                  ) : (
                    <Plus className="size-3" aria-hidden={true} />
                  )}
                  {preset}
                </button>
              )
            })}
          </div>

          <FieldError message={recentMaintenanceError} />

          {recentMaintenance.length > 0 ? (
            <ul className="space-y-2">
              {recentMaintenance.map((item, index) => {
                const itemError = getFieldError(
                  errors,
                  `recentMaintenance.${index}`,
                  `recentMaintenance[${index}]`
                )
                return (
                  <li key={index} className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex size-8 shrink-0 items-center justify-center border border-border bg-secondary text-sm font-semibold text-muted-foreground tabular-nums">
                        {index + 1}
                      </span>
                      <Input
                        value={item}
                        onChange={(e) =>
                          handleUpdateMaintenanceItem(index, e.target.value)
                        }
                        disabled={disabled}
                        aria-label={`Peremajaan part nomor ${index + 1}`}
                        aria-invalid={Boolean(itemError)}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={disabled}
                        onClick={() => handleRemoveMaintenanceItem(index)}
                        aria-label={`Hapus peremajaan part nomor ${index + 1}`}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-4" aria-hidden={true} />
                      </Button>
                    </div>
                    <FieldError message={itemError} />
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="border border-dashed border-border bg-secondary/30 px-4 py-3 text-sm text-muted-foreground">
              Belum ada catatan peremajaan part. Klik salah satu chip cepat di
              atas atau ketik manual.
            </p>
          )}
        </div>

        {/* Sub-block D2: Imperfections Repeater */}
        <div className="space-y-4 border-t border-border pt-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <h4 className="font-heading text-sm font-bold text-foreground">
                Transparansi Minus Unit
              </h4>
              <p className="text-sm text-muted-foreground">
                Cantumkan minus minor atau komponen aus secara jujur agar
                pembeli tidak kaget saat inspeksi langsung.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={handleAddImperfection}
            >
              <Plus className="size-3.5" aria-hidden={true} />
              Tambah Catatan Minus
            </Button>
          </div>

          {/* Guidance Prompt Banner */}
          <div className="flex items-start gap-2.5 border border-l-2 border-amber-700/30 border-l-amber-700 bg-amber-50/70 px-3.5 py-3 text-sm leading-relaxed text-amber-950">
            <Info
              className="mt-0.5 size-4 shrink-0 text-amber-800"
              aria-hidden={true}
            />
            <div>
              <p className="font-semibold">
                Kejujuran soal minus minor meningkatkan konversi &amp;
                kepercayaan pembeli luar kota.
              </p>
              <p className="mt-0.5 text-amber-900/85">
                Contoh yang baik: &ldquo;Bumper depan kiri — baret halus 3 cm
                bekas parkir, tidak tembus cat dasar.&rdquo;
              </p>
            </div>
          </div>

          <FieldError message={imperfectionsError} />

          {imperfections.length === 0 ? (
            <div className="flex flex-col items-start justify-between gap-3 border border-dashed border-border bg-secondary/30 p-4 sm:flex-row sm:items-center">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Belum ada catatan minus yang dimasukkan. Jika unit memiliki
                baret halus, penyok ringan, atau part yang perlu diperhatikan,
                tambahkan di sini.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={handleAddImperfection}
                className="shrink-0"
              >
                <Plus className="size-3.5" aria-hidden={true} />
                Tambah Minus Pertama
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {imperfections.map((item, index) => {
                const areaError = getFieldError(
                  errors,
                  `imperfections.${index}.area`,
                  `imperfections[${index}].area`
                )
                const severityError = getFieldError(
                  errors,
                  `imperfections.${index}.severity`,
                  `imperfections[${index}].severity`
                )
                const descriptionError = getFieldError(
                  errors,
                  `imperfections.${index}.description`,
                  `imperfections[${index}].description`
                )

                return (
                  <div
                    key={index}
                    className="space-y-3.5 border border-border bg-background/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold tracking-wider text-foreground uppercase tabular-nums">
                          <AlertTriangle
                            className="size-3.5 text-amber-700"
                            aria-hidden={true}
                          />
                          Minus #{index + 1}
                        </span>
                        <Badge
                          variant={
                            item.severity === "moderate"
                              ? "destructive"
                              : "warning"
                          }
                        >
                          {item.severity === "moderate" ? "Moderate" : "Minor"}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        onClick={() => handleRemoveImperfection(index)}
                        aria-label={`Hapus catatan minus nomor ${index + 1}`}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" aria-hidden={true} />
                        Hapus
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label
                          htmlFor={`${idPrefix}-imp-area-${index}`}
                          className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                        >
                          Bagian / Area <span className="text-primary">*</span>
                        </label>
                        <Input
                          id={`${idPrefix}-imp-area-${index}`}
                          value={item.area}
                          onChange={(e) =>
                            handleUpdateImperfection(index, {
                              area: e.target.value,
                            })
                          }
                          placeholder="Contoh: Bumper depan kiri, velg kanan belakang"
                          disabled={disabled}
                          aria-invalid={Boolean(areaError)}
                        />
                        <FieldError message={areaError} />
                      </div>

                      <div className="space-y-1.5">
                        <label
                          htmlFor={`${idPrefix}-imp-severity-${index}`}
                          className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                        >
                          Tingkat Minus
                        </label>
                        <Select
                          items={SEVERITY_ITEMS}
                          value={item.severity}
                          disabled={disabled}
                          onValueChange={(next) => {
                            if (next === "minor" || next === "moderate") {
                              handleUpdateImperfection(index, {
                                severity: next,
                              })
                            }
                          }}
                        >
                          <SelectTrigger
                            id={`${idPrefix}-imp-severity-${index}`}
                            aria-invalid={Boolean(severityError)}
                            className="min-h-11 w-full bg-card px-3.5 text-sm text-foreground data-[size=default]:h-11"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="minor">
                              Minor — Kosmetik / wajar pemakaian
                            </SelectItem>
                            <SelectItem value="moderate">
                              Moderate — Perlu perhatian / perbaikan
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FieldError message={severityError} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label
                        htmlFor={`${idPrefix}-imp-desc-${index}`}
                        className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                      >
                        Deskripsi Minus <span className="text-primary">*</span>
                      </label>
                      <Textarea
                        id={`${idPrefix}-imp-desc-${index}`}
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateImperfection(index, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Jelaskan kondisi secara spesifik, mis. baret halus 3 cm bekas parkir, tidak tembus cat dasar."
                        disabled={disabled}
                        aria-invalid={Boolean(descriptionError)}
                        className="min-h-20"
                      />
                      <FieldError message={descriptionError} />
                    </div>
                  </div>
                )
              })}

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={handleAddImperfection}
              >
                <Plus className="size-3.5" aria-hidden={true} />
                Tambah Catatan Minus Lainnya
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
