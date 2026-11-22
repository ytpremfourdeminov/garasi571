import * as React from "react"
import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import {
  ArrowLeft,
  Check,
  Clock,
  ExternalLink,
  GitCompareArrows,
  Link2,
  MapPin,
  MessageCircle,
} from "lucide-react"
import { cn } from "cn"
import {
  formatRupiah,
  formatShortJuta,
  getCarBySlug,
  getSimilarCars,
} from "@/data/cars"
import {
  SHOWROOM,
  buildCarInquiryMessage,
  buildWhatsAppUrl,
} from "@/data/showroom"
import {
  buildBreadcrumbJsonLd,
  buildCanonicalLink,
  buildCarProductJsonLd,
  buildSocialMeta,
  serializeJsonLd,
} from "@/lib/seo"
import { CarGallery } from "@/components/car-gallery"
import { CarAnswerSummary } from "@/components/car-answer-summary"
import { CarCard } from "@/components/car-card"
import { useCompare } from "@/components/compare-context"
import { useWhatsAppDialog } from "@/components/whatsapp-dialog"
import { Button, buttonVariants } from "@/components/ui/button"

export const Route = createFileRoute("/mobil/$slug")({
  loader: ({ params }) => {
    const car = getCarBySlug(params.slug)
    if (!car) {
      throw notFound()
    }
    return { car }
  },
  head: ({ loaderData }) => {
    if (!loaderData?.car) {
      return {
        meta: [{ title: "Unit Tidak Ditemukan | Garasi 571 Surakarta" }],
      }
    }

    const { car } = loaderData
    const priceText =
      car.creditPrice !== null
        ? `Harga cash ${formatRupiah(car.cashPrice)} dan harga kredit ${formatRupiah(car.creditPrice)}.`
        : `Special Price cash ${formatRupiah(car.cashPrice)}.`
    const title = `${car.name} (${car.year}) | Garasi 571 Surakarta`
    const description = `${car.name} tahun ${car.year}, ${car.transmission}, warna ${car.color}, ${car.location}. ${priceText} Inspeksi langsung di showroom Garasi 571 Surakarta.`
    const coverImage = car.images.at(0)
    const carPath = `/mobil/${car.slug}`

    return {
      links: [buildCanonicalLink(carPath)],
      meta: [
        {
          title,
        },
        {
          name: "description",
          content: description,
        },
        ...buildSocialMeta({
          title,
          description,
          path: carPath,
          imagePath: coverImage?.src,
          imageWidth: coverImage?.width,
          imageHeight: coverImage?.height,
          imageAlt: coverImage?.alt,
          type: "product",
        }),
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: serializeJsonLd(buildCarProductJsonLd(car)),
        },
        {
          type: "application/ld+json",
          children: serializeJsonLd(
            buildBreadcrumbJsonLd([
              { name: "Beranda", path: "/" },
              { name: car.categoryLabel, path: `/?kategori=${car.category}` },
              { name: car.shortName, path: carPath },
            ]),
          ),
        },
      ],
    }
  },
  pendingComponent: CarDetailPending,
  notFoundComponent: CarDetailNotFound,
  component: CarDetailPage,
})

function CarDetailPending() {
  return (
    <section
      role="status"
      aria-live="polite"
      className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"
    >
      <p className="text-sm font-medium text-muted-foreground">
        Memuat detail unit...
      </p>
      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-7">
          <div className="aspect-[4/3] w-full animate-pulse border border-border bg-secondary" />
          <div className="flex gap-2">
            <div className="aspect-[4/3] w-20 animate-pulse border border-border bg-secondary sm:w-24" />
            <div className="aspect-[4/3] w-20 animate-pulse border border-border bg-secondary sm:w-24" />
            <div className="aspect-[4/3] w-20 animate-pulse border border-border bg-secondary sm:w-24" />
          </div>
        </div>
        <div className="h-96 animate-pulse border border-border bg-secondary lg:col-span-5" />
      </div>
    </section>
  )
}

function CarDetailNotFound() {
  const { openWhatsAppDialog } = useWhatsAppDialog()

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="border border-border bg-card p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">
          Unit Tidak Ditemukan
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Unit yang Anda Cari Belum Tersedia
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Unit mungkin sudah terjual atau tautan halaman tidak sesuai. Silakan
          lihat stok aktif di katalog atau tanyakan rekomendasi unit serupa ke
          tim sales Garasi 571.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/"
            hash="stok"
            className={cn(
              buttonVariants({ variant: "default" }),
              "no-underline",
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Kembali ke Katalog</span>
          </Link>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              openWhatsAppDialog({
                title: "Tanya Stok Tersedia",
                description:
                  "Hubungi tim sales Garasi 571 Surakarta untuk menanyakan unit yang siap cek di showroom.",
                message:
                  "Halo Garasi 571, unit yang saya buka tidak ditemukan di katalog. Boleh info stok mobil bekas yang saat ini ready di Surakarta?",
              })
            }
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            <span>Hubungi WhatsApp</span>
          </Button>
        </div>
      </div>
    </section>
  )
}

function CarDetailPage() {
  const { car } = Route.useLoaderData()
  const { isSelected, toggleCompare } = useCompare()

  const creditPrice =
    car.paymentMode === "cash-credit" ? car.creditPrice : null
  const supportsCredit = creditPrice !== null
  const [selectedScheme, setSelectedScheme] = React.useState<"cash" | "credit">(
    "cash",
  )
  const [copiedLink, setCopiedLink] = React.useState(false)
  const [copyAnnouncement, setCopyAnnouncement] = React.useState("")
  const copyTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    setSelectedScheme("cash")
    setCopiedLink(false)
    setCopyAnnouncement("")
  }, [car.slug])

  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const activeSchemeLabel = supportsCredit
    ? selectedScheme === "credit"
      ? "Skema Kredit"
      : "Skema Cash"
    : "Special Price Cash"

  const inquiryMessage = buildCarInquiryMessage(
    car.name,
    car.year,
    activeSchemeLabel,
  )

  const [farrel, abbad] = SHOWROOM.sales
  const compared = isSelected(car.slug)
  const similarCars = React.useMemo(() => getSimilarCars(car, 3), [car])

  const specs = [
    { label: "Tahun", value: car.year },
    { label: "Warna", value: car.color },
    { label: "Transmisi", value: car.transmission },
    { label: "Kilometer", value: car.mileageLabel },
    { label: "Nomor Polisi", value: car.plateInfo },
    { label: "Lokasi", value: car.location },
    { label: "Kategori", value: car.categoryLabel },
    {
      label: "Tukar Tambah",
      value: car.tradeInAvailable
        ? "Bisa tukar tambah"
        : "Konfirmasi via WhatsApp",
    },
  ]

  const handleCopyLink = React.useCallback(async () => {
    if (typeof window === "undefined") return

    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedLink(true)
      setCopyAnnouncement(`Link unit ${car.shortName} berhasil disalin.`)

      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current)
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopiedLink(false)
      }, 2500)
    } catch {
      setCopyAnnouncement(
        "Tidak dapat menyalin link otomatis. Salin alamat halaman dari bilah browser.",
      )
    }
  }, [car.shortName])

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-border pb-4 text-sm text-muted-foreground"
      >
        <Link
          to="/"
          hash="stok"
          className="inline-flex min-h-11 items-center gap-1.5 font-medium text-foreground no-underline transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <span>Kembali ke Katalog</span>
        </Link>
        <span aria-hidden="true" className="text-border">
          /
        </span>
        <Link
          to="/"
          search={{ kategori: car.category }}
          hash="stok"
          className="inline-flex min-h-11 items-center text-muted-foreground no-underline transition-colors hover:text-primary"
        >
          {car.categoryLabel}
        </Link>
        <span aria-hidden="true" className="text-border">
          /
        </span>
        <span
          aria-current="page"
          className="font-medium text-foreground"
        >
          {car.shortName}
        </span>
      </nav>

      <header className="mt-6 space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-wider uppercase">
          <span className="border border-border bg-secondary px-2.5 py-1 text-foreground">
            {car.categoryLabel}
          </span>
          <span className="border border-border bg-card px-2.5 py-1 text-muted-foreground">
            {supportsCredit ? "Cash & Kredit" : "Khusus Cash"}
          </span>
        </div>

        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
          {car.name}
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
          {car.year} • {car.transmission} • {car.color} • {car.location}
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
        <div className="min-w-0 space-y-8 lg:col-span-7">
          <CarGallery images={car.images} carName={car.name} />
          <CarAnswerSummary car={car} />

          <section aria-labelledby="specs-heading" className="space-y-4">
            <h2
              id="specs-heading"
              className="font-heading text-xl font-semibold tracking-tight text-foreground"
            >
              Spesifikasi Unit
            </h2>

            <dl className="grid grid-cols-1 border-t border-l border-border bg-card sm:grid-cols-2">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="border-r border-b border-border px-4 py-3.5"
                >
                  <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                    {spec.label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground tabular-nums">
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="conditions-heading" className="space-y-4">
            <h2
              id="conditions-heading"
              className="font-heading text-xl font-semibold tracking-tight text-foreground"
            >
              Kondisi &amp; Kelengkapan
            </h2>

            <div className="border border-border bg-card p-5">
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {car.conditions.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground"
                  >
                    <Check
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <aside
          aria-label="Harga dan konsultasi unit"
          className="min-w-0 lg:sticky lg:top-24 lg:col-span-5"
        >
          <div className="space-y-6 border border-border bg-card p-5 sm:p-6">
            {creditPrice !== null ? (
              <div className="space-y-4">
                <div
                  role="group"
                  aria-label="Pilih skema pembayaran"
                  className="grid grid-cols-2 gap-2"
                >
                  <button
                    type="button"
                    aria-pressed={selectedScheme === "cash"}
                    onClick={() => setSelectedScheme("cash")}
                    className={cn(
                      "min-h-11 border px-3 py-2 text-sm font-semibold transition-colors",
                      selectedScheme === "cash"
                        ? "border-[#161514] bg-[#161514] text-[#FAF9F7]"
                        : "border-input bg-card text-foreground hover:bg-secondary",
                    )}
                  >
                    Cash
                  </button>

                  <button
                    type="button"
                    aria-pressed={selectedScheme === "credit"}
                    onClick={() => setSelectedScheme("credit")}
                    className={cn(
                      "min-h-11 border px-3 py-2 text-sm font-semibold transition-colors",
                      selectedScheme === "credit"
                        ? "border-[#161514] bg-[#161514] text-[#FAF9F7]"
                        : "border-input bg-card text-foreground hover:bg-secondary",
                    )}
                  >
                    Kredit
                  </button>
                </div>

                <div className="border border-border bg-secondary p-4">
                  {selectedScheme === "cash" ? (
                    <>
                      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Harga Cash
                      </p>
                      <p className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
                        {formatRupiah(car.cashPrice)}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                        Harga khusus kredit:{" "}
                        <span className="font-semibold text-primary">
                          {formatRupiah(creditPrice)}
                        </span>
                        {car.creditPriceNote ? ` (${car.creditPriceNote})` : ""}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                        Harga Kredit
                      </p>
                      <p className="mt-1 font-heading text-2xl font-bold tracking-tight text-primary tabular-nums sm:text-3xl">
                        {formatRupiah(creditPrice)}
                      </p>
                      <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                        {car.creditPriceNote
                          ? `${car.creditPriceNote}. `
                          : ""}
                        Harga cash: {formatRupiah(car.cashPrice)}
                      </p>
                    </>
                  )}
                </div>

                {car.creditSimulations.length > 0 ? (
                  <div className="space-y-2.5">
                    <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Simulasi Kredit Resmi
                    </h2>
                    <div className="space-y-2">
                      {car.creditSimulations.map((sim) => (
                        <div
                          key={`${sim.label}-${sim.dp}-${sim.tenorYears}`}
                          className="border border-border bg-background p-3.5"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-xs font-semibold text-foreground">
                              {sim.label}
                            </p>
                            {sim.provider ? (
                              <span className="text-xs font-medium text-muted-foreground">
                                {sim.provider}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 grid grid-cols-3 gap-2 text-xs tabular-nums">
                            <div>
                              <span className="block text-muted-foreground">
                                DP
                              </span>
                              <span className="mt-0.5 block font-semibold text-foreground">
                                {formatShortJuta(sim.dp)}
                              </span>
                            </div>
                            <div>
                              <span className="block text-muted-foreground">
                                Angsuran / bln
                              </span>
                              <span className="mt-0.5 block font-semibold text-primary">
                                {sim.installmentLabel}
                              </span>
                            </div>
                            <div>
                              <span className="block text-muted-foreground">
                                Tenor
                              </span>
                              <span className="mt-0.5 block font-semibold text-foreground">
                                {sim.tenorYears} tahun
                              </span>
                            </div>
                          </div>

                          {sim.note ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {sim.note}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-3 border border-border bg-secondary p-4">
                <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                  Special Price Cash
                </p>
                <p className="font-heading text-2xl font-bold tracking-tight text-foreground tabular-nums sm:text-3xl">
                  {formatRupiah(car.cashPrice)}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Unit koleksi ini tersedia khusus pembelian cash (Special
                  Price). Silakan jadwalkan cek unit langsung di Surakarta.
                </p>
              </div>
            )}

            <div className="space-y-2.5 border-t border-border pt-5">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Konsultasi &amp; Jadwal Cek Unit
              </p>

              <a
                href={buildWhatsAppUrl(farrel.phoneE164, inquiryMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "default", size: "lg" }),
                  "w-full justify-between no-underline",
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <MessageCircle className="size-4" aria-hidden="true" />
                  <span>Chat {farrel.name} via WhatsApp</span>
                </span>
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>

              <a
                href={buildWhatsAppUrl(abbad.phoneE164, inquiryMessage)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "w-full justify-between no-underline",
                )}
              >
                <span className="inline-flex items-center gap-2">
                  <MessageCircle className="size-4 text-primary" aria-hidden="true" />
                  <span>Chat {abbad.name} via WhatsApp</span>
                </span>
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>

              <p className="text-xs text-muted-foreground tabular-nums">
                {farrel.name}: {farrel.phoneDisplay} • {abbad.name}:{" "}
                {abbad.phoneDisplay}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5 border-t border-border pt-5 sm:grid-cols-2">
              <Button
                type="button"
                variant={compared ? "secondary" : "outline"}
                aria-pressed={compared}
                onClick={() => toggleCompare(car.slug)}
                className={cn(
                  "w-full",
                  compared && "border-[#161514] bg-[#161514] text-[#FAF9F7] hover:bg-[#2B2825]",
                )}
              >
                {compared ? (
                  <>
                    <Check className="size-4" aria-hidden="true" />
                    <span>Dibandingkan</span>
                  </>
                ) : (
                  <>
                    <GitCompareArrows className="size-4" aria-hidden="true" />
                    <span>+ Bandingkan</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleCopyLink}
                className="w-full"
              >
                {copiedLink ? (
                  <>
                    <Check className="size-4 text-primary" aria-hidden="true" />
                    <span>Link disalin</span>
                  </>
                ) : (
                  <>
                    <Link2 className="size-4" aria-hidden="true" />
                    <span>Salin Link Unit</span>
                  </>
                )}
              </Button>

              <div role="status" aria-live="polite" className="sr-only">
                {copyAnnouncement}
              </div>
            </div>

            <div className="space-y-2 border-t border-border pt-4 text-xs text-muted-foreground">
              <p className="flex items-center gap-2 text-foreground">
                <Clock className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{SHOWROOM.hours}</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <span>{SHOWROOM.city}</span>
              </p>
              <a
                href={SHOWROOM.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-primary"
              >
                <span>Buka Lokasi Showroom di Google Maps</span>
                <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </aside>
      </div>

      {similarCars.length > 0 ? (
        <section
          aria-labelledby="similar-cars-heading"
          className="mt-14 border-t border-border pt-10"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                Rekomendasi Stok
              </p>
              <h2
                id="similar-cars-heading"
                className="mt-1 font-heading text-2xl font-bold tracking-tight text-foreground"
              >
                Unit Serupa Lainnya
              </h2>
            </div>

            <Link
              to="/"
              hash="stok"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-foreground underline underline-offset-4 transition-colors hover:text-primary"
            >
              Lihat semua stok
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {similarCars.map((item) => (
              <CarCard key={item.slug} car={item} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
