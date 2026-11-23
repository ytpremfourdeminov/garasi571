import * as React from "react"
import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Car,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  FileCheck2,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from "lucide-react"
import { cn } from "cn"
import {
  COMPLETENESS_TAB_LABELS,
  CarCompletenessSidebar,
  scrollToCarField,
} from "@/components/dash/car-completeness-sidebar"
import { CarEvInsightsForm } from "@/components/dash/car-ev-insights-form"
import { CarIdentitySpecsForm } from "@/components/dash/car-identity-specs-form"
import { CarLegalityInspectionForm } from "@/components/dash/car-legality-inspection-form"
import { CarMediaManager } from "@/components/dash/car-media-manager"
import { CarPricingCreditForm } from "@/components/dash/car-pricing-credit-form"
import { CarStatusBadge } from "@/components/dash/car-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { carUpsertSchema, type CarUpsertInput } from "@/lib/domain/schemas"
import type {
  CarImage,
  CarUnit,
  CompletenessTabKey,
} from "@/lib/domain/types"
import { getPublicSiteOrigin } from "@/lib/host"
import { getDashCarByIdFn, updateCarFn } from "@/server/dash-cars"

interface EditCarSearchParams {
  tab?: CompletenessTabKey
  created?: string
}

const TAB_ORDER: ReadonlyArray<CompletenessTabKey> = [
  "identity",
  "pricing",
  "legality",
  "media",
  "insights",
]

const VALID_TABS = new Set<string>(TAB_ORDER)

function parseEditCarSearch(
  raw: Record<string, unknown>
): EditCarSearchParams {
  const result: EditCarSearchParams = {}
  if (typeof raw.tab === "string" && VALID_TABS.has(raw.tab)) {
    result.tab = raw.tab as CompletenessTabKey
  }
  if (raw.created === "1") {
    result.created = "1"
  }
  return result
}

export const Route = createFileRoute("/dash/cars/$carId")({
  validateSearch: parseEditCarSearch,
  loader: async ({ params }) => {
    return getDashCarByIdFn({ data: { id: params.carId } })
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Edit ${loaderData.shortName || loaderData.name} | Garasi 571`
          : "Edit Unit | Garasi 571",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: EditCarPage,
  pendingComponent: EditCarPending,
})

function EditCarPending() {
  return (
    <div aria-busy="true" aria-label="Memuat detail unit" className="space-y-6 pb-8">
      <section className="mb-0! flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-40" />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-8">
          <Skeleton className="h-11 w-full border border-border" />
          <div className="space-y-4 border border-border bg-card p-5 sm:p-6">
            <Skeleton className="h-6 w-48" />
            <div className="grid gap-4 md:grid-cols-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="space-y-4 border border-border bg-card p-5">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-3 w-full" />
            <div className="space-y-2 pt-2">
              {[0, 1, 2, 3, 4, 5].map((idx) => (
                <Skeleton key={idx} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const PRICING_FIELDS = new Set([
  "cashPrice",
  "creditPrice",
  "creditPriceNote",
  "paymentMode",
  "tradeInAvailable",
  "creditSimulations",
])

const LEGALITY_FIELDS = new Set([
  "plateInfo",
  "plateAreaCode",
  "plateOddEven",
  "taxStatus",
  "taxExpiryDate",
  "stnk5yrExpiryDate",
  "estimatedAnnualTax",
  "ownershipType",
  "ownershipHand",
  "stnkBlockFree",
  "vinEngineMatched",
  "usageHistory",
  "documentChecklist",
  "inspectionSummary",
  "imperfections",
  "recentMaintenance",
  "warrantyInfo",
  "mechanicCheckAllowed",
])

const INSIGHTS_FIELDS = new Set([
  "evSpecs",
  "videoWalkaroundUrl",
  "creatorInsights",
])

function resolveTabForFieldPath(pathKey: string): CompletenessTabKey {
  const root = pathKey.split(".")[0] ?? ""
  if (PRICING_FIELDS.has(root)) return "pricing"
  if (LEGALITY_FIELDS.has(root)) return "legality"
  if (root === "images") return "media"
  if (INSIGHTS_FIELDS.has(root)) return "insights"
  return "identity"
}

function mapCarUnitToUpsertInput(car: CarUnit): CarUpsertInput {
  return {
    id: car.id,
    slug: car.slug,
    status: car.status,
    isFeatured: car.isFeatured,
    featuredOrder: car.featuredOrder,
    sortOrder: car.sortOrder,
    brand: car.brand,
    name: car.name,
    shortName: car.shortName,
    year: car.year,
    yearSort: car.yearSort,
    category: car.category,
    categoryLabel: car.categoryLabel,
    bodyType: car.bodyType,
    seatCapacity: car.seatCapacity,
    color: car.color,
    interiorColor: car.interiorColor,
    transmission: car.transmission,
    transmissionGroup: car.transmissionGroup,
    fuelType: car.fuelType,
    engineCc: car.engineCc,
    drivetrain: car.drivetrain,
    mileageKm: car.mileageKm,
    mileageLabel: car.mileageLabel,
    mileageVerified: car.mileageVerified,
    mileageVerificationSource: car.mileageVerificationSource,
    location: car.location,
    cashPrice: car.cashPrice,
    creditPrice: car.creditPrice,
    creditPriceNote: car.creditPriceNote ?? "",
    paymentMode: car.paymentMode,
    offerBadge: car.offerBadge,
    tradeInAvailable: car.tradeInAvailable,
    plateInfo: car.plateInfo,
    plateAreaCode: car.plateAreaCode,
    plateOddEven: car.plateOddEven,
    taxStatus: car.taxStatus,
    taxExpiryDate: car.taxExpiryDate,
    stnk5yrExpiryDate: car.stnk5yrExpiryDate,
    estimatedAnnualTax: car.estimatedAnnualTax,
    ownershipType: car.ownershipType,
    ownershipHand: car.ownershipHand,
    stnkBlockFree: car.stnkBlockFree,
    vinEngineMatched: car.vinEngineMatched,
    usageHistory: car.usageHistory,
    documentChecklist: { ...car.documentChecklist },
    inspectionSummary: { ...car.inspectionSummary },
    imperfections: car.imperfections.map((item) => ({ ...item })),
    recentMaintenance: [...car.recentMaintenance],
    warrantyInfo: car.warrantyInfo,
    mechanicCheckAllowed: car.mechanicCheckAllowed,
    evSpecs: car.evSpecs ? { ...car.evSpecs } : null,
    videoWalkaroundUrl: car.videoWalkaroundUrl,
    creatorInsights: car.creatorInsights ? { ...car.creatorInsights } : null,
    highlights: [...car.highlights],
    conditions: [...car.conditions],
    creditSimulations: car.creditSimulations.map((sim, idx) => ({
      id: sim.id,
      label: sim.label,
      provider: sim.provider ?? "",
      dp: sim.dp,
      installment: sim.installment,
      installmentLabel: sim.installmentLabel,
      tenorYears: sim.tenorYears,
      note: sim.note ?? "",
      sortOrder: sim.sortOrder ?? idx,
    })),
  }
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message
  }
  return fallback
}

function formatUpdatedAt(iso?: string): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function EditCarPage() {
  const loadedCar = Route.useLoaderData()
  const search = Route.useSearch()
  const router = useRouter()

  const [car, setCar] = React.useState<CarUnit>(loadedCar)
  const [form, setForm] = React.useState<CarUpsertInput>(() =>
    mapCarUnitToUpsertInput(loadedCar)
  )
  const [savedForm, setSavedForm] = React.useState<CarUpsertInput>(() =>
    mapCarUnitToUpsertInput(loadedCar)
  )
  const [images, setImages] = React.useState<CarImage[]>(loadedCar.images)
  const [activeTab, setActiveTab] = React.useState<CompletenessTabKey>(
    search.tab ?? "identity"
  )
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [saveError, setSaveError] = React.useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(
    search.created === "1"
      ? "Unit berhasil dibuat. Silakan unggah foto pada tab Galeri Foto."
      : null
  )
  const [isSaving, setIsSaving] = React.useState(false)
  const [publicSiteOrigin, setPublicSiteOrigin] = React.useState(() =>
    getPublicSiteOrigin()
  )

  const prevCarIdRef = React.useRef(loadedCar.id)

  React.useEffect(() => {
    if (prevCarIdRef.current !== loadedCar.id) {
      prevCarIdRef.current = loadedCar.id
      const mapped = mapCarUnitToUpsertInput(loadedCar)
      setCar(loadedCar)
      setForm(mapped)
      setSavedForm(mapped)
      setImages(loadedCar.images)
      setFieldErrors({})
      setSaveError(null)
      setSaveSuccess(null)
      setActiveTab(search.tab ?? "identity")
    }
  }, [loadedCar, search.tab])

  React.useEffect(() => {
    if (search.tab) {
      setActiveTab(search.tab)
    }
  }, [search.tab])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setPublicSiteOrigin(getPublicSiteOrigin(window.location.href))
    }
  }, [])

  const isDirty = React.useMemo(
    () => JSON.stringify(form) !== JSON.stringify(savedForm),
    [form, savedForm]
  )

  const errorCountsByTab = React.useMemo(() => {
    const counts: Record<CompletenessTabKey, number> = {
      identity: 0,
      pricing: 0,
      legality: 0,
      media: 0,
      insights: 0,
    }
    for (const key of Object.keys(fieldErrors)) {
      const tab = resolveTabForFieldPath(key)
      counts[tab] += 1
    }
    return counts
  }, [fieldErrors])

  const totalErrorCount = Object.keys(fieldErrors).length
  const previewUrl = `${publicSiteOrigin}/mobil/${car.slug}`
  const updatedAtLabel = formatUpdatedAt(car.updatedAt)

  const handlePatchForm = React.useCallback(
    (patch: Partial<CarUpsertInput>) => {
      setForm((prev) => ({ ...prev, ...patch }))
      setSaveSuccess(null)
      const changedKeys = Object.keys(patch)
      if (changedKeys.length > 0) {
        setFieldErrors((prev) => {
          let mutated = false
          const next = { ...prev }
          for (const errKey of Object.keys(next)) {
            const root = errKey.split(".")[0] ?? ""
            if (changedKeys.includes(errKey) || changedKeys.includes(root)) {
              delete next[errKey]
              mutated = true
            }
          }
          return mutated ? next : prev
        })
      }
    },
    []
  )

  const handleSelectTab = React.useCallback(
    (nextTab: CompletenessTabKey, targetId?: string) => {
      setActiveTab(nextTab)
      scrollToCarField(targetId)
    },
    []
  )

  const handleResetChanges = () => {
    if (isSaving) return
    setForm(savedForm)
    setFieldErrors({})
    setSaveError(null)
    setSaveSuccess(null)
  }

  const handleSave = async () => {
    if (isSaving) return

    setSaveError(null)
    setSaveSuccess(null)

    const payload: CarUpsertInput = {
      ...form,
      id: car.id,
      highlights: form.highlights
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
      conditions: form.conditions
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
      recentMaintenance: form.recentMaintenance
        .map((item) => item.trim())
        .filter((item) => item.length > 0),
    }

    const parsed = carUpsertSchema.safeParse(payload)
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const pathKey =
          issue.path.length > 0
            ? issue.path.map((segment) => String(segment)).join(".")
            : "form"
        if (!nextErrors[pathKey]) {
          nextErrors[pathKey] = issue.message
        }
      }
      setFieldErrors(nextErrors)

      const firstTabWithError =
        TAB_ORDER.find((tab) =>
          Object.keys(nextErrors).some(
            (key) => resolveTabForFieldPath(key) === tab
          )
        ) ?? "identity"

      setActiveTab(firstTabWithError)
      setSaveError(
        `Terdapat ${Object.keys(nextErrors).length} kolom yang perlu diperbaiki sebelum menyimpan perubahan.`
      )
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
      return
    }

    setFieldErrors({})
    setIsSaving(true)

    try {
      const updated = await updateCarFn({ data: parsed.data })
      const nextMapped = mapCarUnitToUpsertInput(updated)
      setCar(updated)
      setForm(nextMapped)
      setSavedForm(nextMapped)
      setImages(updated.images)
      setSaveSuccess("Perubahan data unit berhasil disimpan.")
      void router.invalidate()
    } catch (err) {
      const message = extractErrorMessage(
        err,
        "Gagal menyimpan perubahan unit mobil. Silakan coba lagi."
      )
      setSaveError(message)
      if (message.toLowerCase().includes("slug")) {
        setFieldErrors({ slug: message })
        setActiveTab("identity")
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <section className="mb-0! flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dash/cars"
              className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-muted-foreground no-underline transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>Kembali ke Inventaris</span>
            </Link>
            <span className="text-border" aria-hidden="true">
              /
            </span>
            <span className="font-heading text-sm font-bold tracking-[0.16em] text-primary uppercase">
              Edit Unit
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {form.name.trim() || car.name}
            </h1>
            <CarStatusBadge status={form.status} />
            {isDirty ? (
              <Badge variant="warning">Belum Disimpan</Badge>
            ) : null}
          </div>

          <p className="mt-1.5 text-sm text-muted-foreground sm:text-sm">
            <span className="font-mono text-sm text-foreground">
              /mobil/{car.slug}
            </span>
            {updatedAtLabel ? (
              <>
                {" "}
                &middot; Diperbarui terakhir{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {updatedAtLabel}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "no-underline"
            )}
          >
            <ExternalLink className="size-4" aria-hidden="true" />
            <span>Pratinjau Publik</span>
          </a>

          <Button
            type="button"
            variant="default"
            disabled={isSaving || !isDirty}
            onClick={() => void handleSave()}
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
          </Button>
        </div>
      </section>

      {/* Success Banner */}
      {saveSuccess ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start justify-between gap-3 border border-emerald-800/30 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
        >
          <div className="flex min-w-0 items-start gap-2.5 pt-1">
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-emerald-700"
              aria-hidden="true"
            />
            <p className="font-medium">{saveSuccess}</p>
          </div>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSaveSuccess(null)}
                  aria-label="Tutup notifikasi sukses"
                  className="shrink-0 text-emerald-900"
                />
              }
            >
              <X className="size-4" aria-hidden="true" />
            </TooltipTrigger>
            <TooltipContent>Tutup notifikasi</TooltipContent>
          </Tooltip>
        </div>
      ) : null}

      {/* Error Banner */}
      {saveError ? (
        <div
          role="alert"
          className="border border-destructive/40 bg-destructive/10 p-4 text-sm text-[#991B1B]"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              <div className="space-y-2">
                <p className="font-semibold">{saveError}</p>
                {totalErrorCount > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {TAB_ORDER.filter((tab) => errorCountsByTab[tab] > 0).map(
                      (tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => handleSelectTab(tab)}
                          className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 border border-destructive/40 bg-card px-2.5 py-1 text-sm font-semibold text-[#991B1B] transition-colors hover:bg-destructive hover:text-primary-foreground"
                        >
                          <span>{COMPLETENESS_TAB_LABELS[tab]}</span>
                          <span className="tabular-nums">
                            ({errorCountsByTab[tab]})
                          </span>
                        </button>
                      )
                    )}
                  </div>
                ) : null}
              </div>
            </div>

            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setSaveError(null)}
                    aria-label="Tutup pesan error"
                    className="shrink-0 text-[#991B1B]"
                  />
                }
              >
                <X className="size-4" aria-hidden="true" />
              </TooltipTrigger>
              <TooltipContent>Tutup pesan error</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ) : null}

      {/* Main Layout: Full-Width Tabs + Form & Completeness Sidebar */}
      <Tabs
        value={activeTab}
        onValueChange={(nextValue) => {
          if (typeof nextValue === "string" && VALID_TABS.has(nextValue)) {
            setActiveTab(nextValue as CompletenessTabKey)
          }
        }}
        className="mt-0!"
      >
        <TabsList
          variant="line"
          aria-label="Tab editor unit mobil"
          className="w-full justify-start bg-card"
        >
              <TabsTrigger value="identity">
                <Car className="size-4" aria-hidden="true" />
                <span>Identitas &amp; Spek</span>
                {errorCountsByTab.identity > 0 ? (
                  <Badge variant="destructive" className="px-1.5 py-0 text-sm tabular-nums">
                    {errorCountsByTab.identity}
                  </Badge>
                ) : null}
              </TabsTrigger>

              <TabsTrigger value="pricing">
                <CreditCard className="size-4" aria-hidden="true" />
                <span>Harga &amp; Kredit</span>
                {errorCountsByTab.pricing > 0 ? (
                  <Badge variant="destructive" className="px-1.5 py-0 text-sm tabular-nums">
                    {errorCountsByTab.pricing}
                  </Badge>
                ) : null}
              </TabsTrigger>

              <TabsTrigger value="legality">
                <FileCheck2 className="size-4" aria-hidden="true" />
                <span>Legalitas &amp; Inspeksi</span>
                {errorCountsByTab.legality > 0 ? (
                  <Badge variant="destructive" className="px-1.5 py-0 text-sm tabular-nums">
                    {errorCountsByTab.legality}
                  </Badge>
                ) : null}
              </TabsTrigger>

              <TabsTrigger value="media">
                <Camera className="size-4" aria-hidden="true" />
                <span>Galeri Foto</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-sm tabular-nums">
                  {images.length}
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="insights">
                <Sparkles className="size-4" aria-hidden="true" />
                <span>EV, Video &amp; Insight</span>
                {errorCountsByTab.insights > 0 ? (
                  <Badge variant="destructive" className="px-1.5 py-0 text-sm tabular-nums">
                    {errorCountsByTab.insights}
                  </Badge>
                ) : null}
              </TabsTrigger>
        </TabsList>

        <div className="mt-2 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            <TabsContent value="identity">
              <CarIdentitySpecsForm
                value={form}
                onChange={handlePatchForm}
                errors={fieldErrors}
                isNew={false}
                disabled={isSaving}
              />
            </TabsContent>

            <TabsContent value="pricing">
              <CarPricingCreditForm
                value={form}
                onChange={handlePatchForm}
                errors={fieldErrors}
                disabled={isSaving}
              />
            </TabsContent>

            <TabsContent value="legality">
              <CarLegalityInspectionForm
                value={form}
                onChange={handlePatchForm}
                errors={fieldErrors}
                disabled={isSaving}
              />
            </TabsContent>

            <TabsContent value="media">
              <CarMediaManager
                carId={car.id}
                carName={form.name.trim() || car.name}
                images={images}
                onImagesChange={setImages}
                disabled={isSaving}
              />
            </TabsContent>

            <TabsContent value="insights">
              <CarEvInsightsForm
                value={form}
                onChange={handlePatchForm}
                errors={fieldErrors}
                disabled={isSaving}
              />
            </TabsContent>
          </div>

          <div className="min-w-0 lg:col-span-4">
            <div className="lg:sticky lg:top-20">
              <CarCompletenessSidebar
                car={form}
                images={images}
                activeTab={activeTab}
                onSelectTab={handleSelectTab}
                isNew={false}
              />
            </div>
          </div>
        </div>
      </Tabs>

      {/* Sticky Editorial Save Bar */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-xs sm:-mx-6 sm:px-6 lg:mx-0 lg:border lg:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5 text-sm">
            <Link
              to="/dash/cars"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "px-2.5 no-underline"
              )}
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>Inventaris</span>
            </Link>

            <span className="hidden text-border sm:inline" aria-hidden="true">
              |
            </span>

            {isDirty ? (
              <span className="inline-flex items-center gap-2 font-semibold text-amber-900">
                <span
                  aria-hidden="true"
                  className="inline-block size-2 bg-amber-600"
                />
                <span>Perubahan belum disimpan</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 font-medium text-emerald-900">
                <CheckCircle2
                  className="size-3.5 text-emerald-700"
                  aria-hidden="true"
                />
                <span>Tersimpan</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {isDirty ? (
              <Button
                type="button"
                variant="outline"
                size="default"
                disabled={isSaving}
                onClick={handleResetChanges}
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                <span>Urungkan</span>
              </Button>
            ) : null}

            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "no-underline"
              )}
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              <span>Pratinjau</span>
            </a>

            <Button
              type="button"
              variant="default"
              disabled={isSaving || !isDirty}
              onClick={() => void handleSave()}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              <span>{isSaving ? "Menyimpan..." : "Simpan Perubahan"}</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
