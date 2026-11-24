import * as React from "react"
import { cn } from "cn"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ClipboardPaste,
  Gauge,
  ListChecks,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react"
import {
  FormSectionAccordion,
  FormSectionAccordionItem,
} from "@/components/dash/form-section-accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import { getCategoryLabel, slugifyCarName } from "@/lib/domain/formatters"
import type { CarUpsertInput } from "@/lib/domain/schemas"
import type {
  CarCategory,
  CarStatus,
  FuelType,
  TransmissionGroup,
} from "@/lib/domain/types"

export interface CarIdentitySpecsFormProps {
  value: CarUpsertInput
  onChange: (patch: Partial<CarUpsertInput>) => void
  errors?: Record<string, string>
  isNew?: boolean
  disabled?: boolean
}

const EMPTY_SELECT_VALUE = "__empty__"

const CATEGORY_ITEMS: Record<CarCategory, string> = {
  keluarga: getCategoryLabel("keluarga"),
  harian: getCategoryLabel("harian"),
  "hobi-eropa": getCategoryLabel("hobi-eropa"),
}

const STATUS_ITEMS: Record<CarStatus, string> = {
  draft: "Draft (Belum Tayang)",
  ready: "Ready (Tersedia)",
  booked: "Booked (Dipesan)",
  sold: "Terjual (Sold)",
  archived: "Arsip",
}

const STATUS_BADGE_MAP: Record<
  CarStatus,
  {
    label: string
    variant: "secondary" | "success" | "warning" | "destructive" | "outline"
  }
> = {
  draft: { label: "Draft", variant: "secondary" },
  ready: { label: "Ready", variant: "success" },
  booked: { label: "Booked", variant: "warning" },
  sold: { label: "Sold", variant: "destructive" },
  archived: { label: "Arsip", variant: "outline" },
}

const BODY_TYPE_PRESETS = [
  "MPV",
  "SUV",
  "Sedan",
  "Hatchback",
  "City Car",
  "Coupe",
  "Lainnya",
] as const

const TRANSMISSION_GROUP_ITEMS: Record<TransmissionGroup, string> = {
  automatic: "Automatic",
  manual: "Manual",
}

const FUEL_TYPE_ITEMS: Record<FuelType, string> = {
  bensin: "Bensin",
  diesel: "Diesel",
  hybrid: "Hybrid (HEV)",
  phev: "Plug-in Hybrid (PHEV)",
  ev: "Listrik Murni (EV)",
}

const DRIVETRAIN_PRESETS: Record<string, string> = {
  FWD: "FWD — Roda Depan",
  RWD: "RWD — Roda Belakang",
  AWD: "AWD — All-Wheel Drive",
  "4WD": "4WD — Four-Wheel Drive",
}

const OFFER_BADGE_PRESETS = [
  "Special Price",
  "Low KM",
  "Tangan Pertama",
  "Unit Kolektor",
] as const

const FEATURED_SLOTS = [1, 2, 3] as const

function inferYearSort(yearText: string): number | null {
  const match = yearText.match(/\b(19\d{2}|20\d{2}|2100)\b/)
  if (!match) return null
  const parsed = Number.parseInt(match[1], 10)
  if (Number.isNaN(parsed) || parsed < 1950 || parsed > 2100) {
    return null
  }
  return parsed
}

function formatMileageSuggestion(km: number): string {
  if (km >= 1000 && km % 1000 === 0) {
    return `${km / 1000} ribu km`
  }
  return `${new Intl.NumberFormat("id-ID").format(km)} km`
}

function parseBulkLines(raw: string): string[] {
  return raw
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^(?:[-*•▪◦]+|\d+[.)])\s*/, "")
        .trim()
    )
    .filter((line) => line.length > 0)
}

interface FieldShellProps {
  id: string
  label: string
  required?: boolean
  error?: string
  labelAction?: React.ReactNode
  className?: string
  children: React.ReactNode
}

function FieldShell({
  id,
  label,
  required = false,
  error,
  labelAction,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-sm font-semibold tracking-wide text-foreground uppercase"
        >
          {label}
          {required ? (
            <span className="ml-1 text-primary" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
        {labelAction}
      </div>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-sm font-medium text-destructive"
        >
          <AlertCircle
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  )
}

interface StringListEditorProps {
  idPrefix: string
  fieldKey: "highlights" | "conditions"
  title: string
  description: string
  placeholder: string
  recommendedMin: number
  items: string[]
  onChange: (nextItems: string[]) => void
  errors?: Record<string, string>
  disabled?: boolean
}

function StringListEditor({
  idPrefix,
  fieldKey,
  title,
  description,
  placeholder,
  recommendedMin,
  items,
  onChange,
  errors,
  disabled = false,
}: StringListEditorProps) {
  const [draftItem, setDraftItem] = React.useState("")
  const [pasteOpen, setPasteOpen] = React.useState(false)
  const [pasteText, setPasteText] = React.useState("")

  const parsedPasteItems = React.useMemo(
    () => parseBulkLines(pasteText),
    [pasteText]
  )

  const listError = errors?.[fieldKey]
  void recommendedMin

  const handleAddDraft = () => {
    const cleaned = draftItem.trim()
    if (!cleaned || disabled) return
    onChange([...items, cleaned])
    setDraftItem("")
  }

  const handleUpdateAt = (index: number, nextValue: string) => {
    const next = [...items]
    next[index] = nextValue
    onChange(next)
  }

  const [deletePointIndex, setDeletePointIndex] = React.useState<number | null>(
    null
  )
  const displayedDeletePointIndex = useStableDialogData(deletePointIndex)

  const handleRemoveAt = (index: number) => {
    onChange(items.filter((_, idx) => idx !== index))
    setDeletePointIndex(null)
  }

  const handleMove = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= items.length) return
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)
    onChange(next)
  }

  const handleApplyPaste = (mode: "append" | "replace") => {
    if (parsedPasteItems.length === 0) return
    if (mode === "replace") {
      onChange(parsedPasteItems)
    } else {
      onChange([...items, ...parsedPasteItems])
    }
    setPasteText("")
    setPasteOpen(false)
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">{description}</p>

        <Button
          type="button"
          variant="outline"
          size="default"
          disabled={disabled}
          onClick={() => setPasteOpen(true)}
          className="shrink-0 text-sm"
        >
          <ClipboardPaste className="size-4" aria-hidden="true" />
          Tempel Daftar
        </Button>
      </div>

      {items.length > 0 ? (
        <ul className="mt-3 space-y-2" aria-label={title}>
          {items.map((item, index) => {
            const itemError = errors?.[`${fieldKey}.${index}`]
            return (
              <li key={`${idPrefix}-row-${index}`} className="space-y-1">
                <div className="flex items-stretch gap-1.5">
                  <span
                    className="flex min-h-11 w-9 shrink-0 items-center justify-center border border-border bg-secondary text-sm font-semibold text-muted-foreground tabular-nums"
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <Input
                    id={`${idPrefix}-item-${index}`}
                    aria-label={`${title} poin ${index + 1}`}
                    aria-invalid={Boolean(itemError)}
                    value={item}
                    disabled={disabled}
                    onChange={(event) =>
                      handleUpdateAt(index, event.target.value)
                    }
                    placeholder={placeholder}
                    className="flex-1"
                  />
                  <div className="flex shrink-0 items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger render={<span className="inline-flex" />}>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={disabled || index === 0}
                          aria-label={`Pindahkan poin ${index + 1} ke atas`}
                          onClick={() => handleMove(index, -1)}
                        >
                          <ArrowUp className="size-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Pindah ke atas</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger render={<span className="inline-flex" />}>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={disabled || index === items.length - 1}
                          aria-label={`Pindahkan poin ${index + 1} ke bawah`}
                          onClick={() => handleMove(index, 1)}
                        >
                          <ArrowDown className="size-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Pindah ke bawah</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger render={<span className="inline-flex" />}>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={disabled}
                          aria-label={`Hapus poin ${index + 1}`}
                          onClick={() => setDeletePointIndex(index)}
                          className="text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Hapus poin</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                {itemError ? (
                  <p
                    role="alert"
                    className="pl-10 text-sm font-medium text-destructive"
                  >
                    {itemError}
                  </p>
                ) : null}
              </li>
            )
          })}
        </ul>
      ) : (
        <div className="mt-3 border border-dashed border-border bg-card px-4 py-4 text-center text-sm text-muted-foreground">
          Belum ada poin.
        </div>
      )}

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input
          id={`${idPrefix}-new`}
          aria-label={`Tambah poin baru untuk ${title}`}
          value={draftItem}
          disabled={disabled}
          onChange={(event) => setDraftItem(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              handleAddDraft()
            }
          }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || draftItem.trim().length === 0}
          onClick={handleAddDraft}
        >
          <Plus className="size-4" aria-hidden="true" />
          Tambah
        </Button>
      </div>

      {listError ? (
        <p
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-sm font-medium text-destructive"
        >
          <AlertCircle
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          <span>{listError}</span>
        </p>
      ) : null}

      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tempel {title}</DialogTitle>
            <DialogDescription>
              Satu poin per baris. Bullet, nomor, dan baris kosong dibersihkan
              otomatis.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-2">
            <Textarea
              id={`${idPrefix}-bulk-textarea`}
              aria-label={`Daftar ${title}`}
              rows={7}
              value={pasteText}
              disabled={disabled}
              onChange={(event) => setPasteText(event.target.value)}
              placeholder={`- Ban tebal semua\n- AC dingin double blower\n- Mesin kering siap luar kota`}
            />
            <div className="flex justify-end text-sm">
              <span className="font-semibold text-foreground tabular-nums">
                {parsedPasteItems.length} poin
              </span>
            </div>
          </div>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline">
                  Batal
                </Button>
              }
            />
            {items.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                disabled={disabled || parsedPasteItems.length === 0}
                onClick={() => handleApplyPaste("replace")}
              >
                Ganti Semua
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={disabled || parsedPasteItems.length === 0}
              onClick={() => handleApplyPaste("append")}
            >
              Tambahkan ({parsedPasteItems.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deletePointIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeletePointIndex(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Poin Ini?</DialogTitle>
            <DialogDescription>
              {displayedDeletePointIndex !== null &&
              items[displayedDeletePointIndex]?.trim()
                ? `Poin "${items[displayedDeletePointIndex]}" akan dihapus dari ${title}.`
                : `Poin #${displayedDeletePointIndex !== null ? displayedDeletePointIndex + 1 : ""} akan dihapus dari ${title}.`}
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
                if (deletePointIndex !== null) {
                  handleRemoveAt(deletePointIndex)
                }
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              <span>Ya, Hapus Poin</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export function CarIdentitySpecsForm({
  value,
  onChange,
  errors,
  isNew = false,
  disabled = false,
}: CarIdentitySpecsFormProps) {
  const bodyTypeItems = React.useMemo(() => {
    const map: Record<string, string> = {
      [EMPTY_SELECT_VALUE]: "Pilih tipe bodi",
    }
    for (const preset of BODY_TYPE_PRESETS) {
      map[preset] = preset
    }
    const current = value.bodyType?.trim()
    if (current && !(current in map)) {
      map[current] = current
    }
    return map
  }, [value.bodyType])

  const drivetrainItems = React.useMemo(() => {
    const map: Record<string, string> = {
      [EMPTY_SELECT_VALUE]: "Pilih penggerak",
      ...DRIVETRAIN_PRESETS,
    }
    const current = value.drivetrain?.trim()
    if (current && !(current in map)) {
      map[current] = current
    }
    return map
  }, [value.drivetrain])

  const statusMeta = STATUS_BADGE_MAP[value.status]
  const isEv = value.fuelType === "ev"

  const handleNameChange = (nextName: string) => {
    const patch: Partial<CarUpsertInput> = { name: nextName }
    if (isNew) {
      patch.slug = slugifyCarName(nextName, value.year)
    }
    onChange(patch)
  }

  const handleYearChange = (nextYear: string) => {
    const patch: Partial<CarUpsertInput> = { year: nextYear }
    const inferred = inferYearSort(nextYear)
    if (inferred !== null) {
      patch.yearSort = inferred
    }
    if (isNew) {
      patch.slug = slugifyCarName(value.name, nextYear)
    }
    onChange(patch)
  }

  const handleCategoryChange = (nextCategory: CarCategory) => {
    onChange({
      category: nextCategory,
      categoryLabel: getCategoryLabel(nextCategory),
    })
  }

  const handleFeaturedToggle = (checked: boolean) => {
    const clampedOrder =
      typeof value.featuredOrder === "number" &&
      value.featuredOrder >= 1 &&
      value.featuredOrder <= 3
        ? value.featuredOrder
        : 1
    onChange({
      isFeatured: checked,
      featuredOrder: checked ? clampedOrder : null,
    })
  }

  const handleNumberChange = (
    field: "seatCapacity" | "engineCc" | "mileageKm",
    raw: string
  ) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      onChange({ [field]: null })
      return
    }
    const parsed = Number.parseInt(trimmed, 10)
    if (!Number.isNaN(parsed)) {
      onChange({ [field]: parsed })
    }
  }

  const handleYearSortChange = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) {
      onChange({ yearSort: 0 })
      return
    }
    const parsed = Number.parseInt(trimmed, 10)
    if (!Number.isNaN(parsed)) {
      onChange({ yearSort: parsed })
    }
  }

  return (
    <FormSectionAccordion
      defaultValue={[
        "identity",
        "specs",
        "odometer",
        "highlights",
        "conditions",
      ]}
    >
      {/* SECTION A — IDENTITAS UNIT */}
      <FormSectionAccordionItem
        value="identity"
        headingId="section-identity-heading"
        eyebrow="01 / Profil"
        title="Identitas Unit"
        badge={
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
            {value.isFeatured ? (
              <Badge variant="primary" className="tabular-nums">
                <Star className="size-3" aria-hidden="true" />
                Hero #{value.featuredOrder ?? 1}
              </Badge>
            ) : null}
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <FieldShell
            id="car-brand"
            label="Merek"
            required
            error={errors?.brand}
            className="md:col-span-4"
          >
            <Input
              id="car-brand"
              value={value.brand}
              disabled={disabled}
              aria-invalid={Boolean(errors?.brand)}
              aria-describedby={errors?.brand ? "car-brand-error" : undefined}
              onChange={(event) => onChange({ brand: event.target.value })}
              placeholder="Contoh: Toyota, Honda, Mercedes-Benz"
            />
          </FieldShell>

          <FieldShell
            id="car-name"
            label="Nama Lengkap Unit"
            required
            error={errors?.name}
            className="md:col-span-8"
          >
            <Input
              id="car-name"
              value={value.name}
              disabled={disabled}
              aria-invalid={Boolean(errors?.name)}
              aria-describedby={errors?.name ? "car-name-error" : undefined}
              onChange={(event) => handleNameChange(event.target.value)}
              placeholder="Contoh: Toyota Kijang Innova Reborn 2.4 V Diesel"
            />
          </FieldShell>

          <FieldShell
            id="car-short-name"
            label="Nama Singkat"
            required
            error={errors?.shortName}
            className="md:col-span-8"
          >
            <Input
              id="car-short-name"
              value={value.shortName}
              disabled={disabled}
              aria-invalid={Boolean(errors?.shortName)}
              aria-describedby={
                errors?.shortName ? "car-short-name-error" : undefined
              }
              onChange={(event) => onChange({ shortName: event.target.value })}
              placeholder="Contoh: Innova Reborn 2.4 V"
            />
          </FieldShell>

          <FieldShell
            id="car-year"
            label="Tahun Tampil"
            required
            error={errors?.year}
            className="md:col-span-4"
          >
            <Input
              id="car-year"
              value={value.year}
              disabled={disabled}
              aria-invalid={Boolean(errors?.year)}
              aria-describedby={errors?.year ? "car-year-error" : undefined}
              onChange={(event) => handleYearChange(event.target.value)}
              placeholder="Contoh: 2015/2014"
              className="tabular-nums"
            />
          </FieldShell>

          <FieldShell
            id="car-year-sort"
            label="Tahun Katalog"
            required
            error={errors?.yearSort}
            className="md:col-span-3"
          >
            <Input
              id="car-year-sort"
              type="number"
              inputMode="numeric"
              min={1950}
              max={2100}
              value={value.yearSort > 0 ? String(value.yearSort) : ""}
              disabled={disabled}
              aria-invalid={Boolean(errors?.yearSort)}
              aria-describedby={errors?.yearSort ? "car-year-sort-error" : undefined}
              onChange={(event) => handleYearSortChange(event.target.value)}
              placeholder="2015"
              className="tabular-nums"
            />
          </FieldShell>

          <FieldShell
            id="car-category"
            label="Kategori Katalog"
            required
            error={errors?.category ?? errors?.categoryLabel}
            className="md:col-span-5"
          >
            <Select
              items={CATEGORY_ITEMS}
              value={value.category}
              disabled={disabled}
              onValueChange={(nextValue) => {
                if (!nextValue) return
                handleCategoryChange(nextValue)
              }}
            >
              <SelectTrigger
                id="car-category"
                aria-invalid={Boolean(errors?.category)}
                className="min-h-11 w-full bg-card px-3.5 text-sm text-foreground data-[size=default]:h-11"
              >
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(CATEGORY_ITEMS) as CarCategory[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {CATEGORY_ITEMS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>

          <FieldShell
            id="car-body-type"
            label="Tipe Bodi"
            error={errors?.bodyType}
            className="md:col-span-4"
          >
            <Select
              items={bodyTypeItems}
              value={value.bodyType?.trim() || EMPTY_SELECT_VALUE}
              disabled={disabled}
              onValueChange={(nextValue) => {
                if (!nextValue || nextValue === EMPTY_SELECT_VALUE) {
                  onChange({ bodyType: null })
                  return
                }
                onChange({ bodyType: nextValue })
              }}
            >
              <SelectTrigger
                id="car-body-type"
                aria-invalid={Boolean(errors?.bodyType)}
                className="min-h-11 w-full bg-card px-3.5 text-sm text-foreground data-[size=default]:h-11"
              >
                <SelectValue placeholder="Pilih tipe bodi" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(bodyTypeItems).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>

          <FieldShell
            id="car-seat-capacity"
            label="Kapasitas Kursi"
            error={errors?.seatCapacity}
            className="md:col-span-3"
          >
            <div className="relative">
              <Input
                id="car-seat-capacity"
                type="number"
                inputMode="numeric"
                min={1}
                max={20}
                value={
                  typeof value.seatCapacity === "number"
                    ? String(value.seatCapacity)
                    : ""
                }
                disabled={disabled}
                aria-invalid={Boolean(errors?.seatCapacity)}
                aria-describedby={errors?.seatCapacity ? "car-seat-capacity-error" : undefined}
                onChange={(event) =>
                  handleNumberChange("seatCapacity", event.target.value)
                }
                placeholder="7"
                className="pr-14 tabular-nums"
              />
              <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                kursi
              </span>
            </div>
          </FieldShell>

          <FieldShell
            id="car-location"
            label="Lokasi Unit"
            required
            error={errors?.location}
            className="md:col-span-5"
          >
            <Input
              id="car-location"
              value={value.location}
              disabled={disabled}
              aria-invalid={Boolean(errors?.location)}
              aria-describedby={
                errors?.location ? "car-location-error" : undefined
              }
              onChange={(event) => onChange({ location: event.target.value })}
              placeholder="Surakarta, Jawa Tengah"
            />
          </FieldShell>

          <FieldShell
            id="car-status"
            label="Status Unit"
            required
            error={errors?.status}
            className="md:col-span-4"
          >
            <Select
              items={STATUS_ITEMS}
              value={value.status}
              disabled={disabled}
              onValueChange={(nextValue) => {
                if (!nextValue) return
                onChange({ status: nextValue })
              }}
            >
              <SelectTrigger
                id="car-status"
                aria-invalid={Boolean(errors?.status)}
                className="min-h-11 w-full bg-card px-3.5 text-sm text-foreground data-[size=default]:h-11"
              >
                <SelectValue placeholder="Pilih status unit" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STATUS_ITEMS) as CarStatus[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {STATUS_ITEMS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>

          <FieldShell
            id="car-color"
            label="Warna Eksterior"
            required
            error={errors?.color}
            className="md:col-span-6"
          >
            <Input
              id="car-color"
              value={value.color}
              disabled={disabled}
              aria-invalid={Boolean(errors?.color)}
              aria-describedby={errors?.color ? "car-color-error" : undefined}
              onChange={(event) => onChange({ color: event.target.value })}
              placeholder="Contoh: Hitam Metalik, Putih Mutiara"
            />
          </FieldShell>

          <FieldShell
            id="car-interior-color"
            label="Warna Interior"
            error={errors?.interiorColor}
            className="md:col-span-6"
          >
            <Input
              id="car-interior-color"
              value={value.interiorColor ?? ""}
              disabled={disabled}
              aria-invalid={Boolean(errors?.interiorColor)}
              aria-describedby={errors?.interiorColor ? "car-interior-color-error" : undefined}
              onChange={(event) =>
                onChange({
                  interiorColor: event.target.value.trim()
                    ? event.target.value
                    : null,
                })
              }
              placeholder="Contoh: Hitam Kulit, Beige Fabric"
            />
          </FieldShell>

          <FieldShell
            id="car-offer-badge"
            label="Label Promo (Opsional)"
            error={errors?.offerBadge}
            className="md:col-span-12"
          >
            <Input
              id="car-offer-badge"
              value={value.offerBadge ?? ""}
              disabled={disabled}
              aria-invalid={Boolean(errors?.offerBadge)}
              aria-describedby={errors?.offerBadge ? "car-offer-badge-error" : undefined}
              onChange={(event) =>
                onChange({
                  offerBadge: event.target.value.trim()
                    ? event.target.value
                    : null,
                })
              }
              placeholder="Contoh: Special Price, Low KM"
            />
            <div className="mt-1 flex flex-wrap gap-1.5">
              {OFFER_BADGE_PRESETS.map((preset) => {
                const isSelected = value.offerBadge === preset
                return (
                  <button
                    key={preset}
                    type="button"
                    disabled={disabled}
                    aria-pressed={isSelected}
                    onClick={() =>
                      onChange({ offerBadge: isSelected ? null : preset })
                    }
                    className={cn(
                      "inline-flex min-h-11 items-center border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:opacity-50",
                      isSelected
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-secondary text-foreground hover:border-input"
                    )}
                  >
                    {preset}
                  </button>
                )
              })}
            </div>
          </FieldShell>

          {/* Hero Featured panel */}
          <div className="border border-border bg-secondary/50 p-4 md:col-span-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <Switch
                  id="car-is-featured"
                  checked={value.isFeatured}
                  disabled={disabled}
                  onCheckedChange={handleFeaturedToggle}
                  aria-label="Tampilkan di Hero Beranda"
                />
                <div>
                  <label
                    htmlFor="car-is-featured"
                    className="block text-sm font-semibold text-foreground"
                  >
                    Tampilkan di Sorotan Beranda
                  </label>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Maksimal 3 unit unggulan di bagian atas beranda.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:items-end">
                <span className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                  Urutan Sorotan (1–3)
                </span>
                <div
                  role="group"
                  aria-label="Pilih slot urutan hero"
                  className="inline-flex gap-1.5"
                >
                  {FEATURED_SLOTS.map((slot) => {
                    const active =
                      value.isFeatured && value.featuredOrder === slot
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={disabled || !value.isFeatured}
                        aria-pressed={active}
                        onClick={() =>
                          onChange({ isFeatured: true, featuredOrder: slot })
                        }
                        className={cn(
                          "inline-flex min-h-11 min-w-11 items-center justify-center border px-3 text-sm font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-45",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-card text-foreground hover:bg-secondary"
                        )}
                      >
                        #{slot}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
            {errors?.featuredOrder || errors?.isFeatured ? (
              <p
                role="alert"
                className="mt-2 flex items-start gap-1.5 text-sm font-medium text-destructive"
              >
                <AlertCircle
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <span>{errors.featuredOrder || errors.isFeatured}</span>
              </p>
            ) : null}
          </div>
        </div>
      </FormSectionAccordionItem>

      {/* SECTION B — SPESIFIKASI TEKNIS */}
      <FormSectionAccordionItem
        value="specs"
        headingId="section-specs-heading"
        eyebrow="02 / Teknis"
        title="Spesifikasi Mesin & Dimensi"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <FieldShell
            id="car-transmission"
            label="Detail Transmisi"
            required
            error={errors?.transmission}
            className="md:col-span-6"
          >
            <Input
              id="car-transmission"
              value={value.transmission}
              disabled={disabled}
              aria-invalid={Boolean(errors?.transmission)}
              aria-describedby={errors?.transmission ? "car-transmission-error" : undefined}
              onChange={(event) =>
                onChange({ transmission: event.target.value })
              }
              placeholder="Contoh: Automatic Triptonic, Manual"
            />
          </FieldShell>

          <FieldShell
            id="car-transmission-group"
            label="Kelompok Transmisi"
            required
            error={errors?.transmissionGroup}
            className="md:col-span-6"
          >
            <Select
              items={TRANSMISSION_GROUP_ITEMS}
              value={value.transmissionGroup}
              disabled={disabled}
              onValueChange={(nextValue) => {
                if (!nextValue) return
                onChange({ transmissionGroup: nextValue })
              }}
            >
              <SelectTrigger
                id="car-transmission-group"
                aria-invalid={Boolean(errors?.transmissionGroup)}
                className="min-h-11 w-full bg-card px-3.5 text-sm text-foreground data-[size=default]:h-11"
              >
                <SelectValue placeholder="Pilih kelompok transmisi" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.keys(TRANSMISSION_GROUP_ITEMS) as TransmissionGroup[]
                ).map((key) => (
                  <SelectItem key={key} value={key}>
                    {TRANSMISSION_GROUP_ITEMS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>

          <FieldShell
            id="car-fuel-type"
            label="Jenis Bahan Bakar"
            required
            error={errors?.fuelType}
            className="md:col-span-4"
          >
            <Select
              items={FUEL_TYPE_ITEMS}
              value={value.fuelType}
              disabled={disabled}
              onValueChange={(nextValue) => {
                if (!nextValue) return
                onChange({ fuelType: nextValue })
              }}
            >
              <SelectTrigger
                id="car-fuel-type"
                aria-invalid={Boolean(errors?.fuelType)}
                className="min-h-11 w-full bg-card px-3.5 text-sm text-foreground data-[size=default]:h-11"
              >
                <SelectValue placeholder="Pilih bahan bakar" />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FUEL_TYPE_ITEMS) as FuelType[]).map((key) => (
                  <SelectItem key={key} value={key}>
                    {FUEL_TYPE_ITEMS[key]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>

          <FieldShell
            id="car-engine-cc"
            label="Kapasitas Mesin"
            error={errors?.engineCc}
            className="md:col-span-4"
          >
            <div className="relative">
              <Input
                id="car-engine-cc"
                type="number"
                inputMode="numeric"
                min={0}
                value={
                  typeof value.engineCc === "number"
                    ? String(value.engineCc)
                    : ""
                }
                disabled={disabled}
                aria-invalid={Boolean(errors?.engineCc)}
                aria-describedby={errors?.engineCc ? "car-engine-cc-error" : undefined}
                onChange={(event) =>
                  handleNumberChange("engineCc", event.target.value)
                }
                placeholder={isEv ? "Tidak berlaku untuk EV" : "1496"}
                className="pr-12 tabular-nums"
              />
              <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm font-medium text-muted-foreground uppercase">
                cc
              </span>
            </div>
          </FieldShell>

          <FieldShell
            id="car-drivetrain"
            label="Sistem Penggerak"
            error={errors?.drivetrain}
            className="md:col-span-4"
          >
            <Select
              items={drivetrainItems}
              value={value.drivetrain?.trim() || EMPTY_SELECT_VALUE}
              disabled={disabled}
              onValueChange={(nextValue) => {
                if (!nextValue || nextValue === EMPTY_SELECT_VALUE) {
                  onChange({ drivetrain: null })
                  return
                }
                onChange({ drivetrain: nextValue })
              }}
            >
              <SelectTrigger
                id="car-drivetrain"
                aria-invalid={Boolean(errors?.drivetrain)}
                className="min-h-11 w-full bg-card px-3.5 text-sm text-foreground data-[size=default]:h-11"
              >
                <SelectValue placeholder="Pilih penggerak" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(drivetrainItems).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
        </div>
      </FormSectionAccordionItem>

      {/* SECTION C — ODOMETER & VERIFIKASI */}
      <FormSectionAccordionItem
        value="odometer"
        headingId="section-odometer-heading"
        eyebrow="03 / Jarak Tempuh"
        title="Odometer & Verifikasi"
        badge={
          value.mileageVerified ? (
            <Badge variant="success">
              <ShieldCheck className="size-3" aria-hidden="true" />
              Odometer Terverifikasi
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Gauge className="size-3" aria-hidden="true" />
              Belum Diverifikasi
            </Badge>
          )
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <FieldShell
            id="car-mileage-km"
            label="Angka Odometer (KM)"
            error={errors?.mileageKm}
            className="md:col-span-5"
          >
            <div className="relative">
              <Input
                id="car-mileage-km"
                type="number"
                inputMode="numeric"
                min={0}
                value={
                  typeof value.mileageKm === "number"
                    ? String(value.mileageKm)
                    : ""
                }
                disabled={disabled}
                aria-invalid={Boolean(errors?.mileageKm)}
                aria-describedby={errors?.mileageKm ? "car-mileage-km-error" : undefined}
                onChange={(event) =>
                  handleNumberChange("mileageKm", event.target.value)
                }
                placeholder="65000"
                className="pr-12 tabular-nums"
              />
              <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm font-medium text-muted-foreground uppercase">
                km
              </span>
            </div>
          </FieldShell>

          <FieldShell
            id="car-mileage-label"
            label="Label Odometer Tampil"
            required
            error={errors?.mileageLabel}
            className="md:col-span-7"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="car-mileage-label"
                value={value.mileageLabel}
                disabled={disabled}
                aria-invalid={Boolean(errors?.mileageLabel)}
                aria-describedby={errors?.mileageLabel ? "car-mileage-label-error" : undefined}
                onChange={(event) =>
                  onChange({ mileageLabel: event.target.value })
                }
                placeholder="Contoh: 65 ribu km on going"
                className="flex-1"
              />
              {typeof value.mileageKm === "number" && value.mileageKm > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  onClick={() =>
                    onChange({
                      mileageLabel: formatMileageSuggestion(
                        value.mileageKm ?? 0
                      ),
                    })
                  }
                >
                  Isi dari KM
                </Button>
              ) : null}
            </div>
          </FieldShell>

          <div className="space-y-4 border border-border bg-secondary/50 p-4 md:col-span-12">
            <div className="flex items-start gap-3">
              <Switch
                id="car-mileage-verified"
                checked={value.mileageVerified}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  onChange({ mileageVerified: checked })
                }
                aria-label="Odometer Terverifikasi Asli"
                className="mt-0.5 shrink-0"
              />
              <div className="min-w-0">
                <label
                  htmlFor="car-mileage-verified"
                  className="block text-sm font-semibold text-foreground"
                >
                  Odometer Terverifikasi Asli
                </label>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Keaslian kilometer sudah dicek melalui buku servis, bengkel
                  resmi, atau scan OBD.
                </p>
                {errors?.mileageVerified ? (
                  <p
                    role="alert"
                    className="mt-1.5 text-sm font-medium text-destructive"
                  >
                    {errors.mileageVerified}
                  </p>
                ) : null}
              </div>
            </div>

            <FieldShell
              id="car-mileage-verification-source"
              label="Sumber Verifikasi Odometer"
              error={errors?.mileageVerificationSource}
            >
              <Input
                id="car-mileage-verification-source"
                value={value.mileageVerificationSource ?? ""}
                disabled={disabled}
                aria-invalid={Boolean(errors?.mileageVerificationSource)}
                aria-describedby={
                  errors?.mileageVerificationSource
                    ? "car-mileage-verification-source-error"
                    : undefined
                }
                onChange={(event) =>
                  onChange({
                    mileageVerificationSource: event.target.value.trim()
                      ? event.target.value
                      : null,
                  })
                }
                placeholder="Catatan servis resmi, scan OBD, atau faktur berkala"
              />
            </FieldShell>
          </div>
        </div>
      </FormSectionAccordionItem>

      {/* SECTION D — HIGHLIGHTS KEUNGGULAN UTAMA */}
      <FormSectionAccordionItem
        value="highlights"
        headingId="section-highlights-heading"
        eyebrow="04 / Highlights"
        title="Keunggulan Utama"
        badge={
          <Badge
            variant={
              value.highlights.filter((item) => item.trim().length > 0)
                .length >= 3
                ? "success"
                : "secondary"
            }
            className="tabular-nums"
          >
            <Sparkles className="size-3" aria-hidden="true" />
            {value.highlights.filter((item) => item.trim().length > 0).length}
            /3+ Poin
          </Badge>
        }
      >
        <div>
          <StringListEditor
            idPrefix="car-highlights"
            fieldKey="highlights"
            title="Highlights Keunggulan Utama"
            description="Keunggulan utama yang tampil di kartu dan detail unit."
            placeholder="Contoh: Jok kulit original, pajak panjang, servis resmi"
            recommendedMin={3}
            items={value.highlights}
            onChange={(nextHighlights) =>
              onChange({ highlights: nextHighlights })
            }
            errors={errors}
            disabled={disabled}
          />
        </div>
      </FormSectionAccordionItem>

      {/* SECTION E — KONDISI FISIK & KELENGKAPAN */}
      <FormSectionAccordionItem
        value="conditions"
        headingId="section-conditions-heading"
        eyebrow="05 / Kondisi"
        title="Fisik, Mesin & Interior"
        badge={
          <Badge
            variant={
              value.conditions.filter((item) => item.trim().length > 0)
                .length >= 4
                ? "success"
                : "secondary"
            }
            className="tabular-nums"
          >
            <ListChecks className="size-3" aria-hidden="true" />
            {value.conditions.filter((item) => item.trim().length > 0).length}
            /4+ Poin
          </Badge>
        }
      >
        <div>
          <StringListEditor
            idPrefix="car-conditions"
            fieldKey="conditions"
            title="Kondisi Fisik & Kelengkapan"
            description="Kondisi mesin, kaki-kaki, interior, ban, dan fitur."
            placeholder="Contoh: AC dingin, ban tebal, kaki-kaki senyap, mesin kering"
            recommendedMin={4}
            items={value.conditions}
            onChange={(nextConditions) =>
              onChange({ conditions: nextConditions })
            }
            errors={errors}
            disabled={disabled}
          />
        </div>
      </FormSectionAccordionItem>
    </FormSectionAccordion>
  )
}
