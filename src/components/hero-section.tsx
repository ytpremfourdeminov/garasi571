import * as React from "react"
import { Link } from "@tanstack/react-router"
import { ArrowRight, Camera, Clock, MapPin, Search } from "lucide-react"
import { formatRupiah } from "@/lib/domain/formatters"
import type {
  BudgetBand,
  CarCategory,
  CarUnit,
  TransmissionGroup,
} from "@/lib/domain/types"
import { useShowroom } from "@/components/showroom-context"
import { Button, buttonVariants } from "@/components/ui/button"
import { TruncatedTooltip } from "@/components/ui/tooltip"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "cn"

export interface HeroSectionProps {
  cars: readonly CarUnit[]
  onApplyQuickFinder: (filters: {
    kategori?: "all" | CarCategory
    budget?: BudgetBand
    transmisi?: "all" | TransmissionGroup
  }) => void
}

const HERO_KATEGORI_ITEMS: Record<"all" | CarCategory, string> = {
  all: "Semua Kebutuhan",
  keluarga: "Keluarga 7-Seater",
  harian: "Harian & City Car",
  "hobi-eropa": "Hobi & Eropa",
}

const HERO_BUDGET_ITEMS: Record<BudgetBand, string> = {
  all: "Semua Budget",
  "under-120": "Di bawah Rp120 juta",
  "120-200": "Rp120 juta - Rp200 juta",
  "over-200": "Di atas Rp200 juta",
}

const HERO_TRANSMISI_ITEMS: Record<"all" | TransmissionGroup, string> = {
  all: "Semua Transmisi",
  manual: "Manual",
  automatic: "Automatic",
}

export function HeroSection({ cars, onApplyQuickFinder }: HeroSectionProps) {
  const showroom = useShowroom()
  const [kategori, setKategori] = React.useState<"all" | CarCategory>("all")
  const [budget, setBudget] = React.useState<BudgetBand>("all")
  const [transmisi, setTransmisi] = React.useState<"all" | TransmissionGroup>(
    "all"
  )
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [isPaused, setIsPaused] = React.useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([])

  const featuredCars = React.useMemo(() => {
    const flagged = cars
      .filter((car) => car.isFeatured)
      .sort(
        (a, b) =>
          (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.featuredOrder ?? Number.MAX_SAFE_INTEGER)
      )
    if (flagged.length > 0) {
      return flagged.slice(0, 3)
    }
    return cars.slice(0, 3)
  }, [cars])

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(media.matches)
    const handleChange = () => setPrefersReducedMotion(media.matches)
    media.addEventListener("change", handleChange)
    return () => media.removeEventListener("change", handleChange)
  }, [])

  const safeActiveIndex =
    featuredCars.length > 0 ? activeIndex % featuredCars.length : 0
  const activeCar = featuredCars.at(safeActiveIndex)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onApplyQuickFinder({ kategori, budget, transmisi })
  }

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (featuredCars.length === 0) return

    let nextIndex: number | null = null
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % featuredCars.length
    } else if (event.key === "ArrowLeft") {
      nextIndex = (index - 1 + featuredCars.length) % featuredCars.length
    } else if (event.key === "Home") {
      nextIndex = 0
    } else if (event.key === "End") {
      nextIndex = featuredCars.length - 1
    }

    if (nextIndex !== null) {
      event.preventDefault()
      setActiveIndex(nextIndex)
      tabRefs.current[nextIndex]?.focus()
    }
  }

  const tabGridColsClass =
    featuredCars.length === 1
      ? "grid-cols-1"
      : featuredCars.length === 2
        ? "grid-cols-2"
        : "grid-cols-3"

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
              Mobil Bekas Siap Pakai di Surakarta
            </h1>

            <p className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
              Cek kondisi unit langsung di showroom Surakarta. Tersedia
              pembelian cash, kredit, dan tukar tambah.
            </p>

            <form
              onSubmit={handleSubmit}
              aria-label="Pencarian cepat unit tersedia"
              className="mt-6 border border-border bg-card p-5 sm:p-6"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="hero-kategori"
                    className="block text-sm font-semibold text-foreground"
                  >
                    Kebutuhan
                  </label>
                  <Select
                    name="kategori"
                    items={HERO_KATEGORI_ITEMS}
                    value={kategori}
                    onValueChange={(value) => {
                      if (value) setKategori(value)
                    }}
                  >
                    <SelectTrigger
                      id="hero-kategori"
                      className="mt-1.5 min-h-11 w-full bg-card px-3 text-sm text-foreground data-[size=default]:h-11"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kebutuhan</SelectItem>
                      <SelectItem value="keluarga">
                        Keluarga 7-Seater
                      </SelectItem>
                      <SelectItem value="harian">
                        Harian &amp; City Car
                      </SelectItem>
                      <SelectItem value="hobi-eropa">
                        Hobi &amp; Eropa
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    htmlFor="hero-budget"
                    className="block text-sm font-semibold text-foreground"
                  >
                    Rentang Budget
                  </label>
                  <Select
                    name="budget"
                    items={HERO_BUDGET_ITEMS}
                    value={budget}
                    onValueChange={(value) => {
                      if (value) setBudget(value)
                    }}
                  >
                    <SelectTrigger
                      id="hero-budget"
                      className="mt-1.5 min-h-11 w-full bg-card px-3 text-sm text-foreground data-[size=default]:h-11"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Budget</SelectItem>
                      <SelectItem value="under-120">
                        Di bawah Rp120 juta
                      </SelectItem>
                      <SelectItem value="120-200">
                        Rp120 juta - Rp200 juta
                      </SelectItem>
                      <SelectItem value="over-200">
                        Di atas Rp200 juta
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    htmlFor="hero-transmisi"
                    className="block text-sm font-semibold text-foreground"
                  >
                    Transmisi
                  </label>
                  <Select
                    name="transmisi"
                    items={HERO_TRANSMISI_ITEMS}
                    value={transmisi}
                    onValueChange={(value) => {
                      if (value) setTransmisi(value)
                    }}
                  >
                    <SelectTrigger
                      id="hero-transmisi"
                      className="mt-1.5 min-h-11 w-full bg-card px-3 text-sm text-foreground data-[size=default]:h-11"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Transmisi</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="automatic">Automatic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button type="submit" className="w-full sm:w-auto">
                  <Search className="size-4" aria-hidden="true" />
                  <span>Cari Unit</span>
                </Button>

                <a
                  href="#stok"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "w-full no-underline sm:w-auto"
                  )}
                >
                  <span>Lihat Semua Unit</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            </form>

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                <span>{showroom.city}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-primary" aria-hidden="true" />
                <span>{showroom.hours}</span>
              </span>
            </div>
          </div>

          <div className="min-w-0 lg:col-span-6">
            {activeCar ? (
              <div
                className="border border-border bg-card"
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <div
                  role="tablist"
                  aria-label="Sorotan unit tersedia"
                  className={cn(
                    "grid border-b border-border bg-secondary",
                    tabGridColsClass
                  )}
                >
                  {featuredCars.map((car, index) => {
                    const isSelected = index === safeActiveIndex
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
                          "relative flex min-h-11 flex-col justify-center border-r border-border px-3 pt-3 pb-2.5 text-left transition-colors last:border-r-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
                          isSelected
                            ? "bg-card text-foreground"
                            : "bg-secondary text-muted-foreground hover:bg-card/70 hover:text-foreground"
                        )}
                      >
                        {isSelected ? (
                          <>
                            <span
                              aria-hidden="true"
                              className="pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-primary/20"
                            />
                            <span
                              key={safeActiveIndex}
                              aria-hidden="true"
                              onAnimationEnd={() => {
                                if (
                                  !prefersReducedMotion &&
                                  featuredCars.length > 1
                                ) {
                                  setActiveIndex(
                                    (prev) => (prev + 1) % featuredCars.length
                                  )
                                }
                              }}
                              style={
                                prefersReducedMotion
                                  ? undefined
                                  : {
                                      animation:
                                        "hero-tab-progress 3000ms linear forwards",
                                      animationPlayState: isPaused
                                        ? "paused"
                                        : "running",
                                    }
                              }
                              className="pointer-events-none absolute inset-x-0 top-0 h-0.5 origin-left bg-primary"
                            />
                          </>
                        ) : null}
                        <span className="text-sm font-medium tabular-nums">
                          {car.year}
                        </span>
                        <TruncatedTooltip
                          content={car.shortName}
                          render={
                            <span className="line-clamp-1 font-heading text-sm font-semibold sm:text-sm" />
                          }
                        >
                          {car.shortName}
                        </TruncatedTooltip>
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
                    {featuredCars.map((car, index) => {
                      const img = car.images.at(0)
                      const isCurrent = index === safeActiveIndex
                      if (!img) {
                        return isCurrent ? (
                          <div
                            key={car.slug}
                            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-secondary px-4 text-center text-sm text-muted-foreground"
                          >
                            <Camera
                              className="size-7 opacity-50"
                              aria-hidden="true"
                            />
                            <span>Foto unit belum tersedia</span>
                          </div>
                        ) : null
                      }
                      return (
                        <img
                          key={car.slug}
                          src={img.src}
                          width={img.width}
                          height={img.height}
                          alt={img.alt}
                          loading={index === 0 ? "eager" : "lazy"}
                          decoding={index === 0 ? "sync" : "async"}
                          fetchPriority={index === 0 ? "high" : "low"}
                          aria-hidden={!isCurrent}
                          className={cn(
                            "absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 ease-out",
                            isCurrent
                              ? "z-10 scale-100 opacity-100"
                              : "pointer-events-none z-0 scale-[1.03] opacity-0"
                          )}
                        />
                      )
                    })}
                    <span className="absolute right-3 bottom-3 z-20 inline-flex items-center gap-1.5 bg-[#161514] px-2.5 py-1 text-sm font-medium text-[#FAF9F7] tabular-nums">
                      <Camera className="size-3.5" aria-hidden="true" />
                      <span>{activeCar.images.length} foto</span>
                    </span>
                  </div>

                  <div className="border-t border-border bg-[#161514] p-5 text-[#FAF9F7]">
                    <div key={activeCar.slug} className="animate-hero-panel">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-[#C7C2BC]">
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
                              <p className="text-sm text-[#C7C2BC]">
                                Harga Cash:{" "}
                                <span className="font-semibold text-[#FAF9F7]">
                                  {formatRupiah(activeCar.cashPrice)}
                                </span>
                              </p>
                              <p className="text-sm text-[#F87171]">
                                Harga Kredit:{" "}
                                <span className="font-heading text-lg font-bold text-[#FAF9F7]">
                                  {formatRupiah(activeCar.creditPrice)}
                                </span>
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-semibold text-[#F87171]">
                                Khusus Cash
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
                          <span>Lihat Detail</span>
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-border bg-[#161514] p-6 text-[#FAF9F7] sm:p-8">
                <p className="text-sm font-semibold tracking-widest text-[#F87171] uppercase">
                  {showroom.name}
                </p>
                <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#FAF9F7]">
                  Stok Unit Sedang Diperbarui
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#C7C2BC]">
                  Kunjungi showroom kami di {showroom.city} ({showroom.hours})
                  atau hubungi tim sales untuk informasi unit terbaru.
                </p>
                <a
                  href="#lokasi"
                  className={cn(
                    buttonVariants({ variant: "default" }),
                    "mt-5 no-underline"
                  )}
                >
                  <span>Lihat Lokasi &amp; Kontak</span>
                  <ArrowRight className="size-4" aria-hidden="true" />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
