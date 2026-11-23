import * as React from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import {
  AlertTriangle,
  ArrowRight,
  Car,
  CheckCircle2,
  ClipboardList,
  Plus,
  Shield,
  Star,
  Store,
} from "lucide-react"
import { cn } from "cn"
import { CarStatusBadge } from "@/components/dash/car-status-badge"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TruncatedTooltip } from "@/components/ui/tooltip"
import { computeCarCompleteness } from "@/lib/domain/completeness"
import { formatRupiah, getCategoryLabel } from "@/lib/domain/formatters"
import type {
  CarImage,
  CarStatus,
  CarUnit,
  CompletenessResult,
} from "@/lib/domain/types"
import { listDashCarsFn } from "@/server/dash-cars"

export const Route = createFileRoute("/dash/")({
  loader: async () => {
    return listDashCarsFn({ data: { includeArchived: true } })
  },
  head: () => ({
    meta: [
      {
        title: "Ringkasan | Garasi 571",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: DashOverviewPage,
  pendingComponent: DashOverviewPending,
})

function DashOverviewPending() {
  return (
    <div aria-busy="true" aria-label="Memuat ringkasan" className="space-y-8">
      <section className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-72 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-40" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="border border-border bg-card p-4 sm:p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-4 h-9 w-16" />
            <Skeleton className="mt-3 h-4 w-36" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((idx) => (
          <Skeleton key={idx} className="h-20 w-full border border-border" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="border border-border bg-card lg:col-span-8">
          <div className="border-b border-border bg-secondary/40 px-4 py-4 sm:px-5">
            <Skeleton className="h-6 w-56" />
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            {[0, 1, 2].map((idx) => (
              <Skeleton key={idx} className="h-24 w-full" />
            ))}
          </div>
        </div>
        <div className="border border-border bg-card lg:col-span-4">
          <div className="border-b border-border bg-secondary/40 px-4 py-4 sm:px-5">
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="space-y-3 p-4 sm:p-5">
            {[0, 1, 2].map((idx) => (
              <Skeleton key={idx} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

interface CarWithCompleteness {
  car: CarUnit
  completeness: CompletenessResult
}

interface KpiCardItem {
  status: CarStatus
  label: string
  sublabel: string
  count: number
  accentClass: string
  countClass: string
}

function getCoverImage(car: CarUnit): CarImage | undefined {
  return car.images.find((image) => image.isCover) ?? car.images.at(0)
}

function DashOverviewPage() {
  const { staff } = Route.useRouteContext()
  const { cars, kpis } = Route.useLoaderData()

  const isAdmin = staff.role === "admin"

  const {
    activeCars,
    incompleteUnits,
    featuredUnits,
    averageCompleteness,
  } = React.useMemo(() => {
    const active = cars.filter((car) => car.status !== "archived")
    const evaluated: CarWithCompleteness[] = active.map((car) => ({
      car,
      completeness: computeCarCompleteness(car),
    }))

    const belowThreshold = evaluated
      .filter((item) => item.completeness.score < 70)
      .sort((a, b) => a.completeness.score - b.completeness.score)

    const featured = active
      .filter((car) => car.isFeatured)
      .sort(
        (a, b) =>
          (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.featuredOrder ?? Number.MAX_SAFE_INTEGER)
      )

    const avg =
      evaluated.length > 0
        ? Math.round(
            evaluated.reduce((sum, item) => sum + item.completeness.score, 0) /
              evaluated.length
          )
        : 0

    return {
      activeCars: active,
      incompleteUnits: belowThreshold,
      featuredUnits: featured,
      averageCompleteness: avg,
    }
  }, [cars])

  const kpiCards: KpiCardItem[] = [
    {
      status: "ready",
      label: "Ready / Siap Jual",
      sublabel: "Tayang di katalog publik",
      count: kpis.ready,
      accentClass: "border-t-emerald-700",
      countClass: "text-foreground",
    },
    {
      status: "booked",
      label: "Booked / Dibooking",
      sublabel: "Sedang proses tanda jadi",
      count: kpis.booked,
      accentClass: "border-t-amber-600",
      countClass: "text-foreground",
    },
    {
      status: "sold",
      label: "Sold / Terjual",
      sublabel: "Unit berhasil terjual",
      count: kpis.sold,
      accentClass: "border-t-[#161514]",
      countClass: "text-foreground",
    },
    {
      status: "draft",
      label: "Draft",
      sublabel: "Belum dipublikasikan",
      count: kpis.draft,
      accentClass: "border-t-[#766F68]",
      countClass: "text-foreground",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Ringkasan Stok &amp; Kelengkapan Unit
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Total{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {kpis.total}
            </span>{" "}
            unit ({activeCars.length} aktif, {kpis.archived} diarsipkan),
            rata-rata kelengkapan data{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {averageCompleteness}%
            </span>
            .
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/dash/cars"
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "no-underline"
            )}
          >
            <ClipboardList className="size-4" aria-hidden="true" />
            <span>Kelola Inventaris</span>
          </Link>
          <Link
            to="/dash/cars/new"
            className={cn(
              buttonVariants({ variant: "default", size: "default" }),
              "no-underline"
            )}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>Tambah Unit Baru</span>
          </Link>
        </div>
      </section>

      {/* 4 KPI Cards */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">
          Ringkasan Status Stok Unit
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpiCards.map((card) => (
            <Link
              key={card.status}
              to="/dash/cars"
              search={{ status: card.status }}
              className={cn(
                "group flex min-w-0 flex-col justify-between border border-border border-t-2 bg-card p-4 no-underline transition-colors hover:border-foreground/50 hover:bg-secondary/35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:p-5",
                card.accentClass
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                  {card.label}
                </p>
                <ArrowRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                  aria-hidden="true"
                />
              </div>

              <div className="mt-4 flex items-baseline gap-2">
                <p
                  className={cn(
                    "font-heading text-3xl font-bold tracking-tight tabular-nums sm:text-4xl",
                    card.countClass
                  )}
                >
                  {card.count}
                </p>
                <span className="text-sm font-medium text-muted-foreground">
                  unit
                </span>
              </div>

              <p className="mt-2 text-sm text-muted-foreground">
                {card.sublabel}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Shortcuts */}
      <section aria-labelledby="shortcuts-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="shortcuts-heading"
            className="font-heading text-sm font-bold tracking-[0.16em] text-muted-foreground uppercase"
          >
            Aksi Cepat
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Link
            to="/dash/cars/new"
            className="group flex min-h-14 items-center justify-between gap-3 border border-[#161514] bg-[#161514] px-4 py-3.5 text-[#FAF9F7] no-underline transition-colors hover:bg-[#242220] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center bg-primary text-primary-foreground">
                <Plus className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <TruncatedTooltip
                  content="Tambah Unit Baru"
                  render={
                    <p className="truncate font-heading text-sm font-semibold text-[#FAF9F7]" />
                  }
                >
                  Tambah Unit Baru
                </TruncatedTooltip>
                <TruncatedTooltip
                  content="Input data, foto, & simulasi kredit"
                  render={<p className="truncate text-sm text-[#C7C2BC]" />}
                >
                  Input data, foto, &amp; simulasi kredit
                </TruncatedTooltip>
              </div>
            </div>
            <ArrowRight
              className="size-4 shrink-0 text-[#C7C2BC] transition-transform group-hover:translate-x-0.5 group-hover:text-[#FAF9F7]"
              aria-hidden="true"
            />
          </Link>

          <Link
            to="/dash/cars"
            className="group flex min-h-14 items-center justify-between gap-3 border border-border bg-card px-4 py-3.5 text-foreground no-underline transition-colors hover:border-foreground/50 hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center border border-border bg-secondary text-foreground">
                <Car className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <TruncatedTooltip
                  content="Kelola Inventaris"
                  render={
                    <p className="truncate font-heading text-sm font-semibold text-foreground" />
                  }
                >
                  Kelola Inventaris
                </TruncatedTooltip>
                <TruncatedTooltip
                  content="Ubah status stok & slot unggulan"
                  render={
                    <p className="truncate text-sm text-muted-foreground" />
                  }
                >
                  Ubah status stok &amp; slot unggulan
                </TruncatedTooltip>
              </div>
            </div>
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
              aria-hidden="true"
            />
          </Link>

          <Link
            to="/dash/showroom"
            className="group flex min-h-14 items-center justify-between gap-3 border border-border bg-card px-4 py-3.5 text-foreground no-underline transition-colors hover:border-foreground/50 hover:bg-secondary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center border border-border bg-secondary text-foreground">
                <Store className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <TruncatedTooltip
                    content="Pengaturan Showroom"
                    render={
                      <p className="truncate font-heading text-sm font-semibold text-foreground" />
                    }
                  >
                    Pengaturan Showroom
                  </TruncatedTooltip>
                  {!isAdmin ? (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-sm text-muted-foreground"
                    >
                      <Shield className="size-2.5" aria-hidden="true" />
                      <span>Admin</span>
                    </Badge>
                  ) : null}
                </div>
                <TruncatedTooltip
                  content="Jam operasional, alamat, & kontak sales"
                  render={
                    <p className="truncate text-sm text-muted-foreground" />
                  }
                >
                  Jam operasional, alamat, &amp; kontak sales
                </TruncatedTooltip>
              </div>
            </div>
            <ArrowRight
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
              aria-hidden="true"
            />
          </Link>
        </div>
      </section>

      {/* Main Content Grid: Completeness Alert + Hero Featured Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Unit Perlu Dilengkapi (< 70%) */}
        <section
          aria-labelledby="completeness-heading"
          className="border border-border bg-card lg:col-span-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/40 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <h2
                id="completeness-heading"
                className="font-heading text-base font-bold tracking-tight text-foreground"
              >
                Unit Perlu Dilengkapi (&lt; 70%)
              </h2>
            </div>

            <Badge
              variant={incompleteUnits.length > 0 ? "destructive" : "success"}
              className="tabular-nums"
            >
              {incompleteUnits.length} unit
            </Badge>
          </div>

          {activeCars.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex size-12 items-center justify-center border border-border bg-secondary text-muted-foreground">
                <Car className="size-6" aria-hidden="true" />
              </div>
              <p className="mt-4 font-heading text-base font-semibold text-foreground">
                Belum ada unit aktif di inventaris
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Tambahkan unit mobil pertama untuk mulai memantau kelengkapan
                data dan menayangkan katalog.
              </p>
              <Link
                to="/dash/cars/new"
                className={cn(
                  buttonVariants({ variant: "default", size: "default" }),
                  "mt-5 no-underline"
                )}
              >
                <Plus className="size-4" aria-hidden="true" />
                <span>Tambah Unit Baru</span>
              </Link>
            </div>
          ) : incompleteUnits.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
              <div className="flex size-12 items-center justify-center border border-emerald-800/30 bg-emerald-50 text-emerald-800">
                <CheckCircle2 className="size-6" aria-hidden="true" />
              </div>
              <p className="mt-4 font-heading text-base font-semibold text-foreground">
                Semua unit aktif siap tayang
              </p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Seluruh{" "}
                <span className="font-semibold text-foreground tabular-nums">
                  {activeCars.length}
                </span>{" "}
                unit aktif telah mencapai skor kelengkapan minimal 70%.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {incompleteUnits.map(({ car, completeness }) => {
                const cover = getCoverImage(car)
                const topMissing = completeness.missingItems.slice(0, 3)
                const remainingMissing =
                  completeness.missingItems.length - topMissing.length
                const isCritical = completeness.score < 45

                return (
                  <li
                    key={car.id}
                    className="flex flex-col gap-4 p-4 transition-colors hover:bg-secondary/25 sm:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3.5">
                        <div className="relative h-14 w-20 shrink-0 overflow-hidden border border-border bg-secondary">
                          {cover ? (
                            <img
                              src={cover.src}
                              alt={cover.alt || car.name}
                              loading="lazy"
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-muted-foreground">
                              <Car className="size-5" aria-hidden="true" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <TruncatedTooltip
                              content={car.name}
                              render={
                                <p className="truncate font-heading text-sm font-bold text-foreground sm:text-base" />
                              }
                            >
                              {car.name}
                            </TruncatedTooltip>
                            <CarStatusBadge status={car.status} />
                          </div>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            <span className="tabular-nums">{car.year}</span>{" "}
                            &middot; {getCategoryLabel(car.category)} &middot;{" "}
                            <span className="font-medium text-foreground tabular-nums">
                              {formatRupiah(car.cashPrice)}
                            </span>
                          </p>
                        </div>
                      </div>

                      <Link
                        to="/dash/cars/$carId"
                        params={{ carId: car.id }}
                        className={cn(
                          buttonVariants({ variant: "outline", size: "default" }),
                          "w-full shrink-0 no-underline sm:w-auto"
                        )}
                      >
                        <span>Lengkapi Data</span>
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </div>

                    {/* Progress bar + score */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="font-medium text-muted-foreground">
                          Kelengkapan Data
                        </span>
                        <span
                          className={cn(
                            "font-heading font-bold tabular-nums",
                            isCritical ? "text-[#991B1B]" : "text-amber-900"
                          )}
                        >
                          {completeness.score}%
                        </span>
                      </div>
                      <div
                        role="progressbar"
                        aria-label={`Skor kelengkapan ${car.name}`}
                        aria-valuenow={completeness.score}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="h-2 w-full overflow-hidden border border-border bg-secondary"
                      >
                        <div
                          className={cn(
                            "h-full transition-all",
                            isCritical ? "bg-primary" : "bg-amber-600"
                          )}
                          style={{ width: `${completeness.score}%` }}
                        />
                      </div>
                    </div>

                    {/* Top missing items */}
                    {topMissing.length > 0 ? (
                      <div className="border-l-2 border-border pl-3">
                        <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                          Data yang perlu dilengkapi
                        </p>
                        <ul className="mt-1 space-y-1 text-sm text-foreground">
                          {topMissing.map((item) => (
                            <li
                              key={`${item.dimensionKey}-${item.label}`}
                              className="flex items-start gap-2"
                            >
                              <span
                                aria-hidden="true"
                                className="mt-1.5 inline-block size-1 shrink-0 bg-primary"
                              />
                              <span>{item.label}</span>
                            </li>
                          ))}
                        </ul>
                        {remainingMissing > 0 ? (
                          <p className="mt-1.5 text-sm font-medium text-muted-foreground tabular-nums">
                            +{remainingMissing} item lainnya
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        {/* Companion Panel: Hero Featured Slots */}
        <aside
          aria-labelledby="featured-summary-heading"
          className="flex flex-col border border-border bg-card lg:col-span-4"
        >
          <div className="flex items-center justify-between gap-2 border-b border-border bg-secondary/40 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-2">
              <Star
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <h2
                id="featured-summary-heading"
                className="font-heading text-base font-bold tracking-tight text-foreground"
              >
                Unggulan Beranda
              </h2>
            </div>
            <Badge
              variant={featuredUnits.length >= 3 ? "default" : "outline"}
              className="tabular-nums"
            >
              {featuredUnits.length}/3 slot
            </Badge>
          </div>

          <div className="flex-1 p-4 sm:p-5">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Maksimal 3 unit tampil di sorotan utama beranda.
            </p>

            {featuredUnits.length === 0 ? (
              <div className="mt-4 border border-dashed border-border bg-secondary/30 p-4 text-center">
                <p className="text-sm font-medium text-muted-foreground">
                  Belum ada unit unggulan beranda.
                </p>
              </div>
            ) : (
              <ol className="mt-4 space-y-2.5">
                {featuredUnits.map((car, index) => (
                  <li
                    key={car.id}
                    className="flex items-start justify-between gap-3 border border-border bg-background p-3"
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className="flex size-6 shrink-0 items-center justify-center bg-[#161514] font-heading text-sm font-bold text-[#FAF9F7] tabular-nums">
                        #{car.featuredOrder ?? index + 1}
                      </span>
                      <div className="min-w-0">
                        <TruncatedTooltip
                          content={car.shortName || car.name}
                          render={
                            <p className="truncate text-sm font-semibold text-foreground" />
                          }
                        >
                          {car.shortName || car.name}
                        </TruncatedTooltip>
                        <p className="mt-0.5 text-sm text-muted-foreground tabular-nums">
                          {car.year} &middot; {formatRupiah(car.cashPrice)}
                        </p>
                      </div>
                    </div>
                    <CarStatusBadge
                      status={car.status}
                      className="shrink-0"
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="border-t border-border p-4 sm:px-5">
            <Link
              to="/dash/cars"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "w-full justify-between no-underline"
              )}
            >
              <span>Atur di Inventaris</span>
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
