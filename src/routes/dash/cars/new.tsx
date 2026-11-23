import * as React from "react"
import { Link, createFileRoute, useRouter } from "@tanstack/react-router"
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  Car,
  CreditCard,
  FileCheck2,
  Loader2,
  Save,
  Send,
  Sparkles,
  X,
} from "lucide-react"
import { cn } from "cn"
import {
  COMPLETENESS_TAB_LABELS,
  CarCompletenessSidebar,
} from "@/components/dash/car-completeness-sidebar"
import { CarEvInsightsForm } from "@/components/dash/car-ev-insights-form"
import { CarIdentitySpecsForm } from "@/components/dash/car-identity-specs-form"
import { CarLegalityInspectionForm } from "@/components/dash/car-legality-inspection-form"
import { CarPricingCreditForm } from "@/components/dash/car-pricing-credit-form"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getCategoryLabel } from "@/lib/domain/formatters"
import { carUpsertSchema, type CarUpsertInput } from "@/lib/domain/schemas"
import type { CarStatus, CompletenessTabKey } from "@/lib/domain/types"
import { createCarFn } from "@/server/dash-cars"

export const Route = createFileRoute("/dash/cars/new")({
  head: () => ({
    meta: [
      {
        title: "Tambah Unit Baru | Garasi 571",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: NewCarPage,
})

const TAB_ORDER: ReadonlyArray<CompletenessTabKey> = [
  "identity",
  "pricing",
  "legality",
  "media",
  "insights",
]

const VALID_TABS = new Set<string>(TAB_ORDER)

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

function createDefaultCarInput(): CarUpsertInput {
  return {
    slug: "",
    status: "draft",
    isFeatured: false,
    featuredOrder: null,
    sortOrder: 0,
    brand: "",
    name: "",
    shortName: "",
    year: "",
    yearSort: new Date().getFullYear(),
    category: "harian",
    categoryLabel: getCategoryLabel("harian"),
    bodyType: null,
    seatCapacity: null,
    color: "",
    interiorColor: null,
    transmission: "",
    transmissionGroup: "automatic",
    fuelType: "bensin",
    engineCc: null,
    drivetrain: null,
    mileageKm: null,
    mileageLabel: "",
    mileageVerified: false,
    mileageVerificationSource: null,
    location: "Surakarta, Jawa Tengah",
    cashPrice: 0,
    creditPrice: null,
    creditPriceNote: "",
    paymentMode: "cash-credit",
    offerBadge: null,
    tradeInAvailable: false,
    plateInfo: "",
    plateAreaCode: null,
    plateOddEven: null,
    taxStatus: null,
    taxExpiryDate: null,
    stnk5yrExpiryDate: null,
    estimatedAnnualTax: null,
    ownershipType: null,
    ownershipHand: null,
    stnkBlockFree: true,
    vinEngineMatched: true,
    usageHistory: null,
    documentChecklist: {},
    inspectionSummary: {},
    imperfections: [],
    recentMaintenance: [],
    warrantyInfo: null,
    mechanicCheckAllowed: true,
    evSpecs: null,
    videoWalkaroundUrl: null,
    creatorInsights: null,
    highlights: [],
    conditions: [],
    creditSimulations: [],
  }
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message
  }
  return fallback
}

function NewCarPage() {
  const router = useRouter()

  const [form, setForm] = React.useState<CarUpsertInput>(() =>
    createDefaultCarInput()
  )
  const [activeTab, setActiveTab] =
    React.useState<CompletenessTabKey>("identity")
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>(
    {}
  )
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [submittingMode, setSubmittingMode] = React.useState<CarStatus | null>(
    null
  )

  const isSubmitting = submittingMode !== null

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

  const handlePatchForm = React.useCallback(
    (patch: Partial<CarUpsertInput>) => {
      setForm((prev) => ({ ...prev, ...patch }))
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

  const handleSelectTab = React.useCallback((nextTab: CompletenessTabKey) => {
    setActiveTab(nextTab)
  }, [])

  const handleSubmit = async (targetStatus: "draft" | "ready") => {
    if (isSubmitting) return

    setSubmitError(null)

    const payload: CarUpsertInput = {
      ...form,
      status: targetStatus,
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
      setSubmitError(
        `Terdapat ${Object.keys(nextErrors).length} kolom wajib yang perlu dilengkapi atau diperbaiki sebelum menyimpan.`
      )
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
      return
    }

    setFieldErrors({})
    setSubmittingMode(targetStatus)

    try {
      const created = await createCarFn({ data: parsed.data })
      await router.invalidate()
      await router.navigate({
        to: "/dash/cars/$carId",
        params: { carId: created.id },
        search: { tab: "media", created: "1" },
        replace: true,
      })
    } catch (err) {
      const message = extractErrorMessage(
        err,
        "Gagal menyimpan unit mobil baru. Periksa data lalu coba lagi."
      )
      setSubmitError(message)
      if (message.toLowerCase().includes("slug")) {
        setFieldErrors({ slug: message })
        setActiveTab("identity")
      }
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    } finally {
      setSubmittingMode(null)
    }
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/dash/cars"
              className="inline-flex min-h-9 items-center gap-1.5 text-xs font-semibold text-muted-foreground no-underline transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>Kembali ke Inventaris</span>
            </Link>
            <span className="text-border" aria-hidden="true">
              /
            </span>
            <span className="font-heading text-xs font-bold tracking-[0.16em] text-primary uppercase">
              Unit Baru
            </span>
          </div>

          <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {form.name.trim() || "Tambah Unit Mobil Baru"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Lengkapi profil unit, harga, legalitas, dan catatan ahli. Setelah
            disimpan, Anda akan diarahkan langsung ke{" "}
            <strong className="font-semibold text-foreground">
              Galeri Foto R2
            </strong>{" "}
            untuk mengunggah foto sudut wajib.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={() => void handleSubmit("draft")}
          >
            {submittingMode === "draft" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Save className="size-4" aria-hidden="true" />
            )}
            <span>
              {submittingMode === "draft" ? "Menyimpan..." : "Simpan Draft"}
            </span>
          </Button>
          <Button
            type="button"
            variant="default"
            disabled={isSubmitting}
            onClick={() => void handleSubmit("ready")}
          >
            {submittingMode === "ready" ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-4" aria-hidden="true" />
            )}
            <span>
              {submittingMode === "ready"
                ? "Menerbitkan..."
                : "Simpan & Terbitkan"}
            </span>
          </Button>
        </div>
      </section>

      {/* Validation / Server Error Banner */}
      {submitError ? (
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
                <p className="font-semibold">{submitError}</p>
                {totalErrorCount > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {TAB_ORDER.filter((tab) => errorCountsByTab[tab] > 0).map(
                      (tab) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => handleSelectTab(tab)}
                          className="inline-flex min-h-8 cursor-pointer items-center gap-1.5 border border-destructive/40 bg-card px-2.5 py-1 text-xs font-semibold text-[#991B1B] transition-colors hover:bg-destructive hover:text-primary-foreground"
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

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSubmitError(null)}
              aria-label="Tutup pesan error"
              className="shrink-0 text-[#991B1B]"
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* Main Layout: Editor Tabs + Live Completeness Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <Tabs
            value={activeTab}
            onValueChange={(nextValue) => {
              if (typeof nextValue === "string" && VALID_TABS.has(nextValue)) {
                setActiveTab(nextValue as CompletenessTabKey)
              }
            }}
          >
            <TabsList
              variant="line"
              aria-label="Tab formulir unit mobil baru"
              className="border-b border-border bg-card px-2"
            >
              <TabsTrigger value="identity">
                <Car className="size-4" aria-hidden="true" />
                <span>Identitas &amp; Spek</span>
                {errorCountsByTab.identity > 0 ? (
                  <Badge variant="destructive" className="px-1.5 py-0 text-[10px] tabular-nums">
                    {errorCountsByTab.identity}
                  </Badge>
                ) : null}
              </TabsTrigger>

              <TabsTrigger value="pricing">
                <CreditCard className="size-4" aria-hidden="true" />
                <span>Harga &amp; Kredit</span>
                {errorCountsByTab.pricing > 0 ? (
                  <Badge variant="destructive" className="px-1.5 py-0 text-[10px] tabular-nums">
                    {errorCountsByTab.pricing}
                  </Badge>
                ) : null}
              </TabsTrigger>

              <TabsTrigger value="legality">
                <FileCheck2 className="size-4" aria-hidden="true" />
                <span>Legalitas &amp; Inspeksi</span>
                {errorCountsByTab.legality > 0 ? (
                  <Badge variant="destructive" className="px-1.5 py-0 text-[10px] tabular-nums">
                    {errorCountsByTab.legality}
                  </Badge>
                ) : null}
              </TabsTrigger>

              <TabsTrigger value="media">
                <Camera className="size-4" aria-hidden="true" />
                <span>Galeri Foto R2</span>
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                  Pasca Simpan
                </Badge>
              </TabsTrigger>

              <TabsTrigger value="insights">
                <Sparkles className="size-4" aria-hidden="true" />
                <span>EV, Video &amp; Insight</span>
                {errorCountsByTab.insights > 0 ? (
                  <Badge variant="destructive" className="px-1.5 py-0 text-[10px] tabular-nums">
                    {errorCountsByTab.insights}
                  </Badge>
                ) : null}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="identity" className="pt-2">
              <CarIdentitySpecsForm
                value={form}
                onChange={handlePatchForm}
                errors={fieldErrors}
                isNew={true}
                disabled={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="pricing" className="pt-2">
              <CarPricingCreditForm
                value={form}
                onChange={handlePatchForm}
                errors={fieldErrors}
                disabled={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="legality" className="pt-2">
              <CarLegalityInspectionForm
                value={form}
                onChange={handlePatchForm}
                errors={fieldErrors}
                disabled={isSubmitting}
              />
            </TabsContent>

            <TabsContent value="media" className="pt-2">
              <section className="border border-border bg-card p-6 sm:p-8">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="flex size-12 shrink-0 items-center justify-center border border-border bg-secondary text-primary">
                    <Camera className="size-6" aria-hidden="true" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-heading text-[11px] font-bold tracking-[0.16em] text-primary uppercase">
                      Galeri Foto Cloudflare R2
                    </p>
                    <h2 className="font-heading text-lg font-bold tracking-tight text-foreground">
                      Unggah Foto Terbuka Otomatis Setelah Unit Disimpan
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Foto unit disimpan per ID mobil di Cloudflare R2 (konversi
                      otomatis WebP, penandaan 6 sudut wajib, dan pemilihan foto
                      cover). Klik{" "}
                      <strong className="font-semibold text-foreground">
                        Simpan Draft
                      </strong>{" "}
                      atau{" "}
                      <strong className="font-semibold text-foreground">
                        Simpan &amp; Terbitkan
                      </strong>{" "}
                      untuk langsung membuka tab Galeri Foto R2.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                  <Button
                    type="button"
                    variant="default"
                    disabled={isSubmitting}
                    onClick={() => void handleSubmit("draft")}
                  >
                    {submittingMode === "draft" ? (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Save className="size-4" aria-hidden="true" />
                    )}
                    <span>Simpan Draft &amp; Lanjut Unggah Foto</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSubmitting}
                    onClick={() => handleSelectTab("identity")}
                  >
                    Lengkapi Identitas Dulu
                  </Button>
                </div>
              </section>
            </TabsContent>

            <TabsContent value="insights" className="pt-2">
              <CarEvInsightsForm
                value={form}
                onChange={handlePatchForm}
                errors={fieldErrors}
                disabled={isSubmitting}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="min-w-0 lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <CarCompletenessSidebar
              car={form}
              images={[]}
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              isNew={true}
            />
          </div>
        </div>
      </div>

      {/* Sticky Editorial Bottom Action Bar */}
      <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-xs sm:-mx-6 sm:px-6 lg:mx-0 lg:border lg:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link
              to="/dash/cars"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "px-2.5 no-underline"
              )}
            >
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              <span>Batal</span>
            </Link>
            <span className="hidden text-border sm:inline" aria-hidden="true">
              |
            </span>
            <span>
              Setelah tersimpan, halaman otomatis membuka{" "}
              <strong className="font-semibold text-foreground">
                Galeri Foto R2
              </strong>
              .
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => void handleSubmit("draft")}
            >
              {submittingMode === "draft" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="size-4" aria-hidden="true" />
              )}
              <span>
                {submittingMode === "draft" ? "Menyimpan..." : "Simpan Draft"}
              </span>
            </Button>

            <Button
              type="button"
              variant="default"
              disabled={isSubmitting}
              onClick={() => void handleSubmit("ready")}
            >
              {submittingMode === "ready" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-4" aria-hidden="true" />
              )}
              <span>
                {submittingMode === "ready"
                  ? "Menerbitkan..."
                  : "Simpan & Terbitkan"}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
