import * as React from "react"
import { cn } from "cn"
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Wrench,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
    description: "STNK fisik tersedia & terbaca jelas",
    tier: "wajib",
  },
  {
    key: "bpkb",
    label: "BPKB Asli",
    description: "BPKB asli siap serah terima",
    tier: "wajib",
  },
  {
    key: "faktur",
    label: "Faktur Pembelian",
    description: "Faktur resmi dealer / ATPM",
    tier: "wajib",
  },
  {
    key: "nik",
    label: "Sertifikat NIK / Form A",
    description: "Dokumen NIK atau Form A (khusus CBU)",
    tier: "opsional",
  },
  {
    key: "manualBook",
    label: "Buku Manual",
    description: "Buku panduan pemilik pabrikan",
    tier: "bawaan",
  },
  {
    key: "serviceBook",
    label: "Buku Servis / Record",
    description: "Catatan servis bengkel resmi / spesialis",
    tier: "bawaan",
  },
  {
    key: "spareKey",
    label: "Kunci Serep",
    description: "Kunci cadangan tersedia & berfungsi",
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

  const [deleteConfirm, setDeleteConfirm] = React.useState<{
    kind: "maintenance" | "imperfection"
    index: number
  } | null>(null)
  const displayedDeleteConfirm = useStableDialogData(deleteConfirm)

  function handleRemoveMaintenanceItem(index: number) {
    onChange({
      recentMaintenance: recentMaintenance.filter((_, i) => i !== index),
    })
    setDeleteConfirm(null)
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
    setDeleteConfirm(null)
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
              Ringkasan Plat &amp; Pajak <span className="text-primary">*</span>
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
            data-completeness-id="legality-plate-info"
            value={value.plateInfo}
            onChange={(e) => onChange({ plateInfo: e.target.value })}
            placeholder="AD - Pajak panjang Nov 2026"
            disabled={disabled}
            aria-invalid={Boolean(plateInfoError)}
            aria-describedby={
              plateInfoError ? `${idPrefix}-plateInfo-error` : undefined
            }
          />
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
              data-completeness-id="legality-plate-area"
              value={value.plateAreaCode ?? ""}
              onChange={(e) => {
                const raw = e.target.value.toUpperCase()
                onChange({ plateAreaCode: raw.trim() ? raw : null })
              }}
              placeholder="AD, B, AB, D, L, K"
              maxLength={8}
              disabled={disabled}
              aria-invalid={Boolean(plateAreaCodeError)}
              className="uppercase placeholder:normal-case"
            />
            <div
              className="flex flex-wrap gap-1 pt-0.5"
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
                      "min-h-7 cursor-pointer border px-1.5 py-0.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
                data-completeness-id="legality-tax-status"
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
          <div data-completeness-id="legality-tax-expiry" className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-taxExpiryDate`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Jatuh Tempo Pajak
            </label>
            <DatePicker
              id={`${idPrefix}-taxExpiryDate`}
              value={value.taxExpiryDate}
              onChange={(nextDate) => onChange({ taxExpiryDate: nextDate })}
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
              Masa Berlaku Kaleng
            </label>
            <DatePicker
              id={`${idPrefix}-stnk5yrExpiryDate`}
              value={value.stnk5yrExpiryDate}
              onChange={(nextDate) => onChange({ stnk5yrExpiryDate: nextDate })}
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
              Estimasi PKB / Tahun
            </label>
            <InputGroup>
              <InputGroupAddon align="inline-start">
                <InputGroupText className="font-semibold">Rp</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                id={`${idPrefix}-estimatedAnnualTax`}
                data-completeness-id="legality-annual-tax"
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
                placeholder="3250000"
                disabled={disabled}
                aria-invalid={Boolean(estimatedAnnualTaxError)}
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>/ tahun</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldError message={estimatedAnnualTaxError} />
          </div>
        </div>

        {/* Kepemilikan & Tangan ke-N */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-ownershipType`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Atas Nama
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
                data-completeness-id="legality-ownership-type"
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
              data-completeness-id="legality-ownership-hand"
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
              placeholder="1"
              disabled={disabled}
              aria-invalid={Boolean(ownershipHandError)}
            />
            <div
              className="flex flex-wrap gap-1.5 pt-0.5"
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
                      "min-h-7 cursor-pointer border px-2.5 py-0.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
        </div>

        {/* Riwayat Pemakaian */}
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
            placeholder="Pemakaian pribadi, eks operasional kantor..."
            disabled={disabled}
            aria-invalid={Boolean(usageHistoryError)}
          />
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {USAGE_HISTORY_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ usageHistory: preset })}
                className="min-h-8 cursor-pointer border border-border bg-secondary px-2.5 py-1 text-sm font-medium text-secondary-foreground transition-colors hover:border-foreground/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {preset}
              </button>
            ))}
          </div>
          <FieldError message={usageHistoryError} />
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
              <label
                htmlFor={`${idPrefix}-stnkBlockFree`}
                className="block cursor-pointer text-sm font-semibold text-foreground"
              >
                STNK Tidak Terblokir
              </label>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Bebas blokir pajak progresif, e-TLE, maupun blokir jual.
              </p>
            </div>
            <Switch
              id={`${idPrefix}-stnkBlockFree`}
              checked={value.stnkBlockFree}
              disabled={disabled}
              className="shrink-0"
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
              <label
                htmlFor={`${idPrefix}-vinEngineMatched`}
                className="block cursor-pointer text-sm font-semibold text-foreground"
              >
                No. Rangka &amp; Mesin Cocok
              </label>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Fisik rangka &amp; mesin sesuai STNK, BPKB, dan faktur.
              </p>
            </div>
            <Switch
              id={`${idPrefix}-vinEngineMatched`}
              checked={value.vinEngineMatched}
              disabled={disabled}
              className="shrink-0"
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
            title="Checklist Dokumen & Kelengkapan"
            icon={ClipboardCheck}
            trailing={
              <Badge
                variant={requiredDocsChecked ? "success" : "warning"}
                className="tabular-nums"
              >
                {checkedDocsCount}/7 Tersedia
              </Badge>
            }
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
            Centang Wajib
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
            Centang Semua
          </Button>
        </div>

        <FieldError message={documentChecklistError} />

        <div
          data-completeness-id="legality-documents"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
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
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {item.label}
                      </span>
                      {item.tier === "wajib" ? (
                        <Badge
                          variant={isChecked ? "success" : "primary"}
                          className="shrink-0 px-1.5 py-0 text-sm"
                        >
                          Wajib
                        </Badge>
                      ) : null}
                    </span>
                    <span className="block text-sm text-muted-foreground">
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
        <div
          data-completeness-id="legality-trust-switches"
          className="grid grid-cols-1 gap-3 md:grid-cols-2"
        >
          <div
            className={cn(
              "flex items-center justify-between gap-4 border p-4 transition-colors",
              inspection.floodFree
                ? "border-emerald-700/40 bg-emerald-50/60"
                : "border-amber-700/35 bg-amber-50/40"
            )}
          >
            <div className="space-y-1">
              <label
                htmlFor={`${idPrefix}-floodFree`}
                className="block cursor-pointer font-heading text-sm font-bold text-foreground"
              >
                Bebas Banjir
              </label>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Bebas bekas lumpur, korosi kelistrikan, maupun bau lembap.
              </p>
            </div>
            <Switch
              id={`${idPrefix}-floodFree`}
              checked={Boolean(inspection.floodFree)}
              disabled={disabled}
              className="shrink-0"
              onCheckedChange={(checked) =>
                updateInspection({ floodFree: checked })
              }
            />
          </div>

          <div
            className={cn(
              "flex items-center justify-between gap-4 border p-4 transition-colors",
              inspection.majorAccidentFree
                ? "border-emerald-700/40 bg-emerald-50/60"
                : "border-amber-700/35 bg-amber-50/40"
            )}
          >
            <div className="space-y-1">
              <label
                htmlFor={`${idPrefix}-majorAccidentFree`}
                className="block cursor-pointer font-heading text-sm font-bold text-foreground"
              >
                Bebas Tabrak Besar
              </label>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Rangka, apron, pilar A/B/C, dan bullhead utuh tanpa bekas las
                berat.
              </p>
            </div>
            <Switch
              id={`${idPrefix}-majorAccidentFree`}
              checked={Boolean(inspection.majorAccidentFree)}
              disabled={disabled}
              className="shrink-0"
              onCheckedChange={(checked) =>
                updateInspection({ majorAccidentFree: checked })
              }
            />
          </div>
        </div>

        {/* Grade 4 Sektor */}
        <div
          data-completeness-id="legality-grades"
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
        >
          <div className="space-y-1.5">
            <label
              htmlFor={`${idPrefix}-exteriorGrade`}
              className="block text-sm font-semibold tracking-wider text-foreground uppercase"
            >
              Grade Eksterior
            </label>
            <Input
              id={`${idPrefix}-exteriorGrade`}
              value={inspection.exteriorGrade ?? ""}
              onChange={(e) =>
                updateInspection({
                  exteriorGrade: e.target.value.trim() ? e.target.value : null,
                })
              }
              placeholder="A — Cat orisinil mulus, minim baret"
              disabled={disabled}
              aria-invalid={Boolean(exteriorGradeError)}
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {GRADE_PRESETS.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateInspection({ exteriorGrade: grade })}
                  className={cn(
                    "min-h-7 cursor-pointer border px-2.5 py-0.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
              Grade Interior
            </label>
            <Input
              id={`${idPrefix}-interiorGrade`}
              value={inspection.interiorGrade ?? ""}
              onChange={(e) =>
                updateInspection({
                  interiorGrade: e.target.value.trim() ? e.target.value : null,
                })
              }
              placeholder="A — Jok bersih, plafon rapi, tombol normal"
              disabled={disabled}
              aria-invalid={Boolean(interiorGradeError)}
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {GRADE_PRESETS.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  disabled={disabled}
                  onClick={() => updateInspection({ interiorGrade: grade })}
                  className={cn(
                    "min-h-7 cursor-pointer border px-2.5 py-0.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
              placeholder="A — Mesin halus, kering, responsif"
              disabled={disabled}
              aria-invalid={Boolean(engineTransmissionGradeError)}
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {GRADE_PRESETS.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    updateInspection({ engineTransmissionGrade: grade })
                  }
                  className={cn(
                    "min-h-7 cursor-pointer border px-2.5 py-0.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
              Grade Kaki-Kaki
            </label>
            <Input
              id={`${idPrefix}-undercarriageSuspensionGrade`}
              data-completeness-id="legality-undercarriage-grade"
              value={inspection.undercarriageSuspensionGrade ?? ""}
              onChange={(e) =>
                updateInspection({
                  undercarriageSuspensionGrade: e.target.value.trim()
                    ? e.target.value
                    : null,
                })
              }
              placeholder="B+ — Suspensi senyap, kolong bersih"
              disabled={disabled}
              aria-invalid={Boolean(undercarriageSuspensionGradeError)}
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {GRADE_PRESETS.map((grade) => (
                <button
                  key={grade}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    updateInspection({ undercarriageSuspensionGrade: grade })
                  }
                  className={cn(
                    "min-h-7 cursor-pointer border px-2.5 py-0.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
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
              Kondisi Ban
            </label>
            <Input
              id={`${idPrefix}-tireCondition`}
              data-completeness-id="legality-tire-condition"
              value={inspection.tireCondition ?? ""}
              onChange={(e) =>
                updateInspection({
                  tireCondition: e.target.value.trim() ? e.target.value : null,
                })
              }
              placeholder="4 ban tebal 85%, produksi 2024"
              disabled={disabled}
              aria-invalid={Boolean(tireConditionError)}
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
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
              Catatan Inspeksi
            </label>
            <Textarea
              id={`${idPrefix}-inspectionNotes`}
              value={inspection.notes ?? ""}
              onChange={(e) =>
                updateInspection({
                  notes: e.target.value.trim() ? e.target.value : null,
                })
              }
              placeholder="Ringkasan cek fisik, AC, kelistrikan, atau hasil test drive..."
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
              Garansi Showroom
            </label>
            <Textarea
              id={`${idPrefix}-warrantyInfo`}
              data-completeness-id="legality-warranty"
              value={value.warrantyInfo ?? ""}
              onChange={(e) =>
                onChange({
                  warrantyInfo: e.target.value.trim() ? e.target.value : null,
                })
              }
              placeholder="Garansi Mesin & Transmisi 30 Hari + Buyback 100% Bebas Banjir/Tabrak"
              disabled={disabled}
              aria-invalid={Boolean(warrantyInfoError)}
              className="min-h-20"
            />
            <div className="flex flex-wrap gap-1.5 pt-0.5">
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
              <label
                htmlFor={`${idPrefix}-mechanicCheckAllowed`}
                className="block cursor-pointer text-sm font-semibold text-foreground"
              >
                Boleh Cek Mekanik / Bengkel Resmi
              </label>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Pembeli bebas membawa mekanik pribadi atau cek ke bengkel resmi.
              </p>
            </div>
            <Switch
              id={`${idPrefix}-mechanicCheckAllowed`}
              checked={value.mechanicCheckAllowed}
              disabled={disabled}
              className="shrink-0"
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
                Peremajaan Part
              </h4>
              <p className="text-sm text-muted-foreground">
                Perawatan atau penggantian komponen terbaru.
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
              placeholder="Ganti oli mesin & filter baru"
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
                      <Tooltip>
                        <TooltipTrigger
                          render={<span className="inline-flex shrink-0" />}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={disabled}
                            onClick={() =>
                              setDeleteConfirm({ kind: "maintenance", index })
                            }
                            aria-label={`Hapus peremajaan part nomor ${index + 1}`}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" aria-hidden={true} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Hapus catatan</TooltipContent>
                      </Tooltip>
                    </div>
                    <FieldError message={itemError} />
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="border border-dashed border-border bg-secondary/30 px-4 py-3 text-center text-sm text-muted-foreground">
              Belum ada catatan peremajaan part.
            </p>
          )}
        </div>

        {/* Sub-block D2: Imperfections Repeater */}
        <div className="space-y-4 border-t border-border pt-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h4 className="font-heading text-sm font-bold text-foreground">
                Transparansi Minus Unit
              </h4>
              <p className="text-sm text-muted-foreground">
                Catat minus minor atau komponen aus agar pembeli tahu kondisi
                sebenarnya.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={handleAddImperfection}
              className="shrink-0"
            >
              <Plus className="size-3.5" aria-hidden={true} />
              Tambah Minus
            </Button>
          </div>

          <FieldError message={imperfectionsError} />

          {imperfections.length === 0 ? (
            <p className="border border-dashed border-border bg-secondary/30 px-4 py-3 text-center text-sm text-muted-foreground">
              Belum ada catatan minus.
            </p>
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
                        onClick={() =>
                          setDeleteConfirm({ kind: "imperfection", index })
                        }
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
                          Area <span className="text-primary">*</span>
                        </label>
                        <Input
                          id={`${idPrefix}-imp-area-${index}`}
                          value={item.area}
                          onChange={(e) =>
                            handleUpdateImperfection(index, {
                              area: e.target.value,
                            })
                          }
                          placeholder="Bumper depan kiri, velg kanan belakang"
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
                        Deskripsi <span className="text-primary">*</span>
                      </label>
                      <Textarea
                        id={`${idPrefix}-imp-desc-${index}`}
                        value={item.description}
                        onChange={(e) =>
                          handleUpdateImperfection(index, {
                            description: e.target.value,
                          })
                        }
                        placeholder="Baret halus 3 cm bekas parkir, tidak tembus cat dasar."
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

      <Dialog
        open={Boolean(deleteConfirm)}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {displayedDeleteConfirm?.kind === "maintenance"
                ? "Hapus Catatan Peremajaan Part?"
                : "Hapus Catatan Minus?"}
            </DialogTitle>
            <DialogDescription>
              {displayedDeleteConfirm?.kind === "maintenance"
                ? recentMaintenance[displayedDeleteConfirm.index]?.trim()
                  ? `Catatan "${recentMaintenance[displayedDeleteConfirm.index]}" akan dihapus dari daftar peremajaan.`
                  : `Catatan peremajaan #${displayedDeleteConfirm.index + 1} akan dihapus dari daftar.`
                : displayedDeleteConfirm
                  ? imperfections[displayedDeleteConfirm.index]?.area?.trim()
                    ? `Catatan minus pada area "${imperfections[displayedDeleteConfirm.index].area}" akan dihapus dari daftar.`
                    : `Catatan minus #${displayedDeleteConfirm.index + 1} akan dihapus dari daftar.`
                  : ""}
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
                if (deleteConfirm.kind === "maintenance") {
                  handleRemoveMaintenanceItem(deleteConfirm.index)
                } else {
                  handleRemoveImperfection(deleteConfirm.index)
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
