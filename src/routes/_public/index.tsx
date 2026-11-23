import * as React from "react"
import { createFileRoute } from "@tanstack/react-router"
import type {
  BudgetBand,
  CarCategory,
  CatalogFilterState,
  PaymentMode,
  SortOption,
  TransmissionGroup,
} from "@/lib/domain/types"
import {
  buildAutoDealerJsonLd,
  buildCanonicalLink,
  buildFaqPageJsonLd,
  buildItemListJsonLd,
  buildSocialMeta,
  serializeJsonLd,
} from "@/lib/seo"
import { getPublicCarsFn, getPublicFaqsFn } from "@/server/public-catalog"
import { HeroSection } from "@/components/hero-section"
import { CatalogSection } from "@/components/catalog-section"
import { CreditSection } from "@/components/credit-section"
import { FaqSection } from "@/components/faq-section"
import { ShowroomSection } from "@/components/showroom-section"
import { Skeleton } from "@/components/ui/skeleton"

const HOME_TITLE = "Garasi 571 Surakarta | Katalog Mobil Bekas Pilihan"
const HOME_DESCRIPTION =
  "Pilihan mobil bekas siap pakai di Garasi 571 Surakarta. Tersedia cash, kredit, dan tukar tambah, buka setiap hari 08:00 - 16:00 WIB."

const VALID_CATEGORIES = new Set<CarCategory>([
  "keluarga",
  "harian",
  "hobi-eropa",
])
const VALID_BUDGETS = new Set<Exclude<BudgetBand, "all">>([
  "under-120",
  "120-200",
  "over-200",
])
const VALID_TRANSMISSIONS = new Set<TransmissionGroup>(["manual", "automatic"])
const VALID_PAYMENT_MODES = new Set<PaymentMode>(["cash-credit", "cash-only"])
const VALID_SORTS = new Set<SortOption>([
  "harga-terendah",
  "harga-tertinggi",
  "tahun-terbaru",
])

function normalizeCatalogSearch(
  raw: Record<string, unknown>,
): CatalogFilterState {
  const result: CatalogFilterState = {}

  if (typeof raw.q === "string") {
    const trimmed = raw.q.trim()
    if (trimmed.length > 0) {
      result.q = trimmed
    }
  }

  if (
    typeof raw.kategori === "string" &&
    VALID_CATEGORIES.has(raw.kategori as CarCategory)
  ) {
    result.kategori = raw.kategori as CarCategory
  }

  if (
    typeof raw.budget === "string" &&
    VALID_BUDGETS.has(raw.budget as Exclude<BudgetBand, "all">)
  ) {
    result.budget = raw.budget as BudgetBand
  }

  if (
    typeof raw.transmisi === "string" &&
    VALID_TRANSMISSIONS.has(raw.transmisi as TransmissionGroup)
  ) {
    result.transmisi = raw.transmisi as TransmissionGroup
  }

  if (
    typeof raw.bayar === "string" &&
    VALID_PAYMENT_MODES.has(raw.bayar as PaymentMode)
  ) {
    result.bayar = raw.bayar as PaymentMode
  }

  if (
    typeof raw.urut === "string" &&
    VALID_SORTS.has(raw.urut as SortOption)
  ) {
    result.urut = raw.urut as SortOption
  }

  return result
}

export const Route = createFileRoute("/_public/")({
  validateSearch: (search: Record<string, unknown>): CatalogFilterState =>
    normalizeCatalogSearch(search),
  loader: async () => {
    const [cars, faqs] = await Promise.all([
      getPublicCarsFn({ data: { includeSold: false } }).catch(() => []),
      getPublicFaqsFn().catch(() => []),
    ])
    return { cars, faqs }
  },
  head: ({ loaderData }) => {
    const cars = loaderData?.cars ?? []
    const faqs = loaderData?.faqs ?? []
    const featuredCars = cars
      .filter((car) => car.isFeatured)
      .sort(
        (a, b) =>
          (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.featuredOrder ?? Number.MAX_SAFE_INTEGER),
      )
    const featuredCar = featuredCars.at(0) ?? cars.at(0)
    const featuredImage = featuredCar?.images.at(0)

    return {
      links: [buildCanonicalLink("/")],
      meta: [
        {
          title: HOME_TITLE,
        },
        {
          name: "description",
          content: HOME_DESCRIPTION,
        },
        ...buildSocialMeta({
          title: HOME_TITLE,
          description: HOME_DESCRIPTION,
          path: "/",
          imagePath: featuredImage?.src,
          imageWidth: featuredImage?.width,
          imageHeight: featuredImage?.height,
          imageAlt: featuredImage?.alt,
          type: "website",
        }),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: serializeJsonLd(buildAutoDealerJsonLd()),
        },
        {
          type: "application/ld+json",
          children: serializeJsonLd(buildItemListJsonLd(cars)),
        },
        {
          type: "application/ld+json",
          children: serializeJsonLd(buildFaqPageJsonLd(faqs)),
        },
      ],
    }
  },
  component: HomePage,
  pendingComponent: HomePending,
})

function HomePending() {
  return (
    <div aria-busy="true" aria-label="Memuat halaman utama">
      <section className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-10">
            <div className="space-y-5 lg:col-span-6">
              <Skeleton className="h-6 w-44" />
              <div className="space-y-2.5">
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-10 w-4/5 max-w-sm" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-full max-w-lg" />
                <Skeleton className="h-5 w-3/4 max-w-md" />
              </div>
              <div className="border border-border bg-background p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                  <Skeleton className="h-11 w-full" />
                </div>
                <Skeleton className="mt-3 h-11 w-full" />
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-5 w-36" />
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="border border-border bg-[#161514]">
                <div className="grid grid-cols-3 border-b border-[#2F2D2B]">
                  <Skeleton className="h-14 rounded-none bg-[#1F1E1C]" />
                  <Skeleton className="h-14 rounded-none border-l border-[#2F2D2B] bg-[#1F1E1C]" />
                  <Skeleton className="h-14 rounded-none border-l border-[#2F2D2B] bg-[#1F1E1C]" />
                </div>
                <Skeleton className="aspect-[4/3] w-full bg-[#242220]" />
                <div className="space-y-2.5 border-t border-[#2F2D2B] p-4 sm:p-5">
                  <Skeleton className="h-5 w-3/5 bg-[#242220]" />
                  <Skeleton className="h-7 w-2/5 bg-[#242220]" />
                  <Skeleton className="h-4 w-4/5 bg-[#242220]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="space-y-3 border-b border-border pb-6">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-64" />
        </div>

        <div className="mt-6 border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="border border-border bg-card">
              <Skeleton className="aspect-[16/10] w-full" />
              <div className="space-y-3 p-4">
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-7 w-2/5" />
                <div className="border-t border-border pt-3">
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function HomePage() {
  const { cars, faqs } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const handleChangeFilters = React.useCallback(
    (next: Partial<CatalogFilterState>) => {
      const merged = normalizeCatalogSearch({
        ...search,
        ...next,
      })

      void navigate({
        search: merged,
        replace: true,
        resetScroll: false,
      })
    },
    [navigate, search],
  )

  const handleResetFilters = React.useCallback(() => {
    void navigate({
      search: {},
      replace: true,
      resetScroll: false,
    })
  }, [navigate])

  const handleApplyQuickFinder = React.useCallback(
    (filters: {
      kategori?: "all" | CarCategory
      budget?: BudgetBand
      transmisi?: "all" | TransmissionGroup
    }) => {
      const merged = normalizeCatalogSearch({
        ...search,
        kategori: filters.kategori,
        budget: filters.budget,
        transmisi: filters.transmisi,
      })

      void navigate({
        search: merged,
        replace: true,
        resetScroll: false,
      })

      if (typeof window !== "undefined") {
        window.requestAnimationFrame(() => {
          const catalogEl = document.getElementById("stok")
          if (!catalogEl) return
          const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)",
          ).matches
          catalogEl.scrollIntoView({
            behavior: prefersReducedMotion ? "auto" : "smooth",
            block: "start",
          })
        })
      }
    },
    [navigate, search],
  )

  return (
    <>
      <HeroSection cars={cars} onApplyQuickFinder={handleApplyQuickFinder} />
      <CatalogSection
        cars={cars}
        filters={search}
        onChangeFilters={handleChangeFilters}
        onResetFilters={handleResetFilters}
      />
      <CreditSection cars={cars} />
      <ShowroomSection />
      <FaqSection faqs={faqs} />
    </>
  )
}
