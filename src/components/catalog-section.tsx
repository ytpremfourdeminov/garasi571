import * as React from "react"
import { MessageCircle, RotateCcw, Search, SlidersHorizontal } from "lucide-react"
import {
  CARS,
  filterAndSortCars,
  type BudgetBand,
  type CarCategory,
  type CatalogFilterState,
  type PaymentMode,
  type SortOption,
  type TransmissionGroup,
} from "@/data/cars"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { CarCard } from "@/components/car-card"
import { useWhatsAppDialog } from "@/components/whatsapp-dialog"
import { cn } from "cn"

export interface CatalogSectionProps {
  filters: CatalogFilterState
  onChangeFilters: (next: Partial<CatalogFilterState>) => void
  onResetFilters: () => void
}

const CATEGORY_OPTIONS: ReadonlyArray<{
  value: "all" | CarCategory
  label: string
}> = [
  { value: "all", label: "Semua" },
  { value: "keluarga", label: "Keluarga 7-Seater" },
  { value: "harian", label: "Harian & City Car" },
  { value: "hobi-eropa", label: "Hobi & Eropa" },
]

const BUDGET_LABELS: Record<BudgetBand, string> = {
  all: "Semua Budget",
  "under-120": "Di bawah Rp120 juta",
  "120-200": "Rp120 juta - Rp200 juta",
  "over-200": "Di atas Rp200 juta",
}

const TRANSMISSION_LABELS: Record<"all" | TransmissionGroup, string> = {
  all: "Semua Transmisi",
  manual: "Manual",
  automatic: "Automatic",
}

const PAYMENT_LABELS: Record<"all" | PaymentMode, string> = {
  all: "Semua Pembayaran",
  "cash-credit": "Cash & Kredit",
  "cash-only": "Khusus Cash",
}

const CATEGORY_LABELS: Record<"all" | CarCategory, string> = {
  all: "Semua Kategori",
  keluarga: "Keluarga 7-Seater",
  harian: "Harian & City Car",
  "hobi-eropa": "Hobi & Eropa",
}

export function CatalogSection({
  filters,
  onChangeFilters,
  onResetFilters,
}: CatalogSectionProps) {
  const [sheetOpen, setSheetOpen] = React.useState(false)
  const { openWhatsAppDialog } = useWhatsAppDialog()

  const activeKategori = filters.kategori ?? "all"
  const activeBudget = filters.budget ?? "all"
  const activeTransmisi = filters.transmisi ?? "all"
  const activeBayar = filters.bayar ?? "all"
  const activeUrut = filters.urut
  const searchQuery = filters.q ?? ""

  const categoryCounts = React.useMemo(() => {
    const counts: Record<"all" | CarCategory, number> = {
      all: CARS.length,
      keluarga: 0,
      harian: 0,
      "hobi-eropa": 0,
    }
    for (const car of CARS) {
      counts[car.category] += 1
    }
    return counts
  }, [])

  const filteredCars = React.useMemo(
    () => filterAndSortCars(CARS, filters),
    [filters]
  )

  const secondaryFilterCount =
    (activeBudget !== "all" ? 1 : 0) +
    (activeTransmisi !== "all" ? 1 : 0) +
    (activeBayar !== "all" ? 1 : 0) +
    (activeUrut ? 1 : 0)

  const hasActiveFilters =
    Boolean(searchQuery.trim()) ||
    activeKategori !== "all" ||
    secondaryFilterCount > 0

  const activeCriteriaDescriptions = React.useMemo(() => {
    const items: string[] = []
    if (searchQuery.trim()) {
      items.push(`Kata kunci "${searchQuery.trim()}"`)
    }
    if (activeKategori !== "all") {
      items.push(`Kategori ${CATEGORY_LABELS[activeKategori]}`)
    }
    if (activeBudget !== "all") {
      items.push(`Budget ${BUDGET_LABELS[activeBudget]}`)
    }
    if (activeTransmisi !== "all") {
      items.push(`Transmisi ${TRANSMISSION_LABELS[activeTransmisi]}`)
    }
    if (activeBayar !== "all") {
      items.push(`Skema ${PAYMENT_LABELS[activeBayar]}`)
    }
    return items
  }, [
    searchQuery,
    activeKategori,
    activeBudget,
    activeTransmisi,
    activeBayar,
  ])

  const emptyInquiryMessage =
    activeCriteriaDescriptions.length > 0
      ? `Halo Garasi 571, saya sedang mencari mobil bekas dengan kriteria: ${activeCriteriaDescriptions.join(", ")}. Apakah ada rekomendasi unit yang sesuai di showroom Surakarta?`
      : "Halo Garasi 571, saya ingin menanyakan stok mobil bekas yang tersedia di showroom Surakarta."

  return (
    <section
      id="stok"
      aria-labelledby="catalog-heading"
      className="scroll-mt-20 bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <svg
                width="20"
                height="14"
                viewBox="0 0 20 14"
                fill="none"
                aria-hidden="true"
                className="shrink-0"
              >
                <path
                  d="M5 1L1 13"
                  stroke="#B91C1C"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
                <path
                  d="M12 1L8 13"
                  stroke="#B91C1C"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
                <path
                  d="M19 1L15 13"
                  stroke="#B91C1C"
                  strokeWidth="2"
                  strokeLinecap="square"
                />
              </svg>
              <span className="font-heading text-xs font-bold tracking-widest text-primary uppercase tabular-nums">
                01 / Stok Showroom
              </span>
            </div>

            <h2
              id="catalog-heading"
              className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Stok Mobil Tersedia di Surakarta
            </h2>
          </div>

          <p className="max-w-md text-sm text-muted-foreground">
            Filter berdasarkan kategori, rentang budget, transmisi, atau opsi
            pembayaran. Pilih hingga 3 unit untuk perbandingan langsung.
          </p>
        </div>

        {/* Desktop controls */}
        <div className="mt-6 hidden md:block">
          <div
            role="group"
            aria-label="Filter kategori mobil"
            className="flex flex-wrap gap-2"
          >
            {CATEGORY_OPTIONS.map((option) => {
              const isActive = activeKategori === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    onChangeFilters({
                      kategori: option.value === "all" ? undefined : option.value,
                    })
                  }
                  className={cn(
                    "inline-flex min-h-11 items-center gap-2 rounded-none border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    isActive
                      ? "border-[#161514] bg-[#161514] text-[#FAF9F7]"
                      : "border-input bg-card text-foreground hover:bg-secondary"
                  )}
                >
                  <span>{option.label}</span>
                  <span
                    className={cn(
                      "text-xs tabular-nums",
                      isActive ? "text-[#C7C2BC]" : "text-muted-foreground"
                    )}
                  >
                    ({categoryCounts[option.value]})
                  </span>
                </button>
              )
            })}
          </div>

          <div className="mt-4 border border-border bg-card p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-6 lg:grid-cols-12">
              <div className="md:col-span-6 lg:col-span-4">
                <label
                  htmlFor="catalog-search-desktop"
                  className="block text-xs font-semibold text-foreground"
                >
                  Cari Unit
                </label>
                <div className="relative mt-1.5">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <input
                    id="catalog-search-desktop"
                    type="search"
                    value={searchQuery}
                    onChange={(event) =>
                      onChangeFilters({ q: event.target.value || undefined })
                    }
                    placeholder="Cari merk, tipe, warna, atau kode plat"
                    className="min-h-11 w-full rounded-none border border-input bg-card pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  />
                </div>
              </div>

              <div className="md:col-span-3 lg:col-span-2">
                <label
                  htmlFor="catalog-budget-desktop"
                  className="block text-xs font-semibold text-foreground"
                >
                  Budget
                </label>
                <select
                  id="catalog-budget-desktop"
                  value={activeBudget}
                  onChange={(event) => {
                    const value = event.target.value as BudgetBand
                    onChangeFilters({
                      budget: value === "all" ? undefined : value,
                    })
                  }}
                  className="mt-1.5 min-h-11 w-full rounded-none border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <option value="all">Semua Budget</option>
                  <option value="under-120">Di bawah Rp120 jt</option>
                  <option value="120-200">Rp120 jt - Rp200 jt</option>
                  <option value="over-200">Di atas Rp200 jt</option>
                </select>
              </div>

              <div className="md:col-span-3 lg:col-span-2">
                <label
                  htmlFor="catalog-transmisi-desktop"
                  className="block text-xs font-semibold text-foreground"
                >
                  Transmisi
                </label>
                <select
                  id="catalog-transmisi-desktop"
                  value={activeTransmisi}
                  onChange={(event) => {
                    const value = event.target.value as "all" | TransmissionGroup
                    onChangeFilters({
                      transmisi: value === "all" ? undefined : value,
                    })
                  }}
                  className="mt-1.5 min-h-11 w-full rounded-none border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <option value="all">Semua</option>
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>

              <div className="md:col-span-3 lg:col-span-2">
                <label
                  htmlFor="catalog-bayar-desktop"
                  className="block text-xs font-semibold text-foreground"
                >
                  Pembayaran
                </label>
                <select
                  id="catalog-bayar-desktop"
                  value={activeBayar}
                  onChange={(event) => {
                    const value = event.target.value as "all" | PaymentMode
                    onChangeFilters({
                      bayar: value === "all" ? undefined : value,
                    })
                  }}
                  className="mt-1.5 min-h-11 w-full rounded-none border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <option value="all">Semua</option>
                  <option value="cash-credit">Cash &amp; Kredit</option>
                  <option value="cash-only">Khusus Cash</option>
                </select>
              </div>

              <div className="md:col-span-3 lg:col-span-2">
                <label
                  htmlFor="catalog-urut-desktop"
                  className="block text-xs font-semibold text-foreground"
                >
                  Urutkan
                </label>
                <select
                  id="catalog-urut-desktop"
                  value={activeUrut ?? ""}
                  onChange={(event) => {
                    const value = event.target.value as "" | SortOption
                    onChangeFilters({
                      urut: value === "" ? undefined : value,
                    })
                  }}
                  className="mt-1.5 min-h-11 w-full rounded-none border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <option value="">Urutan Showroom</option>
                  <option value="harga-terendah">Harga Terendah</option>
                  <option value="harga-tertinggi">Harga Tertinggi</option>
                  <option value="tahun-terbaru">Tahun Terbaru</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile controls */}
        <div className="mt-6 space-y-3 md:hidden">
          <div>
            <label
              htmlFor="catalog-search-mobile"
              className="block text-xs font-semibold text-foreground"
            >
              Cari Unit
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="catalog-search-mobile"
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  onChangeFilters({ q: event.target.value || undefined })
                }
                placeholder="Cari merk, tipe, warna, atau kode plat"
                className="min-h-11 w-full rounded-none border border-input bg-card pr-3 pl-9 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            </div>
          </div>

          <div
            role="group"
            aria-label="Filter kategori mobil"
            className="flex flex-wrap gap-2"
          >
            {CATEGORY_OPTIONS.map((option) => {
              const isActive = activeKategori === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() =>
                    onChangeFilters({
                      kategori: option.value === "all" ? undefined : option.value,
                    })
                  }
                  className={cn(
                    "inline-flex min-h-11 items-center gap-1.5 rounded-none border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    isActive
                      ? "border-[#161514] bg-[#161514] text-[#FAF9F7]"
                      : "border-input bg-card text-foreground hover:bg-secondary"
                  )}
                >
                  <span>{option.label}</span>
                  <span
                    className={cn(
                      "tabular-nums",
                      isActive ? "text-[#C7C2BC]" : "text-muted-foreground"
                    )}
                  >
                    ({categoryCounts[option.value]})
                  </span>
                </button>
              )
            })}
          </div>

          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger
              type="button"
              className="flex min-h-11 w-full items-center justify-between rounded-none border border-input bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <span className="inline-flex items-center gap-2">
                <SlidersHorizontal className="size-4" aria-hidden="true" />
                <span>Filter &amp; Urutkan</span>
              </span>
              {secondaryFilterCount > 0 ? (
                <span className="bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums">
                  {secondaryFilterCount}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">Atur</span>
              )}
            </SheetTrigger>

            <SheetContent side="bottom" closeLabel="Tutup panel filter">
              <SheetHeader>
                <SheetTitle>Filter &amp; Urutkan Stok</SheetTitle>
                <SheetDescription>
                  Sesuaikan budget, transmisi, skema pembayaran, dan urutan
                  tampilan unit.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="catalog-budget-mobile"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Rentang Budget
                  </label>
                  <select
                    id="catalog-budget-mobile"
                    value={activeBudget}
                    onChange={(event) => {
                      const value = event.target.value as BudgetBand
                      onChangeFilters({
                        budget: value === "all" ? undefined : value,
                      })
                    }}
                    className="mt-1.5 min-h-11 w-full rounded-none border border-input bg-card px-3 text-sm text-foreground"
                  >
                    <option value="all">Semua Budget</option>
                    <option value="under-120">Di bawah Rp120 juta</option>
                    <option value="120-200">Rp120 juta - Rp200 juta</option>
                    <option value="over-200">Di atas Rp200 juta</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="catalog-transmisi-mobile"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Transmisi
                  </label>
                  <select
                    id="catalog-transmisi-mobile"
                    value={activeTransmisi}
                    onChange={(event) => {
                      const value = event.target.value as
                        | "all"
                        | TransmissionGroup
                      onChangeFilters({
                        transmisi: value === "all" ? undefined : value,
                      })
                    }}
                    className="mt-1.5 min-h-11 w-full rounded-none border border-input bg-card px-3 text-sm text-foreground"
                  >
                    <option value="all">Semua Transmisi</option>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="catalog-bayar-mobile"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Pembayaran
                  </label>
                  <select
                    id="catalog-bayar-mobile"
                    value={activeBayar}
                    onChange={(event) => {
                      const value = event.target.value as "all" | PaymentMode
                      onChangeFilters({
                        bayar: value === "all" ? undefined : value,
                      })
                    }}
                    className="mt-1.5 min-h-11 w-full rounded-none border border-input bg-card px-3 text-sm text-foreground"
                  >
                    <option value="all">Semua Pembayaran</option>
                    <option value="cash-credit">Cash &amp; Kredit</option>
                    <option value="cash-only">Khusus Cash</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="catalog-urut-mobile"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Urutkan
                  </label>
                  <select
                    id="catalog-urut-mobile"
                    value={activeUrut ?? ""}
                    onChange={(event) => {
                      const value = event.target.value as "" | SortOption
                      onChangeFilters({
                        urut: value === "" ? undefined : value,
                      })
                    }}
                    className="mt-1.5 min-h-11 w-full rounded-none border border-input bg-card px-3 text-sm text-foreground"
                  >
                    <option value="">Urutan Showroom</option>
                    <option value="harga-terendah">Harga Terendah</option>
                    <option value="harga-tertinggi">Harga Tertinggi</option>
                    <option value="tahun-terbaru">Tahun Terbaru</option>
                  </select>
                </div>
              </div>

              <SheetFooter className="flex-row gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    onResetFilters()
                    setSheetOpen(false)
                  }}
                >
                  Reset
                </Button>
                <Button
                  type="button"
                  variant="default"
                  className="flex-1"
                  onClick={() => setSheetOpen(false)}
                >
                  Terapkan ({filteredCars.length})
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        {/* Result bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
          <p
            role="status"
            aria-live="polite"
            className="text-sm font-medium text-foreground tabular-nums"
          >
            Menampilkan {filteredCars.length} dari {CARS.length} unit
          </p>

          {hasActiveFilters ? (
            <Button
              type="button"
              variant="outline"
              onClick={onResetFilters}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              <span>Reset Filter</span>
            </Button>
          ) : null}
        </div>

        {/* Catalog grid or empty state */}
        {filteredCars.length > 0 ? (
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCars.map((car) => (
              <CarCard key={car.slug} car={car} />
            ))}
          </div>
        ) : (
          <div className="mt-6 border border-border bg-card p-6 sm:p-8">
            <h3 className="font-heading text-xl font-semibold text-foreground">
              Belum ada unit yang cocok dengan filter saat ini
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Kombinasi pencarian Anda menghasilkan 0 dari {CARS.length} unit
              tersedia
              {activeCriteriaDescriptions.length > 0
                ? `: ${activeCriteriaDescriptions.join(", ")}.`
                : "."}
            </p>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button type="button" onClick={onResetFilters}>
                <RotateCcw className="size-4" aria-hidden="true" />
                <span>Reset Semua Filter</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  openWhatsAppDialog({
                    title: "Tanya Ketersediaan Stok",
                    description:
                      "Sampaikan kriteria mobil yang Anda cari kepada tim sales Garasi 571 Surakarta.",
                    message: emptyInquiryMessage,
                  })
                }
              >
                <MessageCircle className="size-4" aria-hidden="true" />
                <span>Tanya Stok via WhatsApp</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
