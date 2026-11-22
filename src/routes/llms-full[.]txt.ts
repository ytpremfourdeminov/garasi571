import { createFileRoute } from "@tanstack/react-router"
import { CARS, formatRupiah, type CarUnit, type CreditSimulation } from "@/data/cars"
import { SHOWROOM_FAQS } from "@/data/faq"
import { SHOWROOM } from "@/data/showroom"
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo"

function formatSimulationLine(sim: CreditSimulation): string {
  const providerPart = sim.provider ? `, Lembaga Pembiayaan: ${sim.provider}` : ""
  const notePart = sim.note ? `, Catatan: ${sim.note}` : ""
  return `  - ${sim.label}: DP ${formatRupiah(sim.dp)}, Angsuran ${sim.installmentLabel}/bulan, Tenor ${sim.tenorYears} tahun${providerPart}${notePart}`
}

function buildCarSection(car: CarUnit, baseUrl: string): string[] {
  const unitUrl = toAbsoluteUrl(`/mobil/${car.slug}`, baseUrl)
  const creditPriceText =
    car.creditPrice !== null
      ? `${formatRupiah(car.creditPrice)}${car.creditPriceNote ? ` (${car.creditPriceNote})` : ""}`
      : car.creditPriceNote ?? "Tidak tersedia (khusus pembayaran cash)"

  const simulationLines =
    car.creditSimulations.length > 0
      ? car.creditSimulations.map(formatSimulationLine)
      : ["  - Tidak tersedia (khusus pembayaran cash)"]

  const conditionLines = car.conditions.map((item) => `  - ${item}`)

  return [
    `### ${car.name} (${car.year})`,
    "",
    `- URL: ${unitUrl}`,
    `- Kategori: ${car.categoryLabel}`,
    `- Tahun: ${car.year}`,
    `- Transmisi: ${car.transmission}`,
    `- Warna: ${car.color}`,
    `- Plat & Pajak: ${car.plateInfo}`,
    `- Odometer: ${car.mileageLabel}`,
    `- Tukar Tambah: ${car.tradeInAvailable ? "Tersedia" : "Tidak tersedia"}`,
    `- Harga Cash: ${formatRupiah(car.cashPrice)}`,
    `- Harga Kredit: ${creditPriceText}`,
    "- Simulasi Kredit:",
    ...simulationLines,
    "- Kondisi & Kelengkapan:",
    ...conditionLines,
    "",
  ]
}

function buildLlmsFullTxt(requestUrl?: string): string {
  const baseUrl = getSiteUrl(requestUrl)
  const salesLines = SHOWROOM.sales.map(
    (person) =>
      `- WhatsApp ${person.name}: ${person.phoneDisplay} (https://wa.me/${person.phoneE164})`
  )

  const carSections = CARS.flatMap((car) => buildCarSection(car, baseUrl))

  const faqSections = SHOWROOM_FAQS.flatMap((faq) => [
    `### ${faq.question}`,
    "",
    faq.answer,
    "",
  ])

  return [
    "# Garasi 571 Surakarta - Katalog Lengkap",
    "",
    "> Showroom mobil bekas pilihan di Surakarta, Jawa Tengah. Buka setiap hari pukul 08:00 - 16:00 WIB dengan pilihan pembelian cash, kredit resmi, dan tukar tambah untuk unit tertentu.",
    "",
    "## Informasi Showroom & Kontak",
    "",
    `- Nama Showroom: ${SHOWROOM.name}`,
    `- Lokasi: ${SHOWROOM.city}`,
    `- Jam Operasional: ${SHOWROOM.hours}`,
    `- Google Maps: ${SHOWROOM.mapsUrl}`,
    `- Instagram: ${SHOWROOM.instagramHandle} (${SHOWROOM.instagramUrl})`,
    ...salesLines,
    `- Katalog Utama: ${toAbsoluteUrl("/", baseUrl)}`,
    `- Ringkasan LLM: ${toAbsoluteUrl("/llms.txt", baseUrl)}`,
    "",
    `## Katalog Unit Tersedia (${CARS.length} Unit)`,
    "",
    ...carSections,
    "## Pertanyaan Umum (FAQ)",
    "",
    ...faqSections,
  ].join("\n")
}

export const Route = createFileRoute("/llms-full.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const body = buildLlmsFullTxt(request.url)
        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        })
      },
    },
  },
})
