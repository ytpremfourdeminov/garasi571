import * as React from "react"
import { Link } from "@tanstack/react-router"
import { ArrowLeftRight, ArrowRight, MessageCircle } from "lucide-react"
import {
  buildCarInquiryMessage,
  formatRupiah,
  formatShortJuta,
} from "@/lib/domain/formatters"
import type { CarUnit } from "@/lib/domain/types"
import { Button, buttonVariants } from "@/components/ui/button"
import { useWhatsAppDialog } from "@/components/whatsapp-dialog"
import { cn } from "cn"

export interface CreditSectionProps {
  cars: readonly CarUnit[]
}

const DEFAULT_SELECTED_SLUG = "suzuki-all-new-ertiga-gx-hybrid-2025"

function buildCreditSchemeSummary(car: CarUnit): string {
  const firstSim = car.creditSimulations.at(0)
  if (!firstSim) {
    return "Simulasi Kredit"
  }
  const providerSuffix = firstSim.provider ? ` ${firstSim.provider}` : ""
  return `Simulasi Kredit${providerSuffix}, DP ${formatShortJuta(firstSim.dp)}, ${firstSim.installmentLabel}/bulan x ${firstSim.tenorYears} tahun`
}

export function CreditSection({ cars }: CreditSectionProps) {
  const { openWhatsAppDialog } = useWhatsAppDialog()

  const creditEligibleCars = React.useMemo(
    () => cars.filter((car) => car.paymentMode === "cash-credit"),
    [cars]
  )

  const lowestDp = React.useMemo(() => {
    const allDps = creditEligibleCars.flatMap((car) =>
      car.creditSimulations.map((sim) => sim.dp)
    )
    if (allDps.length === 0) {
      return 0
    }
    return Math.min(...allDps)
  }, [creditEligibleCars])

  const initialSlug = creditEligibleCars.some(
    (car) => car.slug === DEFAULT_SELECTED_SLUG
  )
    ? DEFAULT_SELECTED_SLUG
    : (creditEligibleCars.at(0)?.slug ?? "")

  const [selectedSlug, setSelectedSlug] = React.useState(initialSlug)
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([])

  const selectedCar =
    creditEligibleCars.find((car) => car.slug === selectedSlug) ??
    creditEligibleCars.at(0)

  const handleTabKeyDown = (
    event: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (creditEligibleCars.length === 0) return

    let nextIndex: number | null = null
    if (event.key === "ArrowRight") {
      nextIndex = (index + 1) % creditEligibleCars.length
    } else if (event.key === "ArrowLeft") {
      nextIndex =
        (index - 1 + creditEligibleCars.length) % creditEligibleCars.length
    } else if (event.key === "Home") {
      nextIndex = 0
    } else if (event.key === "End") {
      nextIndex = creditEligibleCars.length - 1
    }

    if (nextIndex !== null) {
      event.preventDefault()
      const nextCar = creditEligibleCars.at(nextIndex)
      if (nextCar) {
        setSelectedSlug(nextCar.slug)
        tabRefs.current[nextIndex]?.focus()
      }
    }
  }

  return (
    <section
      id="simulasi"
      aria-labelledby="credit-heading"
      className="scroll-mt-20 border-y border-border bg-secondary"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="min-w-0 lg:col-span-5">
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
                02 / Pembiayaan
              </span>
            </div>

            <h2
              id="credit-heading"
              className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Cash, Kredit, dan Tukar Tambah
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Harga cash dan simulasi leasing ditampilkan sesuai data
              masing-masing unit.
            </p>

            <div className="mt-6 space-y-4">
              <div className="border border-border bg-card p-5">
                <p className="font-heading text-base font-semibold text-foreground">
                  Pembelian Kredit &amp; Tukar Tambah
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {lowestDp > 0 ? (
                    <>
                      Didukung mitra leasing seperti BCA Finance dan Hana
                      Finance dengan DP mulai{" "}
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatRupiah(lowestDp)}
                      </span>
                      . Opsi tukar tambah berlaku pada unit tertentu.
                    </>
                  ) : (
                    <>
                      Didukung mitra leasing seperti BCA Finance dan Hana
                      Finance dengan pilihan DP dan tenor fleksibel. Opsi tukar
                      tambah berlaku pada unit tertentu.
                    </>
                  )}
                </p>
              </div>

              <div className="border border-border bg-card p-5">
                <p className="font-heading text-base font-semibold text-foreground">
                  Unit Koleksi Khusus Cash
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Beberapa unit koleksi ditawarkan khusus pembelian tunai dengan
                  harga spesial.
                </p>
              </div>
            </div>

            <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
              Butuh penyesuaian DP, tenor, atau taksiran tukar tambah?
              Diskusikan langsung dengan tim kami.
            </p>
          </div>

          <div className="min-w-0 lg:col-span-7">
            {selectedCar ? (
              <>
                <p
                  id="credit-selector-label"
                  className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
                >
                  Pilih Unit
                </p>

                <div
                  role="tablist"
                  aria-labelledby="credit-selector-label"
                  className="mt-2.5 flex flex-wrap gap-2"
                >
                  {creditEligibleCars.map((car, index) => {
                    const isSelected = car.slug === selectedCar.slug
                    return (
                      <button
                        key={car.slug}
                        ref={(node) => {
                          tabRefs.current[index] = node
                        }}
                        type="button"
                        role="tab"
                        id={`credit-tab-${car.slug}`}
                        aria-selected={isSelected}
                        aria-controls="credit-simulation-panel"
                        tabIndex={isSelected ? 0 : -1}
                        onClick={() => setSelectedSlug(car.slug)}
                        onKeyDown={(event) => handleTabKeyDown(event, index)}
                        className={cn(
                          "inline-flex min-h-11 items-center rounded-none border px-3 py-2 text-left text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-input bg-card text-foreground hover:bg-background"
                        )}
                      >
                        <span>
                          {car.shortName}{" "}
                          <span
                            className={cn(
                              "tabular-nums",
                              isSelected
                                ? "text-primary-foreground/85"
                                : "text-muted-foreground"
                            )}
                          >
                            ({car.year})
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div
                  id="credit-simulation-panel"
                  role="tabpanel"
                  aria-labelledby={`credit-tab-${selectedCar.slug}`}
                  className="mt-4 border border-border bg-card p-5 sm:p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="aspect-[4/3] w-full shrink-0 overflow-hidden border border-border bg-secondary sm:w-44">
                      {selectedCar.images.at(0) ? (
                        <img
                          src={selectedCar.images[0].src}
                          width={selectedCar.images[0].width}
                          height={selectedCar.images[0].height}
                          alt={selectedCar.images[0].alt}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs text-muted-foreground">
                          Foto belum tersedia
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        {selectedCar.categoryLabel} /{" "}
                        <span className="tabular-nums">{selectedCar.year}</span>{" "}
                        / {selectedCar.transmission}
                      </p>

                      <h3 className="mt-1 font-heading text-xl font-bold tracking-tight text-foreground">
                        {selectedCar.name}
                      </h3>

                      {selectedCar.tradeInAvailable ? (
                        <span className="mt-2 inline-flex items-center gap-1.5 border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
                          <ArrowLeftRight
                            className="size-3.5 text-primary"
                            aria-hidden="true"
                          />
                          <span>Bisa Tukar Tambah</span>
                        </span>
                      ) : null}

                      <div className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2 tabular-nums">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Harga Cash
                          </p>
                          <p className="text-base font-semibold text-foreground">
                            {formatRupiah(selectedCar.cashPrice)}
                          </p>
                        </div>

                        {selectedCar.creditPrice !== null ? (
                          <div>
                            <p className="text-xs font-semibold text-primary">
                              Harga Kredit
                              {selectedCar.creditPriceNote
                                ? ` (${selectedCar.creditPriceNote})`
                                : ""}
                            </p>
                            <p className="font-heading text-lg font-bold text-foreground">
                              {formatRupiah(selectedCar.creditPrice)}
                            </p>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 border-t border-border pt-5">
                    <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Rincian Simulasi Leasing
                    </p>

                    {selectedCar.creditSimulations.length > 0 ? (
                      <div className="mt-3 space-y-3">
                        {selectedCar.creditSimulations.map((sim) => (
                          <div
                            key={`${selectedCar.slug}-${sim.label}-${sim.tenorYears}`}
                            className="border border-border bg-secondary p-4"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-semibold text-foreground">
                                {sim.label}
                              </p>
                              {sim.provider ? (
                                <span className="border border-border bg-card px-2 py-0.5 text-xs font-medium text-foreground">
                                  {sim.provider}
                                </span>
                              ) : null}
                            </div>

                            <dl className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-3 tabular-nums">
                              <div>
                                <dt className="text-xs text-muted-foreground">
                                  Uang Muka (DP)
                                </dt>
                                <dd className="mt-0.5 text-sm font-bold text-foreground">
                                  {formatRupiah(sim.dp)}
                                </dd>
                              </div>

                              <div>
                                <dt className="text-xs text-muted-foreground">
                                  Angsuran
                                </dt>
                                <dd className="mt-0.5 text-sm font-bold text-primary">
                                  {sim.installmentLabel} / bulan
                                </dd>
                              </div>

                              <div>
                                <dt className="text-xs text-muted-foreground">
                                  Tenor
                                </dt>
                                <dd className="mt-0.5 text-sm font-bold text-foreground">
                                  {sim.tenorYears} tahun
                                </dd>
                              </div>
                            </dl>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 border border-border bg-secondary p-4 text-sm text-muted-foreground">
                        Rincian DP dan angsuran tersedia sesuai pengajuan.
                        Hubungi tim sales untuk simulasi leasing terbaru.
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
                    <Button
                      type="button"
                      className="w-full sm:w-auto"
                      onClick={() =>
                        openWhatsAppDialog({
                          title: `Simulasi Kredit ${selectedCar.shortName}`,
                          description:
                            "Hubungi tim sales Garasi 571 untuk menanyakan rincian pengajuan kredit atau opsi DP lain.",
                          message: buildCarInquiryMessage(
                            selectedCar.name,
                            selectedCar.year,
                            buildCreditSchemeSummary(selectedCar)
                          ),
                        })
                      }
                    >
                      <MessageCircle className="size-4" aria-hidden="true" />
                      <span>Tanya Simulasi Unit Ini</span>
                    </Button>

                    <Link
                      to="/mobil/$slug"
                      params={{ slug: selectedCar.slug }}
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full no-underline sm:w-auto"
                      )}
                    >
                      <span>Lihat Unit Lengkap</span>
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <div className="border border-border bg-card p-6">
                <h3 className="font-heading text-lg font-semibold text-foreground">
                  Simulasi Kredit Tersedia via Konsultasi Langsung
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Belum ada daftar simulasi kredit aktif di katalog saat ini.
                  Hubungi tim sales kami untuk perhitungan DP dan angsuran
                  sesuai unit yang Anda minati.
                </p>
                <Button
                  type="button"
                  className="mt-4"
                  onClick={() =>
                    openWhatsAppDialog({
                      title: "Konsultasi Simulasi Kredit",
                      description:
                        "Diskusikan opsi DP, tenor, dan mitra leasing langsung bersama tim sales Garasi 571.",
                      message:
                        "Halo Garasi 571, saya ingin menanyakan simulasi kredit dan opsi tukar tambah untuk unit yang tersedia.",
                    })
                  }
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  <span>Tanya Simulasi via WhatsApp</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
