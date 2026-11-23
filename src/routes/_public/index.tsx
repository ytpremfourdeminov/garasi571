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
})

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
