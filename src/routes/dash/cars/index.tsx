import * as React from "react"
import {
  Link,
  createFileRoute,
  useRouter,
} from "@tanstack/react-router"
import {
  AlertCircle,
  Archive,
  Car,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react"
import { cn } from "cn"
import {
  CAR_STATUS_LABELS,
  CarStatusBadge,
} from "@/components/dash/car-status-badge"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { computeCarCompleteness } from "@/lib/domain/completeness"
import {
  CATEGORY_LABELS,
  formatRupiah,
  getCategoryLabel,
} from "@/lib/domain/formatters"
import type {
  CarCategory,
  CarImage,
  CarStatus,
  CarUnit,
  CompletenessResult,
} from "@/lib/domain/types"
import { getPublicSiteOrigin } from "@/lib/host"
import {
  archiveCarFn,
  deleteCarPermanentlyFn,
  listDashCarsFn,
  quickUpdateCarStatusFn,
  toggleFeaturedCarFn,
} from "@/server/dash-cars"

type StatusFilter = "all" | CarStatus
type CategoryFilter = "all" | CarCategory

interface CarsSearchParams {
  q?: string
  status?: StatusFilter
  category?: CategoryFilter
}

const VALID_STATUS_FILTERS = new Set<StatusFilter>([
  "all",
  "ready",
  "booked",
  "sold",
  "draft",
  "archived",
])

const VALID_CATEGORY_FILTERS = new Set<CategoryFilter>([
  "all",
  "keluarga",
  "harian",
  "hobi-eropa",
])

function parseCarsSearch(raw: Record<string, unknown>): CarsSearchParams {
  const result: CarsSearchParams = {}

  if (typeof raw.q === "string" && raw.q.trim().length > 0) {
    result.q = raw.q
  }

  if (
    typeof raw.status === "string" &&
    VALID_STATUS_FILTERS.has(raw.status as StatusFilter)
  ) {
    result.status = raw.status as StatusFilter
  }

  if (
    typeof raw.category === "string" &&
    VALID_CATEGORY_FILTERS.has(raw.category as CategoryFilter)
  ) {
    result.category = raw.category as CategoryFilter
  }

  return result
}

export const Route = createFileRoute("/dash/cars/")({
  validateSearch: parseCarsSearch,
  loader: async () => {
    return listDashCarsFn({ data: { includeArchived: true } })
  },
  head: () => ({
    meta: [
      {
        title: "Inventaris Mobil | Garasi 571",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: DashCarsPage,
})

const STATUS_FILTER_ITEMS: Record<StatusFilter, string> = {
  all: "Semua Status",
  ready: CAR_STATUS_LABELS.ready,
  booked: CAR_STATUS_LABELS.booked,
  sold: CAR_STATUS_LABELS.sold,
  draft: CAR_STATUS_LABELS.draft,
  archived: CAR_STATUS_LABELS.archived,
}

const CATEGORY_FILTER_ITEMS: Record<CategoryFilter, string> = {
  all: "Semua Kategori",
  keluarga: CATEGORY_LABELS.keluarga,
  harian: CATEGORY_LABELS.harian,
  "hobi-eropa": CATEGORY_LABELS["hobi-eropa"],
}

const STATUS_SELECT_ORDER: ReadonlyArray<CarStatus> = [
  "ready",
  "booked",
  "sold",
  "draft",
  "archived",
]

const STATUS_DOT_CLASS: Record<CarStatus, string> = {
  ready: "bg-emerald-700",
  booked: "bg-amber-600",
  sold: "bg-[#161514]",
  draft: "bg-[#766F68]",
  archived: "bg-[#A39B92]",
}

const FEATURED_SLOT_OPTIONS = ["1", "2", "3"] as const
const FEATURED_SLOT_LABELS: Record<(typeof FEATURED_SLOT_OPTIONS)[number], string> = {
  "1": "Slot #1",
  "2": "Slot #2",
  "3": "Slot #3",
}

type RowPendingAction = "status" | "featured" | "archive" | "delete"

interface FeedbackState {
  tone: "success" | "error"
  message: string
}

function getCoverImage(car: CarUnit): CarImage | undefined {
  return car.images.find((image) => image.isCover) ?? car.images.at(0)
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }
  return fallback
}

function getCompletenessBadgeClass(score: number): string {
  if (score >= 85) {
    return "border-emerald-800/30 bg-emerald-50 text-emerald-950"
  }
  if (score >= 70) {
    return "border-input bg-card text-foreground"
  }
  if (score >= 45) {
    return "border-amber-800/40 bg-amber-50 text-amber-950"
  }
  return "border-destructive/35 bg-destructive/10 text-[#991B1B]"
}

function getCompletenessBarClass(score: number): string {
  if (score >= 85) return "bg-emerald-700"
  if (score >= 70) return "bg-[#161514]"
  if (score >= 45) return "bg-amber-600"
  return "bg-primary"
}

function DashCarsPage() {
  const { staff } = Route.useRouteContext()
  const loaderData = Route.useLoaderData()
  const search = Route.useSearch()
  const router = useRouter()

  const isAdmin = staff.role === "admin"

  const [cars, setCars] = React.useState<CarUnit[]>(loaderData.cars)
  const [searchQuery, setSearchQuery] = React.useState(search.q ?? "")
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>(
    search.status ?? "all"
  )
  const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>(
    search.category ?? "all"
  )
  const [pendingById, setPendingById] = React.useState<
    Record<string, RowPendingAction | undefined>
  >({})
  const [feedback, setFeedback] = React.useState<FeedbackState | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<CarUnit | null>(null)
  const [deleteError, setDeleteError] = React.useState<string | null>(null)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [publicSiteOrigin, setPublicSiteOrigin] = React.useState(() =>
    getPublicSiteOrigin()
  )

  React.useEffect(() => {
    setCars(loaderData.cars)
  }, [loaderData.cars])

  React.useEffect(() => {
    setSearchQuery(search.q ?? "")
    setStatusFilter(search.status ?? "all")
    setCategoryFilter(search.category ?? "all")
  }, [search.q, search.status, search.category])

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setPublicSiteOrigin(getPublicSiteOrigin(window.location.href))
    }
  }, [])

  const setRowPending = React.useCallback(
    (carId: string, action?: RowPendingAction) => {
      setPendingById((prev) => {
        if (!action) {
          const next = { ...prev }
          delete next[carId]
          return next
        }
        return { ...prev, [carId]: action }
      })
    },
    []
  )

  const completenessById = React.useMemo(() => {
    const map = new Map<string, CompletenessResult>()
    for (const car of cars) {
      map.set(car.id, computeCarCompleteness(car))
    }
    return map
  }, [cars])

  const featuredCars = React.useMemo(() => {
    return cars
      .filter((car) => car.isFeatured)
      .sort(
        (a, b) =>
          (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
          (b.featuredOrder ?? Number.MAX_SAFE_INTEGER)
      )
  }, [cars])

  const featuredCount = featuredCars.length

  const statusCounts = React.useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: cars.length,
      ready: 0,
      booked: 0,
      sold: 0,
      draft: 0,
      archived: 0,
    }
    for (const car of cars) {
      counts[car.status] += 1
    }
    return counts
  }, [cars])

  const filteredCars = React.useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    return cars.filter((car) => {
      if (statusFilter !== "all" && car.status !== statusFilter) {
        return false
      }
      if (categoryFilter !== "all" && car.category !== categoryFilter) {
        return false
      }
      if (query) {
        const haystack = [
          car.brand,
          car.name,
          car.shortName,
          car.year,
          car.slug,
          car.color,
          car.plateInfo,
          car.categoryLabel,
          car.transmission,
        ]
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(query)) {
          return false
        }
      }
      return true
    })
  }, [cars, searchQuery, statusFilter, categoryFilter])

  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    statusFilter !== "all" ||
    categoryFilter !== "all"

  const resetFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setCategoryFilter("all")
  }

  const replaceCarInState = React.useCallback((updatedCar: CarUnit) => {
    setCars((prev) =>
      prev.map((item) => (item.id === updatedCar.id ? updatedCar : item))
    )
  }, [])

  const handleQuickStatusChange = async (
    car: CarUnit,
    nextStatus: CarStatus
  ) => {
    if (car.status === nextStatus) return

    setFeedback(null)
    setRowPending(car.id, "status")

    try {
      const updated = await quickUpdateCarStatusFn({
        data: { id: car.id, status: nextStatus },
      })
      replaceCarInState(updated)
      setFeedback({
        tone: "success",
        message:
          updated.status === "archived"
            ? `Status "${updated.name}" diubah menjadi Diarsipkan dan dilepas dari unggulan Hero.`
            : `Status "${updated.name}" berhasil diperbarui ke ${CAR_STATUS_LABELS[updated.status]}.`,
      })
      void router.invalidate()
    } catch (error) {
      setFeedback({
        tone: "error",
        message: getErrorMessage(
          error,
          `Gagal memperbarui status untuk "${car.name}".`
        ),
      })
    } finally {
      setRowPending(car.id, undefined)
    }
  }

  const handleToggleFeatured = async (car: CarUnit, nextChecked: boolean) => {
    setFeedback(null)

    if (nextChecked && car.status === "archived") {
      setFeedback({
        tone: "error",
        message:
          "Unit yang diarsipkan tidak dapat dijadikan unggulan Hero. Ubah status unit terlebih dahulu.",
      })
      return
    }

    if (nextChecked && !car.isFeatured && featuredCount >= 3) {
      setFeedback({
        tone: "error",
        message:
          "Maksimal 3 unit dapat dijadikan unggulan Hero. Nonaktifkan salah satu unit unggulan terlebih dahulu.",
      })
      return
    }

    setRowPending(car.id, "featured")

    try {
      const updated = await toggleFeaturedCarFn({
        data: {
          id: car.id,
          isFeatured: nextChecked,
          featuredOrder: nextChecked ? car.featuredOrder : null,
        },
      })
      replaceCarInState(updated)
      setFeedback({
        tone: "success",
        message: updated.isFeatured
          ? `"${updated.name}" ditandai sebagai unggulan Hero (Slot #${updated.featuredOrder ?? 1}).`
          : `"${updated.name}" dilepas dari daftar unggulan Hero.`,
      })
      void router.invalidate()
    } catch (error) {
      setFeedback({
        tone: "error",
        message: getErrorMessage(
          error,
          `Gagal memperbarui status unggulan Hero untuk "${car.name}".`
        ),
      })
    } finally {
      setRowPending(car.id, undefined)
    }
  }

  const handleFeaturedOrderChange = async (car: CarUnit, nextOrder: number) => {
    if (!car.isFeatured || car.featuredOrder === nextOrder) return

    setFeedback(null)
    setRowPending(car.id, "featured")

    try {
      const updated = await toggleFeaturedCarFn({
        data: {
          id: car.id,
          isFeatured: true,
          featuredOrder: nextOrder,
        },
      })
      replaceCarInState(updated)
      setFeedback({
        tone: "success",
        message: `Urutan unggulan Hero "${updated.name}" diperbarui ke Slot #${updated.featuredOrder ?? nextOrder}.`,
      })
      void router.invalidate()
    } catch (error) {
      setFeedback({
        tone: "error",
        message: getErrorMessage(
          error,
          `Gagal mengubah urutan unggulan Hero untuk "${car.name}".`
        ),
      })
    } finally {
      setRowPending(car.id, undefined)
    }
  }

  const handleArchiveCar = async (car: CarUnit) => {
    if (car.status === "archived") return

    setFeedback(null)
    setRowPending(car.id, "archive")

    try {
      const updated = await archiveCarFn({
        data: { id: car.id },
      })
      replaceCarInState(updated)
      setFeedback({
        tone: "success",
        message: `Unit "${updated.name}" berhasil diarsipkan dan disembunyikan dari katalog publik.`,
      })
      void router.invalidate()
    } catch (error) {
      setFeedback({
        tone: "error",
        message: getErrorMessage(
          error,
          `Gagal mengarsipkan unit "${car.name}".`
        ),
      })
    } finally {
      setRowPending(car.id, undefined)
    }
  }

  const openDeleteDialog = (car: CarUnit) => {
    setDeleteError(null)
    setDeleteTarget(car)
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget || !isAdmin) return

    const targetId = deleteTarget.id
    const targetName = deleteTarget.name

    setDeleteError(null)
    setIsDeleting(true)
    setRowPending(targetId, "delete")

    try {
      await deleteCarPermanentlyFn({
        data: { id: targetId },
      })
      setCars((prev) => prev.filter((item) => item.id !== targetId))
      setDeleteTarget(null)
      setFeedback({
        tone: "success",
        message: `Unit "${targetName}" beserta seluruh fotonya telah dihapus permanen.`,
      })
      void router.invalidate()
    } catch (error) {
      setDeleteError(
        getErrorMessage(
          error,
          "Gagal menghapus unit secara permanen. Silakan coba lagi."
        )
      )
    } finally {
      setIsDeleting(false)
      setRowPending(targetId, undefined)
    }
  }

  const getOccupiedSlotsForCar = (carId: string): Set<number> => {
    const occupied = new Set<number>()
    for (const item of featuredCars) {
      if (item.id !== carId && item.featuredOrder !== null) {
        occupied.add(item.featuredOrder)
      }
    }
    return occupied
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Inventaris Mobil
        </h1>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex min-h-11 items-center gap-2 border border-border bg-card px-3.5 text-xs font-semibold text-foreground">
            <Star
              className={cn(
                "size-4 shrink-0",
                featuredCount >= 3 ? "fill-primary text-primary" : "text-primary"
              )}
              aria-hidden="true"
            />
            <span>Unggulan Beranda:</span>
            <span className="font-heading text-sm font-bold tabular-nums">
              {featuredCount}/3
            </span>
          </div>

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

      {/* Feedback Banner */}
      {feedback ? (
        <div
          role={feedback.tone === "error" ? "alert" : "status"}
          aria-live="polite"
          className={cn(
            "flex items-start justify-between gap-3 border px-4 py-3 text-sm",
            feedback.tone === "error"
              ? "border-destructive/40 bg-destructive/10 text-[#991B1B]"
              : "border-emerald-800/30 bg-emerald-50 text-emerald-950"
          )}
        >
          <div className="flex min-w-0 items-start gap-2.5 pt-1">
            {feedback.tone === "error" ? (
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
            ) : (
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
            )}
            <p className="font-medium">{feedback.message}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setFeedback(null)}
            aria-label="Tutup notifikasi"
            className="shrink-0"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      {/* Filter Toolbar */}
      <section
        aria-label="Filter dan pencarian inventaris"
        className="border border-border bg-card p-4"
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <label
              htmlFor="inventory-search"
              className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Cari Unit
            </label>
            <div className="relative mt-1.5">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="inventory-search"
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Nama unit, merek, tahun, warna, atau plat..."
                className="pr-11 pl-9"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Hapus kata kunci pencarian"
                  className="absolute top-0 right-0 inline-flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="inventory-status-filter"
              className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Status
            </label>
            <Select
              items={STATUS_FILTER_ITEMS}
              value={statusFilter}
              onValueChange={(value) => {
                if (!value) return
                setStatusFilter(value)
              }}
            >
              <SelectTrigger
                id="inventory-status-filter"
                className="mt-1.5 min-h-11 w-full bg-card px-3 text-sm text-foreground data-[size=default]:h-11"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  Semua Status ({statusCounts.all})
                </SelectItem>
                {STATUS_SELECT_ORDER.map((status) => (
                  <SelectItem key={status} value={status}>
                    {CAR_STATUS_LABELS[status]} ({statusCounts[status]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <label
              htmlFor="inventory-category-filter"
              className="block text-xs font-semibold tracking-wider text-muted-foreground uppercase"
            >
              Kategori
            </label>
            <Select
              items={CATEGORY_FILTER_ITEMS}
              value={categoryFilter}
              onValueChange={(value) => {
                if (!value) return
                setCategoryFilter(value)
              }}
            >
              <SelectTrigger
                id="inventory-category-filter"
                className="mt-1.5 min-h-11 w-full bg-card px-3 text-sm text-foreground data-[size=default]:h-11"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="keluarga">
                  {CATEGORY_LABELS.keluarga}
                </SelectItem>
                <SelectItem value="harian">
                  {CATEGORY_LABELS.harian}
                </SelectItem>
                <SelectItem value="hobi-eropa">
                  {CATEGORY_LABELS["hobi-eropa"]}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end md:col-span-1">
            <Button
              type="button"
              variant="outline"
              size="default"
              disabled={!hasActiveFilters}
              onClick={resetFilters}
              aria-label="Reset semua filter"
              title="Reset semua filter"
              className="w-full px-3"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              <span className="md:sr-only">Reset Filter</span>
            </Button>
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <p className="tabular-nums">
            Menampilkan{" "}
            <span className="font-semibold text-foreground">
              {filteredCars.length}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-foreground">{cars.length}</span>{" "}
            unit
          </p>

          <div className="flex flex-wrap items-center gap-3 tabular-nums">
            <span>
              Siap Jual:{" "}
              <strong className="text-foreground">{statusCounts.ready}</strong>
            </span>
            <span>
              Dibooking:{" "}
              <strong className="text-foreground">{statusCounts.booked}</strong>
            </span>
            <span>
              Terjual:{" "}
              <strong className="text-foreground">{statusCounts.sold}</strong>
            </span>
            <span>
              Draft:{" "}
              <strong className="text-foreground">{statusCounts.draft}</strong>
            </span>
            <span>
              Diarsipkan:{" "}
              <strong className="text-foreground">
                {statusCounts.archived}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* Empty States */}
      {cars.length === 0 ? (
        <section className="flex flex-col items-center justify-center border border-border bg-card px-6 py-14 text-center">
          <div className="flex size-12 items-center justify-center border border-border bg-secondary text-muted-foreground">
            <Car className="size-6" aria-hidden="true" />
          </div>
          <h2 className="mt-4 font-heading text-lg font-bold text-foreground">
            Belum ada unit mobil di inventaris
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Mulai tambahkan stok showroom agar dapat dikelola dan ditayangkan di
            katalog website publik.
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
        </section>
      ) : filteredCars.length === 0 ? (
        <section className="flex flex-col items-center justify-center border border-border bg-card px-6 py-12 text-center">
          <p className="font-heading text-base font-bold text-foreground">
            Tidak ada unit yang cocok dengan filter
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Coba ubah kata kunci pencarian atau pilih kombinasi status dan
            kategori lainnya.
          </p>
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={resetFilters}
            className="mt-4"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            <span>Reset Filter</span>
          </Button>
        </section>
      ) : (
        <>
          {/* Desktop Table */}
          <section
            aria-label="Tabel inventaris mobil"
            className="hidden border border-border bg-card lg:block"
          >
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[30%]">Unit</TableHead>
                  <TableHead>Harga (Cash / Kredit)</TableHead>
                  <TableHead className="w-[12%]">Kelengkapan</TableHead>
                  <TableHead className="w-[15%]">Status</TableHead>
                  <TableHead className="w-[14%]">Unggulan Beranda</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCars.map((car) => {
                  const cover = getCoverImage(car)
                  const completeness = completenessById.get(car.id)
                  const score = completeness?.score ?? 0
                  const pendingAction = pendingById[car.id]
                  const isRowBusy = Boolean(pendingAction)
                  const occupiedSlots = getOccupiedSlotsForCar(car.id)
                  const previewUrl = `${publicSiteOrigin}/mobil/${car.slug}`

                  return (
                    <TableRow key={car.id}>
                      {/* Unit */}
                      <TableCell>
                        <div className="flex min-w-0 items-center gap-3">
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
                          <div className="min-w-0">
                            <p className="truncate font-heading text-sm font-bold text-foreground">
                              {car.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              <span className="tabular-nums">{car.year}</span>{" "}
                              &middot; {getCategoryLabel(car.category)}
                            </p>
                            {car.plateInfo ? (
                              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                                {car.plateInfo}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>

                      {/* Pricing */}
                      <TableCell className="whitespace-nowrap tabular-nums">
                        <p className="font-semibold text-foreground">
                          {formatRupiah(car.cashPrice)}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {car.paymentMode === "cash-only"
                            ? "Khusus Cash"
                            : car.creditPrice
                              ? `Kredit ${formatRupiah(car.creditPrice)}`
                              : "Kredit belum diisi"}
                        </p>
                      </TableCell>

                      {/* Completeness */}
                      <TableCell>
                        <div className="w-24 space-y-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "w-fit tabular-nums",
                              getCompletenessBadgeClass(score)
                            )}
                          >
                            {score}%
                          </Badge>
                          <div
                            aria-hidden="true"
                            className="h-1.5 w-full overflow-hidden border border-border bg-secondary"
                          >
                            <div
                              className={cn(
                                "h-full transition-all",
                                getCompletenessBarClass(score)
                              )}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Inline Status */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Select
                            items={CAR_STATUS_LABELS}
                            value={car.status}
                            disabled={isRowBusy}
                            onValueChange={(value) => {
                              if (!value) return
                              void handleQuickStatusChange(car, value)
                            }}
                          >
                            <SelectTrigger
                              aria-label={`Ubah status ${car.name}`}
                              className="min-h-11 w-36 bg-card px-2.5 text-xs font-semibold text-foreground data-[size=default]:h-11"
                            >
                              <span className="inline-flex min-w-0 items-center gap-2">
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    "inline-block size-2 shrink-0",
                                    STATUS_DOT_CLASS[car.status]
                                  )}
                                />
                                <SelectValue />
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_SELECT_ORDER.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {CAR_STATUS_LABELS[status]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {pendingAction === "status" ? (
                            <Loader2
                              className="size-4 shrink-0 animate-spin text-muted-foreground"
                              aria-label="Menyimpan status"
                            />
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Hero Featured */}
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <Switch
                              checked={car.isFeatured}
                              disabled={isRowBusy || car.status === "archived"}
                              aria-label={`Jadikan ${car.name} unggulan Hero`}
                              onCheckedChange={(checked) => {
                                void handleToggleFeatured(car, checked)
                              }}
                            />

                            {pendingAction === "featured" ? (
                              <Loader2
                                className="size-3.5 shrink-0 animate-spin text-muted-foreground"
                                aria-label="Menyimpan unggulan Hero"
                              />
                            ) : car.isFeatured ? (
                              <Select
                                items={FEATURED_SLOT_LABELS}
                                value={String(car.featuredOrder ?? 1) as "1" | "2" | "3"}
                                disabled={isRowBusy}
                                onValueChange={(value) => {
                                  if (!value) return
                                  void handleFeaturedOrderChange(
                                    car,
                                    Number(value)
                                  )
                                }}
                              >
                                <SelectTrigger
                                  aria-label={`Urutan unggulan Hero ${car.name}`}
                                  className="min-h-11 w-24 bg-card px-2 text-xs font-semibold tabular-nums data-[size=default]:h-11"
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {FEATURED_SLOT_OPTIONS.map((slot) => {
                                    const slotNumber = Number(slot)
                                    const isOccupied =
                                      occupiedSlots.has(slotNumber)
                                    return (
                                      <SelectItem
                                        key={slot}
                                        value={slot}
                                        disabled={isOccupied}
                                      >
                                        {isOccupied
                                          ? `Slot #${slot} (Terpakai)`
                                          : `Slot #${slot}`}
                                      </SelectItem>
                                    )
                                  })}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                {car.status === "archived"
                                  ? "Arsip"
                                  : featuredCount >= 3
                                    ? "Penuh"
                                    : "Nonaktif"}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <a
                            href={previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Pratinjau ${car.name} di website publik`}
                            title="Pratinjau di website publik"
                            className={cn(
                              buttonVariants({ variant: "outline", size: "icon" }),
                              "no-underline"
                            )}
                          >
                            <ExternalLink
                              className="size-4"
                              aria-hidden="true"
                            />
                          </a>

                          <Link
                            to="/dash/cars/$carId"
                            params={{ carId: car.id }}
                            aria-label={`Edit ${car.name}`}
                            title="Edit unit"
                            className={cn(
                              buttonVariants({ variant: "outline", size: "default" }),
                              "px-3 text-xs no-underline"
                            )}
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </Link>

                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={isRowBusy || car.status === "archived"}
                            onClick={() => void handleArchiveCar(car)}
                            aria-label={`Arsipkan ${car.name}`}
                            title={
                              car.status === "archived"
                                ? "Unit sudah diarsipkan"
                                : "Arsipkan unit"
                            }
                          >
                            {pendingAction === "archive" ? (
                              <Loader2
                                className="size-4 animate-spin"
                                aria-hidden="true"
                              />
                            ) : (
                              <Archive className="size-4" aria-hidden="true" />
                            )}
                          </Button>

                          {isAdmin ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={isRowBusy}
                              onClick={() => openDeleteDialog(car)}
                              aria-label={`Hapus permanen ${car.name}`}
                              title="Hapus permanen (Admin)"
                              className="border-destructive/40 text-[#991B1B] hover:border-destructive hover:bg-destructive hover:text-primary-foreground"
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </section>

          {/* Mobile Card Stack */}
          <section
            aria-label="Daftar inventaris mobil"
            className="space-y-3 lg:hidden"
          >
            {filteredCars.map((car) => {
              const cover = getCoverImage(car)
              const completeness = completenessById.get(car.id)
              const score = completeness?.score ?? 0
              const pendingAction = pendingById[car.id]
              const isRowBusy = Boolean(pendingAction)
              const occupiedSlots = getOccupiedSlotsForCar(car.id)
              const previewUrl = `${publicSiteOrigin}/mobil/${car.slug}`

              return (
                <article
                  key={car.id}
                  className="min-w-0 border border-border bg-card p-4"
                >
                  {/* Top row: thumb + identity */}
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="relative h-16 w-24 shrink-0 overflow-hidden border border-border bg-secondary">
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
                      <div className="flex flex-wrap items-center gap-1.5">
                        <CarStatusBadge status={car.status} />
                        <Badge
                          variant="outline"
                          className={cn(
                            "tabular-nums",
                            getCompletenessBadgeClass(score)
                          )}
                        >
                          {score}%
                        </Badge>
                      </div>
                      <h2 className="mt-1.5 truncate font-heading text-base font-bold text-foreground">
                        {car.name}
                      </h2>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        <span className="tabular-nums">{car.year}</span>{" "}
                        &middot; {getCategoryLabel(car.category)}
                      </p>
                    </div>
                  </div>

                  {/* Prices */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 border-y border-border py-3 text-xs tabular-nums">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Harga Cash
                      </p>
                      <p className="mt-0.5 truncate text-sm font-bold text-foreground">
                        {formatRupiah(car.cashPrice)}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                        Harga Kredit
                      </p>
                      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                        {car.paymentMode === "cash-only"
                          ? "Khusus Cash"
                          : car.creditPrice
                            ? formatRupiah(car.creditPrice)
                            : "Belum diisi"}
                      </p>
                    </div>
                  </div>

                  {/* Quick controls: Status + Hero Featured */}
                  <div className="mt-3.5 space-y-3">
                    <div className="min-w-0">
                      <label
                        htmlFor={`mobile-status-${car.id}`}
                        className="block text-[11px] font-semibold tracking-wider text-muted-foreground uppercase"
                      >
                        Status Stok
                      </label>
                      <div className="mt-1 flex items-center gap-2">
                        <Select
                          items={CAR_STATUS_LABELS}
                          value={car.status}
                          disabled={isRowBusy}
                          onValueChange={(value) => {
                            if (!value) return
                            void handleQuickStatusChange(car, value)
                          }}
                        >
                          <SelectTrigger
                            id={`mobile-status-${car.id}`}
                            className="min-h-11 w-full bg-card px-3 text-sm font-medium text-foreground data-[size=default]:h-11"
                          >
                            <span className="inline-flex min-w-0 items-center gap-2">
                              <span
                                aria-hidden="true"
                                className={cn(
                                  "inline-block size-2 shrink-0",
                                  STATUS_DOT_CLASS[car.status]
                                )}
                              />
                              <SelectValue />
                            </span>
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_SELECT_ORDER.map((status) => (
                              <SelectItem key={status} value={status}>
                                {CAR_STATUS_LABELS[status]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {pendingAction === "status" ? (
                          <Loader2
                            className="size-4 shrink-0 animate-spin text-muted-foreground"
                            aria-label="Menyimpan status"
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 border border-border bg-secondary/35 px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <Switch
                          checked={car.isFeatured}
                          disabled={isRowBusy || car.status === "archived"}
                          aria-label={`Jadikan ${car.name} unggulan Hero`}
                          onCheckedChange={(checked) => {
                            void handleToggleFeatured(car, checked)
                          }}
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground">
                            Unggulan Beranda
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {car.status === "archived"
                              ? "Tidak tersedia untuk arsip"
                              : car.isFeatured
                                ? `Aktif di Slot #${car.featuredOrder ?? 1}`
                                : featuredCount >= 3
                                  ? "Slot penuh (3/3)"
                                  : "Tampilkan di beranda"}
                          </p>
                        </div>
                      </div>

                      {car.isFeatured ? (
                        <Select
                          items={FEATURED_SLOT_LABELS}
                          value={String(car.featuredOrder ?? 1) as "1" | "2" | "3"}
                          disabled={isRowBusy}
                          onValueChange={(value) => {
                            if (!value) return
                            void handleFeaturedOrderChange(car, Number(value))
                          }}
                        >
                          <SelectTrigger
                            aria-label={`Urutan unggulan Hero ${car.name}`}
                            className="min-h-11 w-28 bg-card px-2.5 text-xs font-semibold tabular-nums data-[size=default]:h-11"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FEATURED_SLOT_OPTIONS.map((slot) => {
                              const slotNumber = Number(slot)
                              const isOccupied = occupiedSlots.has(slotNumber)
                              return (
                                <SelectItem
                                  key={slot}
                                  value={slot}
                                  disabled={isOccupied}
                                >
                                  {isOccupied
                                    ? `Slot #${slot} (Terpakai)`
                                    : `Slot #${slot}`}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      ) : null}
                    </div>
                  </div>

                  {/* Mobile Actions */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Link
                      to="/dash/cars/$carId"
                      params={{ carId: car.id }}
                      className={cn(
                        buttonVariants({ variant: "default", size: "default" }),
                        "w-full no-underline"
                      )}
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      <span>Edit Unit</span>
                    </Link>

                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        buttonVariants({ variant: "outline", size: "default" }),
                        "w-full no-underline"
                      )}
                    >
                      <ExternalLink className="size-4" aria-hidden="true" />
                      <span>Pratinjau</span>
                    </a>

                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      disabled={isRowBusy || car.status === "archived"}
                      onClick={() => void handleArchiveCar(car)}
                      className={cn("w-full", !isAdmin && "col-span-2")}
                    >
                      {pendingAction === "archive" ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Archive className="size-4" aria-hidden="true" />
                      )}
                      <span>
                        {car.status === "archived" ? "Diarsipkan" : "Arsipkan"}
                      </span>
                    </Button>

                    {isAdmin ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        disabled={isRowBusy}
                        onClick={() => openDeleteDialog(car)}
                        className="w-full border-destructive/40 text-[#991B1B] hover:border-destructive hover:bg-destructive hover:text-primary-foreground"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                        <span>Hapus</span>
                      </Button>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </section>
        </>
      )}

      {/* Admin-only Permanent Delete Confirmation Dialog */}
      {isAdmin ? (
        <Dialog
          open={Boolean(deleteTarget)}
          onOpenChange={(open) => {
            if (!open && !isDeleting) {
              setDeleteTarget(null)
              setDeleteError(null)
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hapus Unit Secara Permanen?</DialogTitle>
              <DialogDescription>
                Unit, simulasi kredit, dan semua fotonya akan dihapus permanen.
                Tindakan ini tidak dapat dibatalkan.
              </DialogDescription>
            </DialogHeader>

            {deleteTarget ? (
              <div className="mt-4 border border-border bg-secondary/45 p-3.5 text-sm">
                <p className="font-heading font-bold text-foreground">
                  {deleteTarget.name}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                  {deleteTarget.year} &middot;{" "}
                  {getCategoryLabel(deleteTarget.category)} &middot;{" "}
                  {formatRupiah(deleteTarget.cashPrice)}
                </p>
              </div>
            ) : null}

            {deleteError ? (
              <p
                role="alert"
                className="mt-3 border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs font-medium text-[#991B1B]"
              >
                {deleteError}
              </p>
            ) : null}

            <DialogFooter>
              <DialogClose
                disabled={isDeleting}
                className={cn(
                  buttonVariants({ variant: "outline", size: "default" })
                )}
              >
                Batal
              </DialogClose>
              <Button
                type="button"
                variant="destructive"
                size="default"
                disabled={isDeleting}
                onClick={() => void handleConfirmDelete()}
              >
                {isDeleting ? (
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Trash2 className="size-4" aria-hidden="true" />
                )}
                <span>
                  {isDeleting ? "Menghapus..." : "Ya, Hapus Permanen"}
                </span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  )
}
