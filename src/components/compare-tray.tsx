import { Link } from "@tanstack/react-router"
import { ArrowRight, GitCompareArrows, MessageCircle, Trash2, X } from "lucide-react"
import {
  buildCarInquiryMessage,
  formatRupiah,
  formatShortJuta,
} from "@/lib/domain/formatters"
import { useCompare } from "@/components/compare-context"
import { useWhatsAppDialog } from "@/components/whatsapp-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { TruncatedTooltip } from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "cn"

export function CompareTray() {
  const {
    selectedCars,
    removeCompare,
    clearCompare,
    isDialogOpen,
    setDialogOpen,
    announcement,
  } = useCompare()
  const { openWhatsAppDialog } = useWhatsAppDialog()

  const isLimitWarning = announcement.startsWith("Maksimal 3")

  const gridColsClass =
    selectedCars.length === 1
      ? "grid-cols-1 max-w-md"
      : selectedCars.length === 2
        ? "grid-cols-1 md:grid-cols-2"
        : "grid-cols-1 md:grid-cols-3"

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {announcement}
      </div>

      {selectedCars.length > 0 ? (
        <aside
          aria-label="Panel perbandingan unit terpilih"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-[#2E2B28] bg-[#161514] text-[#FAF9F7] shadow-2xl"
        >
          <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
            {isLimitWarning ? (
              <p className="mb-2 text-sm font-medium text-[#F87171]">
                {announcement}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-1 inline-flex items-center gap-1.5 text-sm font-semibold tracking-wider text-[#C7C2BC] uppercase">
                  <GitCompareArrows
                    className="size-4 text-[#F87171]"
                    aria-hidden="true"
                  />
                  <span>Bandingkan ({selectedCars.length}/3)</span>
                </span>

                {selectedCars.map((car) => {
                  const thumb = car.images.at(0)
                  return (
                    <div
                      key={car.slug}
                      className="flex items-center gap-2 border border-[#34302C] bg-[#211F1D] pl-1.5 text-sm"
                    >
                      {thumb ? (
                        <img
                          src={thumb.src}
                          alt={car.shortName}
                          width={thumb.width}
                          height={thumb.height}
                          className="h-8 w-11 shrink-0 object-cover"
                        />
                      ) : null}
                      <div className="min-w-0 py-1 pr-1">
                        <TruncatedTooltip
                          content={car.shortName}
                          render={
                            <p className="max-w-36 truncate font-medium text-[#FAF9F7]" />
                          }
                        >
                          {car.shortName}
                        </TruncatedTooltip>
                        <p className="text-sm text-[#C7C2BC] tabular-nums">
                          {car.year}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCompare(car.slug)}
                        aria-label={`Hapus ${car.shortName} dari perbandingan`}
                        className="inline-flex size-11 shrink-0 items-center justify-center border-l border-[#34302C] text-[#C7C2BC] transition-colors hover:bg-[#2B2825] hover:text-[#FAF9F7] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#FAF9F7]"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearCompare}
                  className="border border-[#34302C] bg-transparent text-[#C7C2BC] hover:bg-[#211F1D] hover:text-[#FAF9F7] focus-visible:outline-[#FAF9F7]"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  <span>Kosongkan</span>
                </Button>

                <Button
                  type="button"
                  variant="default"
                  onClick={() => setDialogOpen(true)}
                  className="focus-visible:outline-[#FAF9F7]"
                >
                  <GitCompareArrows className="size-4" aria-hidden="true" />
                  <span>Bandingkan ({selectedCars.length})</span>
                </Button>
              </div>
            </div>
          </div>
        </aside>
      ) : null}

      <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-5xl"
          closeLabel="Tutup perbandingan unit"
        >
          <DialogHeader>
            <DialogTitle>
              Perbandingan Unit ({selectedCars.length}/3)
            </DialogTitle>
          </DialogHeader>

          {selectedCars.length === 1 ? (
            <p className="mt-3 border border-border bg-secondary px-3.5 py-2.5 text-sm text-foreground">
              Pilih hingga 2 unit tambahan di katalog untuk membandingkan spesifikasi secara berdampingan.
            </p>
          ) : null}

          <div className={cn("mt-5 grid gap-4", gridColsClass)}>
            {selectedCars.map((car) => {
              const cover = car.images.at(0)
              const primarySim = car.creditSimulations.at(0)

              return (
                <article
                  key={car.slug}
                  className="flex flex-col border border-border bg-card"
                >
                  {cover ? (
                    <div className="aspect-[4/3] w-full overflow-hidden border-b border-border bg-secondary">
                      <img
                        src={cover.src}
                        alt={cover.alt}
                        width={cover.width}
                        height={cover.height}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          {car.categoryLabel}, {car.year}
                        </p>
                        <h3 className="mt-0.5 font-heading text-base font-semibold leading-snug text-foreground">
                          {car.name}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeCompare(car.slug)}
                        aria-label={`Hapus ${car.shortName} dari perbandingan`}
                        className="inline-flex size-11 shrink-0 items-center justify-center border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 border-y border-border py-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase">
                          Harga Cash
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-foreground tabular-nums">
                          {formatRupiah(car.cashPrice)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground uppercase">
                          Harga Kredit
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-primary tabular-nums">
                          {car.creditPrice !== null
                            ? formatRupiah(car.creditPrice)
                            : "Khusus Cash"}
                        </p>
                        {car.creditPriceNote ? (
                          <p className="text-sm text-muted-foreground">
                            {car.creditPriceNote}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="border-b border-border py-3">
                      <p className="text-sm font-medium text-muted-foreground uppercase">
                        Simulasi Resmi
                      </p>
                      {primarySim ? (
                        <p className="mt-1 text-sm font-medium text-foreground tabular-nums">
                          DP {formatShortJuta(primarySim.dp)},{" "}
                          {primarySim.installmentLabel} x {primarySim.tenorYears}{" "}
                          tahun
                          {primarySim.provider ? ` (${primarySim.provider})` : ""}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Pembelian tunai (Cash Only)
                        </p>
                      )}
                    </div>

                    <dl className="divide-y divide-border text-sm">
                      <div className="flex items-baseline justify-between gap-3 py-2">
                        <dt className="text-muted-foreground">Transmisi</dt>
                        <dd className="text-right font-medium text-foreground">
                          {car.transmission}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3 py-2">
                        <dt className="text-muted-foreground">Warna</dt>
                        <dd className="text-right font-medium text-foreground">
                          {car.color}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3 py-2">
                        <dt className="text-muted-foreground">Kilometer</dt>
                        <dd className="text-right font-medium text-foreground tabular-nums">
                          {car.mileageLabel}
                        </dd>
                      </div>
                      <div className="flex items-baseline justify-between gap-3 py-2">
                        <dt className="text-muted-foreground">Pajak / Nopol</dt>
                        <dd className="text-right font-medium text-foreground">
                          {car.plateInfo}
                        </dd>
                      </div>
                    </dl>

                    {car.highlights.length > 0 ? (
                      <div className="mt-3 border-t border-border pt-3">
                        <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                          Kondisi Unggulan
                        </p>
                        <ul className="mt-1.5 space-y-1 text-sm leading-relaxed text-foreground">
                          {car.highlights.slice(0, 3).map((item) => (
                            <li key={item} className="flex items-start gap-2">
                              <span
                                aria-hidden="true"
                                className="mt-1.5 size-1.5 shrink-0 bg-primary"
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="mt-auto flex flex-col gap-2 pt-4">
                      <Link
                        to="/mobil/$slug"
                        params={{ slug: car.slug }}
                        onClick={() => setDialogOpen(false)}
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "w-full justify-between no-underline"
                        )}
                      >
                        <span>Lihat Detail</span>
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>

                      <Button
                        type="button"
                        variant="default"
                        className="w-full"
                        onClick={() =>
                          openWhatsAppDialog({
                            title: `Tanya ${car.shortName}`,
                            description:
                              "Pilih tim sales Garasi 571 untuk menanyakan unit ini.",
                            message: buildCarInquiryMessage(car.name, car.year),
                          })
                        }
                      >
                        <MessageCircle className="size-4" aria-hidden="true" />
                        <span>Tanya Unit Ini</span>
                      </Button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
