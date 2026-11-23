import * as React from "react"
import { cn } from "cn"
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Banknote,
  Calculator,
  Check,
  CreditCard,
  Info,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react"
import type {
  CarUpsertInput,
  CreditSimulationInput,
} from "@/lib/domain/schemas"
import type { PaymentMode } from "@/lib/domain/types"
import { formatRupiah, formatShortJuta } from "@/lib/domain/formatters"
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface CarPricingCreditFormProps {
  value: CarUpsertInput
  onChange: (patch: Partial<CarUpsertInput>) => void
  errors?: Record<string, string>
  disabled?: boolean
}

const MAX_RUPIAH_DIGITS = 12 // Up to Rp999.999.999.999

const BASE_TENOR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const

const CREDIT_NOTE_PRESETS = [
  "Khusus kredit nett",
  "OTR khusus kredit (S&K berlaku)",
  "Khusus paket kredit rekanan showroom",
] as const

const EMPTY_PROVIDER_VALUE = "__none__"

const PROVIDER_SUGGESTIONS = [
  "BCA Finance",
  "Hana Finance",
  "CIMB Niaga Finance",
  "Clipan Finance",
  "Adira Finance",
] as const

function buildProviderItems(current?: string | null): Record<string, string> {
  const map: Record<string, string> = {
    [EMPTY_PROVIDER_VALUE]: "Pilih leasing / bank",
  }
  for (const provider of PROVIDER_SUGGESTIONS) {
    map[provider] = provider
  }
  const trimmed = current?.trim()
  if (trimmed && !(trimmed in map)) {
    map[trimmed] = trimmed
  }
  return map
}

const PAYMENT_MODE_OPTIONS: ReadonlyArray<{
  value: PaymentMode
  title: string
  description: string
  icon: typeof CreditCard
}> = [
  {
    value: "cash-credit",
    title: "Cash & Kredit",
    description:
      "Tersedia harga tunai, harga khusus kredit, dan paket simulasi leasing.",
    icon: CreditCard,
  },
  {
    value: "cash-only",
    title: "Cash Only",
    description: "Khusus pembelian tunai tanpa penawaran paket kredit.",
    icon: Banknote,
  },
]

function formatIntegerThousands(amount: number): string {
  return new Intl.NumberFormat("id-ID").format(amount)
}

function sanitizeDigits(raw: string, allowZero: boolean): string {
  const onlyDigits = raw.replace(/[^\d]/g, "").slice(0, MAX_RUPIAH_DIGITS)
  if (!onlyDigits) return ""
  const stripped = onlyDigits.replace(/^0+/, "")
  if (stripped === "") {
    return allowZero ? "0" : ""
  }
  return stripped
}

interface RupiahInputProps {
  id: string
  value: number | null | undefined
  onValueChange: (next: number | null) => void
  nullable?: boolean
  allowZero?: boolean
  placeholder?: string
  disabled?: boolean
  invalid?: boolean
  ariaDescribedBy?: string
}

function RupiahInput({
  id,
  value,
  onValueChange,
  nullable = false,
  allowZero = false,
  placeholder,
  disabled = false,
  invalid = false,
  ariaDescribedBy,
}: RupiahInputProps) {
  const [isFocused, setIsFocused] = React.useState(false)
  const [draft, setDraft] = React.useState("")
  const [explicitZero, setExplicitZero] = React.useState(false)

  const numericValue =
    typeof value === "number" && Number.isFinite(value) ? Math.trunc(value) : null

  const formattedWhenBlurred = React.useMemo(() => {
    if (numericValue === null) return ""
    if (numericValue > 0) return formatIntegerThousands(numericValue)
    if (allowZero && explicitZero && numericValue === 0) return "0"
    return ""
  }, [numericValue, allowZero, explicitZero])

  const displayValue = isFocused ? draft : formattedWhenBlurred

  const handleFocus = () => {
    setIsFocused(true)
    if (numericValue !== null && numericValue > 0) {
      setDraft(String(numericValue))
    } else if (allowZero && explicitZero && numericValue === 0) {
      setDraft("0")
    } else {
      setDraft("")
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitizeDigits(event.target.value, allowZero)
    setDraft(cleaned)

    if (cleaned === "") {
      setExplicitZero(false)
      onValueChange(nullable ? null : 0)
      return
    }

    const parsed = Number.parseInt(cleaned, 10)
    if (!Number.isFinite(parsed)) {
      setExplicitZero(false)
      onValueChange(nullable ? null : 0)
      return
    }

    setExplicitZero(parsed === 0)
    onValueChange(parsed)
  }

  return (
    <div className="relative flex items-center">
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-px left-px flex w-11 items-center justify-center border-r border-border bg-secondary text-sm font-semibold tracking-wide text-muted-foreground select-none",
          disabled && "opacity-60",
        )}
      >
        Rp
      </span>
      <Input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={displayValue}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={ariaDescribedBy}
        className="pl-14 tabular-nums"
      />
    </div>
  )
}

function buildTenorItems(currentTenor: number): {
  options: number[]
  labels: Record<string, string>
} {
  const options: number[] = [...BASE_TENOR_OPTIONS]
  if (
    Number.isInteger(currentTenor) &&
    currentTenor >= 1 &&
    currentTenor <= 10 &&
    !options.includes(currentTenor)
  ) {
    options.push(currentTenor)
    options.sort((a, b) => a - b)
  }
  const labels: Record<string, string> = {}
  for (const yr of options) {
    labels[String(yr)] = `${yr} Tahun (${yr * 12} bulan)`
  }
  return { options, labels }
}

function normalizeSortOrder(
  list: CreditSimulationInput[],
): CreditSimulationInput[] {
  return list.map((item, idx) => ({
    ...item,
    sortOrder: idx,
  }))
}

export function CarPricingCreditForm({
  value,
  onChange,
  errors,
  disabled = false,
}: CarPricingCreditFormProps) {
  const baseId = React.useId()
  const simulations = value.creditSimulations
  const isCashCredit = value.paymentMode === "cash-credit"

  // Maintain client-side stable keys for newly added rows without polluting `sim.id` (which Zod expects to be a UUID)
  const keySeedRef = React.useRef(0)
  const [localKeys, setLocalKeys] = React.useState<string[]>(() =>
    simulations.map((sim, idx) => sim.id ?? `init-${idx}`),
  )

  const getRowKey = (sim: CreditSimulationInput, index: number): string => {
    if (sim.id) return sim.id
    return index < localKeys.length ? localKeys[index] : `row-${index}`
  }

  const padKeys = (prev: string[]) =>
    simulations.map((sim, idx) =>
      idx < prev.length ? prev[idx] : (sim.id ?? `row-${idx}`),
    )

  const nextLocalKey = () => {
    keySeedRef.current += 1
    return `sim-local-${keySeedRef.current}`
  }

  const hasCreditPrice =
    typeof value.creditPrice === "number" &&
    Number.isFinite(value.creditPrice) &&
    value.creditPrice > 0

  const hasCashPrice =
    typeof value.cashPrice === "number" &&
    Number.isFinite(value.cashPrice) &&
    value.cashPrice > 0

  const creditNotLowerThanCash =
    isCashCredit &&
    hasCashPrice &&
    hasCreditPrice &&
    (value.creditPrice as number) >= value.cashPrice

  const creditSavings =
    isCashCredit &&
    hasCashPrice &&
    hasCreditPrice &&
    value.cashPrice > (value.creditPrice as number)
      ? value.cashPrice - (value.creditPrice as number)
      : 0

  const hasLeftoverCreditDataInCashOnly =
    !isCashCredit &&
    (hasCreditPrice || simulations.length > 0)

  const handlePaymentModeChange = (nextMode: PaymentMode) => {
    if (disabled || nextMode === value.paymentMode) return
    onChange({ paymentMode: nextMode })
  }

  const handleClearCreditData = () => {
    if (disabled) return
    setLocalKeys([])
    onChange({
      creditPrice: null,
      creditSimulations: [],
    })
  }

  const handleAddSimulation = () => {
    if (disabled) return
    const nextNumber = simulations.length + 1
    const newSimulation: CreditSimulationInput = {
      label: `Simulasi Kredit ${nextNumber}`,
      provider: "",
      dp: 0,
      installment: null,
      installmentLabel: "",
      tenorYears: 4,
      note: "",
      sortOrder: simulations.length,
    }
    setLocalKeys((prev) => [...padKeys(prev), nextLocalKey()])
    onChange({
      creditSimulations: normalizeSortOrder([...simulations, newSimulation]),
    })
  }

  const [deleteSimulationIndex, setDeleteSimulationIndex] = React.useState<
    number | null
  >(null)
  const displayedDeleteSimulationIndex = useStableDialogData(
    deleteSimulationIndex
  )

  const handleRemoveSimulation = (index: number) => {
    if (disabled) return
    setLocalKeys((prev) => padKeys(prev).filter((_, idx) => idx !== index))
    const next = simulations.filter((_, idx) => idx !== index)
    onChange({
      creditSimulations: normalizeSortOrder(next),
    })
    setDeleteSimulationIndex(null)
  }

  const handleMoveSimulation = (index: number, direction: -1 | 1) => {
    if (disabled) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= simulations.length) return

    setLocalKeys((prev) => {
      const swapped = padKeys(prev)
      const tempKey = swapped[index]
      swapped[index] = swapped[targetIndex]
      swapped[targetIndex] = tempKey
      return swapped
    })

    const next = [...simulations]
    const temp = next[index]
    next[index] = next[targetIndex]
    next[targetIndex] = temp

    onChange({
      creditSimulations: normalizeSortOrder(next),
    })
  }

  const handleUpdateSimulation = (
    index: number,
    patch: Partial<CreditSimulationInput>,
  ) => {
    if (disabled) return
    const next = simulations.map((item, idx) =>
      idx === index ? { ...item, ...patch } : item,
    )
    onChange({ creditSimulations: next })
  }

  const handleSimulationInstallmentChange = (
    index: number,
    nextInstallment: number | null,
  ) => {
    const current = simulations[index]
    const prevAutoLabel =
      current.installment !== null && current.installment > 0
        ? formatRupiah(current.installment)
        : ""
    const currentLabelTrimmed = current.installmentLabel.trim()
    const isAutoSynced =
      currentLabelTrimmed === "" || currentLabelTrimmed === prevAutoLabel

    const patch: Partial<CreditSimulationInput> = {
      installment: nextInstallment,
    }

    if (isAutoSynced) {
      if (nextInstallment !== null && nextInstallment > 0) {
        patch.installmentLabel = formatRupiah(nextInstallment)
      } else if (currentLabelTrimmed === prevAutoLabel) {
        patch.installmentLabel = ""
      }
    }

    handleUpdateSimulation(index, patch)
  }

  return (
    <div className="space-y-6">
      {/* SECTION A — Skema Pembayaran & Harga */}
      <section
        aria-labelledby={`${baseId}-section-a-heading`}
        className="border border-border bg-card"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-secondary/50 px-5 py-4">
          <div className="space-y-1">
            <p className="font-heading text-sm font-bold tracking-widest text-primary uppercase tabular-nums">
              01 / Skema &amp; Harga
            </p>
            <h3
              id={`${baseId}-section-a-heading`}
              className="font-heading text-base font-bold tracking-tight text-foreground sm:text-lg"
            >
              Skema Pembayaran &amp; Harga Unit
            </h3>
          </div>
          <Badge variant={isCashCredit ? "primary" : "default"}>
            {isCashCredit ? "Cash & Kredit" : "Cash Only"}
          </Badge>
        </div>

        <div className="space-y-6 p-5">
          {/* Payment Mode Segmented Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span
                id={`${baseId}-payment-mode-label`}
                className="text-sm font-semibold tracking-wider text-foreground uppercase"
              >
                Skema Pembayaran <span className="text-primary">*</span>
              </span>
            </div>

            <div
              role="radiogroup"
              aria-labelledby={`${baseId}-payment-mode-label`}
              aria-invalid={Boolean(errors?.paymentMode) || undefined}
              className="grid grid-cols-1 gap-3 sm:grid-cols-2"
            >
              {PAYMENT_MODE_OPTIONS.map((option) => {
                const Icon = option.icon
                const selected = value.paymentMode === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    disabled={disabled}
                    onClick={() => handlePaymentModeChange(option.value)}
                    className={cn(
                      "flex min-h-11 items-start gap-3.5 border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-55",
                      selected
                        ? "border-foreground bg-foreground text-background"
                        : "border-input bg-card text-foreground hover:bg-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-8 shrink-0 items-center justify-center border",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-secondary text-foreground",
                      )}
                    >
                      <Icon className="size-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-heading text-sm font-bold">
                          {option.title}
                        </span>
                        {selected && (
                          <Check
                            className="size-4 shrink-0 text-primary-foreground"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                      <span
                        className={cn(
                          "block text-sm leading-relaxed",
                          selected
                            ? "text-background/80"
                            : "text-muted-foreground",
                        )}
                      >
                        {option.description}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>

            {errors?.paymentMode && (
              <p
                role="alert"
                className="text-sm font-medium text-destructive"
              >
                {errors.paymentMode}
              </p>
            )}
          </div>

          {/* Price Inputs Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Cash Price */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between gap-2">
                <label
                  htmlFor={`${baseId}-cash-price`}
                  className="text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Harga Cash Utama <span className="text-primary">*</span>
                </label>
                {hasCashPrice && (
                  <span className="text-sm font-semibold text-foreground tabular-nums">
                    {formatShortJuta(value.cashPrice)}
                  </span>
                )}
              </div>

              <RupiahInput
                id={`${baseId}-cash-price`}
                value={value.cashPrice}
                onValueChange={(next) => onChange({ cashPrice: next ?? 0 })}
                nullable={false}
                placeholder="Contoh: 195000000"
                disabled={disabled}
                invalid={Boolean(errors?.cashPrice)}
                ariaDescribedBy={
                  errors?.cashPrice
                    ? `${baseId}-cash-price-error`
                    : `${baseId}-cash-price-preview`
                }
              />

              <div
                id={`${baseId}-cash-price-preview`}
                className="flex flex-wrap items-center justify-between gap-2 border border-border/80 bg-secondary/50 px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">Preview tampil:</span>
                <span
                  className={cn(
                    "font-heading font-bold tabular-nums",
                    hasCashPrice ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {hasCashPrice ? formatRupiah(value.cashPrice) : "Rp0"}
                </span>
              </div>

              {errors?.cashPrice && (
                <p
                  id={`${baseId}-cash-price-error`}
                  role="alert"
                  className="text-sm font-medium text-destructive"
                >
                  {errors.cashPrice}
                </p>
              )}
            </div>

            {/* Credit Price (Cash & Credit mode) OR Cash-Only Note */}
            {isCashCredit ? (
              <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-2">
                  <label
                    htmlFor={`${baseId}-credit-price`}
                    className="text-sm font-semibold tracking-wider text-foreground uppercase"
                  >
                    Harga Khusus Kredit
                  </label>
                  {hasCreditPrice && (
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {formatShortJuta(value.creditPrice as number)}
                    </span>
                  )}
                </div>

                <RupiahInput
                  id={`${baseId}-credit-price`}
                  value={value.creditPrice}
                  onValueChange={(next) => onChange({ creditPrice: next })}
                  nullable={true}
                  placeholder="Contoh: 185000000"
                  disabled={disabled}
                  invalid={Boolean(errors?.creditPrice)}
                  ariaDescribedBy={
                    errors?.creditPrice
                      ? `${baseId}-credit-price-error`
                      : `${baseId}-credit-price-preview`
                  }
                />

                <div
                  id={`${baseId}-credit-price-preview`}
                  className="flex flex-wrap items-center justify-between gap-2 border border-border/80 bg-secondary/50 px-3 py-2 text-sm"
                >
                  <span className="text-muted-foreground">Preview kredit:</span>
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-heading font-bold tabular-nums",
                        hasCreditPrice
                          ? "text-foreground"
                          : "text-muted-foreground",
                      )}
                    >
                      {hasCreditPrice
                        ? formatRupiah(value.creditPrice as number)
                        : "Belum diisi"}
                    </span>
                    {creditSavings > 0 && (
                      <Badge variant="success" className="tabular-nums">
                        Selisih -{formatShortJuta(creditSavings)}
                      </Badge>
                    )}
                  </span>
                </div>

                {errors?.creditPrice && (
                  <p
                    id={`${baseId}-credit-price-error`}
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {errors.creditPrice}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label
                  htmlFor={`${baseId}-cash-note`}
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Catatan Harga Tunai (Opsional)
                </label>
                <Input
                  id={`${baseId}-cash-note`}
                  type="text"
                  value={value.creditPriceNote ?? ""}
                  onChange={(event) =>
                    onChange({ creditPriceNote: event.target.value })
                  }
                  placeholder="Catatan harga tunai, mis. Special Price Rp90.000.000"
                  disabled={disabled}
                  aria-invalid={Boolean(errors?.creditPriceNote) || undefined}
                />
                {errors?.creditPriceNote && (
                  <p
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {errors.creditPriceNote}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Non-blocking Warning when creditPrice >= cashPrice */}
          {creditNotLowerThanCash && (
            <div
              role="status"
              className="flex items-start gap-3 border border-amber-700/35 bg-amber-50 p-3.5 text-amber-950"
            >
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-amber-800"
                aria-hidden="true"
              />
              <div className="space-y-0.5 text-sm leading-relaxed">
                <p className="font-semibold">
                  Harga kredit sama atau lebih tinggi dari harga cash
                </p>
                <p className="tabular-nums">
                  Harga kredit (
                  <strong>{formatRupiah(value.creditPrice as number)}</strong>)
                  &ge; harga cash (
                  <strong>{formatRupiah(value.cashPrice)}</strong>). Biasanya
                  harga khusus kredit lebih rendah dari harga cash — pastikan
                  nominal sudah sesuai sebelum dipublikasikan.
                </p>
              </div>
            </div>
          )}

          {/* Credit Price Note (when cash-credit) */}
          {isCashCredit && (
            <div className="space-y-2">
              <label
                htmlFor={`${baseId}-credit-price-note`}
                className="block text-sm font-semibold tracking-wider text-foreground uppercase"
              >
                Catatan Harga Kredit
              </label>
              <Input
                id={`${baseId}-credit-price-note`}
                type="text"
                value={value.creditPriceNote ?? ""}
                onChange={(event) =>
                  onChange({ creditPriceNote: event.target.value })
                }
                placeholder="Contoh: Khusus kredit nett"
                disabled={disabled}
                aria-invalid={Boolean(errors?.creditPriceNote) || undefined}
                aria-describedby={
                  errors?.creditPriceNote
                    ? `${baseId}-credit-price-note-error`
                    : undefined
                }
              />
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {CREDIT_NOTE_PRESETS.map((preset) => {
                  const isActive =
                    (value.creditPriceNote ?? "").trim() === preset
                  return (
                    <button
                      key={preset}
                      type="button"
                      disabled={disabled}
                      aria-pressed={isActive}
                      onClick={() =>
                        onChange({ creditPriceNote: isActive ? "" : preset })
                      }
                      className={cn(
                        "inline-flex min-h-11 items-center border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50",
                        isActive
                          ? "border-foreground bg-foreground text-background"
                          : "border-border bg-secondary text-foreground hover:border-input",
                      )}
                    >
                      {preset}
                    </button>
                  )
                })}
              </div>
              {errors?.creditPriceNote && (
                <p
                  id={`${baseId}-credit-price-note-error`}
                  role="alert"
                  className="text-sm font-medium text-destructive"
                >
                  {errors.creditPriceNote}
                </p>
              )}
            </div>
          )}

          {/* Cash-Only Notice & Optional Cleanup Action */}
          {!isCashCredit && (
            <div
              className={cn(
                "flex flex-col gap-3 border p-4 sm:flex-row sm:items-center sm:justify-between",
                hasLeftoverCreditDataInCashOnly
                  ? "border-amber-700/35 bg-amber-50 text-amber-950"
                  : "border-border bg-secondary/40 text-foreground",
              )}
            >
              <div className="flex items-start gap-3">
                <Info
                  className={cn(
                    "mt-0.5 size-4 shrink-0",
                    hasLeftoverCreditDataInCashOnly
                      ? "text-amber-800"
                      : "text-muted-foreground",
                  )}
                  aria-hidden="true"
                />
                <div className="space-y-0.5 text-sm leading-relaxed">
                  <p className="font-semibold">
                    Mode Cash Only aktif. Simulasi kredit disembunyikan.
                  </p>
                  {hasLeftoverCreditDataInCashOnly ? (
                    <p>
                      Masih tersimpan{" "}
                      {hasCreditPrice ? (
                        <strong className="tabular-nums">
                          harga kredit ({formatRupiah(value.creditPrice as number)})
                        </strong>
                      ) : null}
                      {hasCreditPrice && simulations.length > 0 ? " dan " : ""}
                      {simulations.length > 0 ? (
                        <strong className="tabular-nums">
                          {simulations.length} paket simulasi
                        </strong>
                      ) : null}
                      . Data ini tidak tampil ke pembeli saat Cash Only, atau
                      Anda bisa membersihkannya sekarang.
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Unit hanya menampilkan harga tunai. Ubah ke{" "}
                      <strong>Cash &amp; Kredit</strong> kapan saja jika ingin
                      menambahkan harga kredit dan simulasi leasing.
                    </p>
                  )}
                </div>
              </div>

              {hasLeftoverCreditDataInCashOnly && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearCreditData}
                  disabled={disabled}
                  className="shrink-0 border-amber-800/40 bg-card text-amber-950 hover:bg-amber-100"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Bersihkan Data Kredit
                </Button>
              )}
            </div>
          )}

          {/* Trade-in Switch */}
          <div className="flex items-center justify-between gap-4 border border-border bg-secondary/40 p-4">
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center border border-border bg-card text-foreground">
                <ArrowLeftRight className="size-4" aria-hidden="true" />
              </span>
              <div className="space-y-0.5">
                <label
                  htmlFor={`${baseId}-trade-in`}
                  className="block font-heading text-sm font-bold text-foreground"
                >
                  Melayani Tukar Tambah
                </label>
                <p className="text-sm text-muted-foreground">
                  Tampilkan badge &ldquo;Bisa Tukar Tambah&rdquo; di halaman
                  unit.
                </p>
              </div>
            </div>

            <Switch
              id={`${baseId}-trade-in`}
              checked={Boolean(value.tradeInAvailable)}
              onCheckedChange={(checked) =>
                  onChange({ tradeInAvailable: checked })
                }
                disabled={disabled}
                aria-label="Melayani Tukar Tambah"
                className="shrink-0"
              />
          </div>
          {errors?.tradeInAvailable && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errors.tradeInAvailable}
            </p>
          )}
        </div>
      </section>

      {/* SECTION B — Repeater Simulasi Kredit Leasing */}
      {isCashCredit && (
        <section
          aria-labelledby={`${baseId}-section-b-heading`}
          className="border border-border bg-card"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-secondary/50 px-5 py-4">
            <div className="space-y-1">
              <p className="font-heading text-sm font-bold tracking-widest text-primary uppercase tabular-nums">
                02 / Simulasi Kredit Leasing
              </p>
              <div className="flex flex-wrap items-center gap-2.5">
                <h3
                  id={`${baseId}-section-b-heading`}
                  className="font-heading text-base font-bold tracking-tight text-foreground sm:text-lg"
                >
                  Daftar Paket Simulasi Kredit
                </h3>
                <Badge
                  variant={simulations.length > 0 ? "success" : "warning"}
                  className="tabular-nums"
                >
                  {simulations.length} Paket
                </Badge>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleAddSimulation}
              disabled={disabled}
              className="shrink-0"
            >
              <Plus className="size-4" aria-hidden="true" />
              Tambah Simulasi
            </Button>
          </div>

          <div className="space-y-4 p-5">
            {errors?.creditSimulations && (
              <p
                role="alert"
                className="border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-sm font-medium text-destructive"
              >
                {errors.creditSimulations}
              </p>
            )}

            {/* Friendly non-blocking reminder banner when empty */}
            {simulations.length === 0 ? (
              <div
                role="status"
                className="flex items-start gap-3 border border-amber-700/35 bg-amber-50 p-4 text-amber-950"
              >
                <Calculator
                  className="mt-0.5 size-5 shrink-0 text-amber-800"
                  aria-hidden="true"
                />
                <div className="space-y-0.5 text-sm leading-relaxed">
                  <p className="font-heading text-sm font-bold text-amber-950">
                    Belum ada paket simulasi kredit
                  </p>
                  <p>
                    Tambahkan minimal 1 simulasi DP, angsuran, dan tenor untuk
                    skema <strong>Cash &amp; Kredit</strong>.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {simulations.map((sim, index) => {
                  const rowKey = getRowKey(sim, index)
                  const rowPrefix = `creditSimulations.${index}`
                  const labelError = errors?.[`${rowPrefix}.label`]
                  const providerError = errors?.[`${rowPrefix}.provider`]
                  const dpError = errors?.[`${rowPrefix}.dp`]
                  const tenorError = errors?.[`${rowPrefix}.tenorYears`]
                  const installmentError = errors?.[`${rowPrefix}.installment`]
                  const installmentLabelError =
                    errors?.[`${rowPrefix}.installmentLabel`]
                  const noteError = errors?.[`${rowPrefix}.note`]

                  const { options: tenorOptions, labels: tenorLabels } =
                    buildTenorItems(sim.tenorYears)
                  const providerLabels = buildProviderItems(sim.provider)

                  const suggestedInstallmentLabel =
                    sim.installment !== null && sim.installment > 0
                      ? formatRupiah(sim.installment)
                      : null

                  const isInstallmentLabelCustomized =
                    suggestedInstallmentLabel !== null &&
                    sim.installmentLabel.trim() !== suggestedInstallmentLabel

                  const hasAnyRowError = Boolean(
                    labelError ||
                      providerError ||
                      dpError ||
                      tenorError ||
                      installmentError ||
                      installmentLabelError ||
                      noteError,
                  )

                  return (
                    <article
                      key={rowKey}
                      aria-label={`Paket simulasi kredit ${index + 1}`}
                      className={cn(
                        "border bg-card",
                        hasAnyRowError
                          ? "border-destructive"
                          : "border-border",
                      )}
                    >
                      {/* Row Header with Reorder + Remove Controls */}
                      <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/40 px-4 py-2.5">
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <Badge
                            variant="default"
                            className="shrink-0 tabular-nums"
                          >
                            Paket #{index + 1}
                          </Badge>
                          {sim.provider?.trim() ? (
                            <span className="truncate text-sm font-medium text-foreground">
                              {sim.provider.trim()}
                            </span>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          <Tooltip>
                            <TooltipTrigger
                              render={<span className="inline-flex" />}
                            >
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={disabled || index === 0}
                                onClick={() => handleMoveSimulation(index, -1)}
                                aria-label={`Pindahkan paket ${index + 1} ke atas`}
                              >
                                <ArrowUp className="size-4" aria-hidden="true" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Pindah ke atas</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger
                              render={<span className="inline-flex" />}
                            >
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={
                                  disabled || index === simulations.length - 1
                                }
                                onClick={() => handleMoveSimulation(index, 1)}
                                aria-label={`Pindahkan paket ${index + 1} ke bawah`}
                              >
                                <ArrowDown
                                  className="size-4"
                                  aria-hidden="true"
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Pindah ke bawah</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger
                              render={<span className="inline-flex" />}
                            >
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                disabled={disabled}
                                onClick={() => setDeleteSimulationIndex(index)}
                                aria-label={`Hapus paket simulasi ${index + 1}`}
                                className="text-destructive hover:border-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-4" aria-hidden="true" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Hapus simulasi</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>

                      {/* Row Fields */}
                      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
                        {/* Label */}
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`${baseId}-sim-${rowKey}-label`}
                            className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                          >
                            Nama Paket <span className="text-primary">*</span>
                          </label>
                          <Input
                            id={`${baseId}-sim-${rowKey}-label`}
                            type="text"
                            value={sim.label}
                            onChange={(event) =>
                              handleUpdateSimulation(index, {
                                label: event.target.value,
                              })
                            }
                            placeholder={`Simulasi Kredit ${index + 1}`}
                            disabled={disabled}
                            aria-invalid={Boolean(labelError) || undefined}
                          />
                          {labelError && (
                            <p
                              role="alert"
                              className="text-sm font-medium text-destructive"
                            >
                              {labelError}
                            </p>
                          )}
                        </div>

                        {/* Provider */}
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`${baseId}-sim-${rowKey}-provider`}
                            className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                          >
                            Leasing / Bank
                          </label>
                          <Select
                            items={providerLabels}
                            value={
                              sim.provider?.trim() || EMPTY_PROVIDER_VALUE
                            }
                            onValueChange={(val) => {
                              if (!val || val === EMPTY_PROVIDER_VALUE) {
                                handleUpdateSimulation(index, { provider: "" })
                                return
                              }
                              handleUpdateSimulation(index, { provider: val })
                            }}
                            disabled={disabled}
                          >
                            <SelectTrigger
                              id={`${baseId}-sim-${rowKey}-provider`}
                              aria-invalid={Boolean(providerError) || undefined}
                              className="min-h-11 w-full bg-card px-3 text-sm text-foreground data-[size=default]:h-11"
                            >
                              <SelectValue placeholder="Pilih leasing / bank" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(providerLabels).map(
                                ([key, label]) => (
                                  <SelectItem key={key} value={key}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          {providerError && (
                            <p
                              role="alert"
                              className="text-sm font-medium text-destructive"
                            >
                              {providerError}
                            </p>
                          )}
                        </div>

                        {/* DP */}
                        <div className="space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <label
                              htmlFor={`${baseId}-sim-${rowKey}-dp`}
                              className="whitespace-nowrap text-sm font-semibold tracking-wider text-foreground uppercase"
                            >
                              Uang Muka (DP){" "}
                              <span className="text-primary">*</span>
                            </label>
                            <span className="truncate text-sm font-semibold text-muted-foreground tabular-nums">
                              {sim.dp > 0 ? formatShortJuta(sim.dp) : "Rp0"}
                            </span>
                          </div>
                          <RupiahInput
                            id={`${baseId}-sim-${rowKey}-dp`}
                            value={sim.dp}
                            onValueChange={(next) =>
                              handleUpdateSimulation(index, { dp: next ?? 0 })
                            }
                            nullable={false}
                            allowZero={true}
                            placeholder="Contoh: 23000000"
                            disabled={disabled}
                            invalid={Boolean(dpError)}
                          />
                          {dpError && (
                            <p
                              role="alert"
                              className="text-sm font-medium text-destructive"
                            >
                              {dpError}
                            </p>
                          )}
                        </div>

                        {/* Tenor Years */}
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`${baseId}-sim-${rowKey}-tenor`}
                            className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                          >
                            Tenor Kredit{" "}
                            <span className="text-primary">*</span>
                          </label>
                          <Select
                            items={tenorLabels}
                            value={String(sim.tenorYears)}
                            onValueChange={(val) => {
                              if (!val) return
                              const parsed = Number.parseInt(val, 10)
                              if (Number.isInteger(parsed)) {
                                handleUpdateSimulation(index, {
                                  tenorYears: parsed,
                                })
                              }
                            }}
                            disabled={disabled}
                          >
                            <SelectTrigger
                              id={`${baseId}-sim-${rowKey}-tenor`}
                              aria-invalid={Boolean(tenorError) || undefined}
                              className="min-h-11 w-full bg-card px-3.5 text-sm text-foreground tabular-nums data-[size=default]:h-11"
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {tenorOptions.map((yr) => (
                                <SelectItem
                                  key={yr}
                                  value={String(yr)}
                                  className="tabular-nums"
                                >
                                  {yr} Tahun ({yr * 12} bulan)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {tenorError && (
                            <p
                              role="alert"
                              className="text-sm font-medium text-destructive"
                            >
                              {tenorError}
                            </p>
                          )}
                        </div>

                        {/* Installment (exact integer, optional) */}
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`${baseId}-sim-${rowKey}-installment`}
                            className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                          >
                            Angsuran / Bulan
                          </label>
                          <RupiahInput
                            id={`${baseId}-sim-${rowKey}-installment`}
                            value={sim.installment}
                            onValueChange={(next) =>
                              handleSimulationInstallmentChange(index, next)
                            }
                            nullable={true}
                            placeholder="4080000 (kosongkan jika kisaran)"
                            disabled={disabled}
                            invalid={Boolean(installmentError)}
                          />
                          {installmentError && (
                            <p
                              role="alert"
                              className="text-sm font-medium text-destructive"
                            >
                              {installmentError}
                            </p>
                          )}
                        </div>

                        {/* Installment Label */}
                        <div className="space-y-1.5">
                          <div className="flex items-baseline justify-between gap-2">
                            <label
                              htmlFor={`${baseId}-sim-${rowKey}-installment-label`}
                              className="whitespace-nowrap text-sm font-semibold tracking-wider text-foreground uppercase"
                            >
                              Label Angsuran{" "}
                              <span className="text-primary">*</span>
                            </label>
                            {isInstallmentLabelCustomized && (
                              <button
                                type="button"
                                disabled={disabled}
                                onClick={() =>
                                  handleUpdateSimulation(index, {
                                    installmentLabel: suggestedInstallmentLabel,
                                  })
                                }
                                className="text-sm font-semibold text-primary underline underline-offset-2 hover:text-primary/80 disabled:opacity-50"
                              >
                                Pakai {suggestedInstallmentLabel}
                              </button>
                            )}
                          </div>
                          <Input
                            id={`${baseId}-sim-${rowKey}-installment-label`}
                            type="text"
                            value={sim.installmentLabel}
                            onChange={(event) =>
                              handleUpdateSimulation(index, {
                                installmentLabel: event.target.value,
                              })
                            }
                            placeholder="Otomatis dari angka atau tulis, mis. Rp5 jutaan"
                            disabled={disabled}
                            aria-invalid={
                              Boolean(installmentLabelError) || undefined
                            }
                            className="tabular-nums"
                          />
                          {installmentLabelError && (
                            <p
                              role="alert"
                              className="text-sm font-medium text-destructive"
                            >
                              {installmentLabelError}
                            </p>
                          )}
                        </div>

                        {/* Note */}
                        <div className="space-y-1.5 md:col-span-2">
                          <label
                            htmlFor={`${baseId}-sim-${rowKey}-note`}
                            className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                          >
                            Catatan
                          </label>
                          <Input
                            id={`${baseId}-sim-${rowKey}-note`}
                            type="text"
                            value={sim.note ?? ""}
                            onChange={(event) =>
                              handleUpdateSimulation(index, {
                                note: event.target.value,
                              })
                            }
                            placeholder="Asuransi TLO, sudah termasuk admin & angsuran pertama"
                            disabled={disabled}
                            aria-invalid={Boolean(noteError) || undefined}
                          />
                          {noteError && (
                            <p
                              role="alert"
                              className="text-sm font-medium text-destructive"
                            >
                              {noteError}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  )
                })}

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddSimulation}
                    disabled={disabled}
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Tambah Paket Simulasi Lain
                  </Button>
                </div>
              </div>
            )}

          </div>
        </section>
      )}

      <Dialog
        open={deleteSimulationIndex !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteSimulationIndex(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Paket Simulasi Kredit?</DialogTitle>
            <DialogDescription>
              Paket simulasi{" "}
              {displayedDeleteSimulationIndex !== null
                ? `#${displayedDeleteSimulationIndex + 1}${
                    simulations[displayedDeleteSimulationIndex]?.label
                      ? ` (${simulations[displayedDeleteSimulationIndex]?.label})`
                      : ""
                  }`
                : ""}{" "}
              akan dihapus dari daftar.
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
                if (deleteSimulationIndex !== null) {
                  handleRemoveSimulation(deleteSimulationIndex)
                }
              }}
            >
              <Trash2 className="size-4" aria-hidden="true" />
              <span>Ya, Hapus Paket</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
