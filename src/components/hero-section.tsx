import * as React from "react"
import { Link } from "@tanstack/react-router"
import { ArrowRight, Camera, Clock, MapPin, Search } from "lucide-react"
import {
  CARS,
  CREDIT_ELIGIBLE_CARS,
  HERO_FEATURED_SLUGS,
  formatRupiah,
  type BudgetBand,
  type CarCategory,
  type CarUnit,
  type TransmissionGroup,
} from "@/data/cars"
import { SHOWROOM } from "@/data/showroom"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export interface HeroSectionProps {
  onApplyQuickFinder: (filters: {
    kategori?: "all" | CarCategory
    budget?: BudgetBand
    transmisi?: "all" | TransmissionGroup
  }) => void
}

const FEATURED_CARS: CarUnit[] = HERO_FEATURED_SLUGS.map((slug) =>
  CARS.find((car) => car.slug === slug)
).filter((car): car is CarUnit => Boolean(car))

const CASH_ONLY_COUNT = CARS.length - CREDIT_ELIGIBLE_CARS.length

export function HeroSection({ onApplyQuickFinder }: HeroSectionProps) {
  const [kategori, setKategori] = React.useState<"all" | CarCategory>("all")
  const [budget, setBudget] = React.useState<BudgetBand>("all")
  const [transmisi, setTransmisi] = React.useState<"all" | TransmissionGroup>(
    "all"
  )
  const [activeIndex, setActiveIndex] = React.useState(0)
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([])

  const activeCar = FEATURED_CARS[activeIndex] ?? CARS[0]
  const coverImage = activeCar.images[0]

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onApplyQuickFinder({ kategori, budget, transmisi })
  }

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (FEATURED_CARS.length === 0) return

    let nextIndex: number | null = null
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % FEATURED_CARS.length
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + FEATURED_CARS.length) % FEATURED_CARS.length
    } else if (event.key === "Home") {
      nextIndex = 0
    } else if (event.key === "End") {
      nextIndex = FEATURED_CARS.length - 1
    }

    if (nextIndex !== null) {
      event.preventDefault()
      setActiveIndex(nextIndex)
      tabRefs.current[nextIndex]?.focus()
    }
  }

  return (
    <section
      aria-labelledby="hero-heading"
      className="border-b border-border bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid min-h-0 grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="min-w-0 lg:col-span-6">
            <h1
              id="hero-heading"
              className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
            >
              Cari Mobil Bekas Siap Pakai di Surakarta
            </h1>

            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
              {CARS.length} unit pilihan siap inspeksi langsung di Surakarta (
              {CREDIT_ELIGIBLE_CARS.length} unit tersedia opsi kredit &amp;{" "}
              {CASH_ONLY_COUNT} unit Special Price cash).
            </p>

            <form
              onSubmit={handleSubmit}
              aria-label="Pencarian cepat stok mobil"
              className="mt-6 border border-border bg-card p-5 sm:p-6"
            >
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Filter Cepat Unit
              </p>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="hero-kategori"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Kebutuhan
                  </label>
                  <select
                    id="hero-kategori"
                    name="kategori"
                    value={kategori}
                    onChange={(event) =>
                      setKategori(event.target.value as "all" | CarCategory)
                    }
                    className="mt-1.5 min-h-11 w-full rounded-none border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <option value="all">Semua Kebutuhan</option>
                    <option value="keluarga">Keluarga 7-Seater</option>
                    <option value="harian">Harian &amp; City Car</option>
                    <option value="hobi-eropa">Hobi &amp; Eropa</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="hero-budget"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Rentang Budget
                  </label>
                  <select
                    id="hero-budget"
                    name="budget"
                    value={budget}
                    onChange={(event) =>
                      setBudget(event.target.value as BudgetBand)
                    }
                    className="mt-1.5 min-h-11 w-full rounded-none border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <option value="all">Semua Budget</option>
                    <option value="under-120">Di bawah Rp120 juta</option>
                    <option value="120-200">Rp120 juta - Rp200 juta</option>
                    <option value="over-200">Di atas Rp200 juta</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="hero-transmisi"
                    className="block text-xs font-semibold text-foreground"
                  >
                    Transmisi
                  </label>
                  <select
                    id="hero-transmisi"
                    name="transmisi"
                    value={transmisi}
                    onChange={(event) =>
                      setTransmisi(
                        event.target.value as "all" | TransmissionGroup
                      )
                    }
                    className="mt-1.5 min-h-11 w-full rounded-none border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <option value="all">Semua Transmisi</option>
                    <option value="manual">Manual</option>
                    <option value="automatic">Automatic</option>
                  </select>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit" className="w-full sm:w-auto">
                  <Search className="size-4" aria-hidden="true" />
                  <span>Cari Unit Sesuai Kebutuhan</span>
                </Button>

                <a
                  href="#stok"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full no-underline sm:w-auto"
                  )}
                >
                  <span>Lihat Semua {CARS.length} Unit</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                <span>{SHOWROOM.city}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" aria-hidden="true" />
                <span>{SHOWROOM.hours}</span>
              </span>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-6">
            <div className="border border-border bg-card">
              <div
                role="tablist"
                aria-label="Sorotan unit tersedia"
                className="grid grid-cols-3 border-b border-border bg-secondary"
              >
                {FEATURED_CARS.map((car, index) => {
                  const isSelected = index === activeIndex
                  return (
                    <button
                      key={car.slug}
                      ref={(node) => {
                        tabRefs.current[index] = node
                      }}
                      type="button"
                      role="tab"
                      id={`hero-featured-tab-${car.slug}`}
                      aria-selected={isSelected}
                      aria-controls="hero-featured-panel"
                      tabIndex={isSelected ? 0 : -1}
                      onClick={() => setActiveIndex(index)}
                      onKeyDown={(event) => handleTabKeyDown(event, index)}
                      className={cn(
                        "flex min-h-11 flex-col justify-center border-r border-border px-3 py-2.5 text-left transition-colors last:border-r-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                        isSelected
                          ? "border-t-2 border-t-primary bg-card text-foreground"
                          : "border-t-2 border-t-transparent bg-secondary text-muted-foreground hover:bg-card/70 hover:text-foreground"
                      )}
                    >
                      <span className="text-[11px] font-medium tabular-nums">
                        {car.year}
                      </span>
                      <span className="line-clamp-1 font-heading text-xs font-semibold sm:text-sm">
                        {car.shortName}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div
                id="hero-featured-panel"
                role="tabpanel"
                aria-labelledby={`hero-featured-tab-${activeCar.slug}`}
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-secondary">
                  <img
                    src={coverImage.src}
                    width={coverImage.width}
                    height={coverImage.height}
                    alt={coverImage.alt}
                    fetchPriority="high"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 bg-[#161514] px-2.5 py-1 text-xs font-medium text-[#FAF9F7] tabular-nums">
                    <Camera className="size-3.5" aria-hidden="true" />
                    <span>{activeCar.images.length} foto</span>
                  </span>
                </div>

                <div className="border-t border-border bg-[#161514] p-5 text-[#FAF9F7]">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-[#C7C2BC]">
                    <span>{activeCar.categoryLabel}</span>
                    <span aria-hidden="true">/</span>
                    <span className="tabular-nums">{activeCar.year}</span>
                    <span aria-hidden="true">/</span>
                    <span>{activeCar.transmission}</span>
                  </div>

                  <h2 className="mt-1.5 font-heading text-xl font-bold tracking-tight text-[#FAF9F7]">
                    {activeCar.name}
                  </h2>

                  <div className="mt-4 flex flex-col gap-4 border-t border-[#FAF9F7]/15 pt-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1 tabular-nums">
                      {activeCar.creditPrice !== null ? (
                        <>
                          <p className="text-xs text-[#C7C2BC]">
                            Harga Cash:{" "}
                            <span className="font-semibold text-[#FAF9F7]">
                              {formatRupiah(activeCar.cashPrice)}
                            </span>
                          </p>
                          <p className="text-xs text-[#F87171]">
                            Harga Kredit:{" "}
                            <span className="font-heading text-lg font-bold text-[#FAF9F7]">
                              {formatRupiah(activeCar.creditPrice)}
                            </span>
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-semibold text-[#F87171]">
                            Special Price Cash (Khusus Cash)
                          </p>
                          <p className="font-heading text-lg font-bold text-[#FAF9F7]">
                            {formatRupiah(activeCar.cashPrice)}
                          </p>
                        </>
                      )}
                    </div>

                    <Link
                      to="/mobil/$slug"
                      params={{ slug: activeCar.slug }}
                      className={cn(
                        buttonVariants({ variant: "default" }),
                        "w-full shrink-0 no-underline sm:w-auto"
                      )}
                    >
                      <span>Lihat Unit &amp; Foto</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
