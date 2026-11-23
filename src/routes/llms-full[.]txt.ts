import { createFileRoute } from "@tanstack/react-router"
import { formatRupiah } from "@/lib/domain/formatters"
import type {
  CarUnit,
  CreditSimulation,
  DocumentChecklist,
  FuelType,
  ShowroomConfig,
  ShowroomFaqItem,
} from "@/lib/domain/types"
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo"
import {
  fetchPublicCars,
  fetchPublicFaqs,
  fetchPublicShowroom,
} from "@/server/public-catalog"

const FUEL_LABELS: Record<FuelType, string> = {
  bensin: "Bensin",
  diesel: "Diesel",
  hybrid: "Hybrid",
  phev: "Plug-in Hybrid (PHEV)",
  ev: "Listrik (EV)",
}

const DOCUMENT_LABELS: Array<[keyof DocumentChecklist, string]> = [
  ["stnk", "STNK"],
  ["bpkb", "BPKB"],
  ["faktur", "Faktur"],
  ["nik", "NIK"],
  ["manualBook", "Buku Manual"],
  ["serviceBook", "Buku Servis"],
  ["spareKey", "Kunci Cadangan"],
]

function formatSimulationLine(sim: CreditSimulation): string {
  const providerPart = sim.provider ? `, Lembaga Pembiayaan: ${sim.provider}` : ""
  const notePart = sim.note ? `, Catatan: ${sim.note}` : ""
  return `  - ${sim.label}: DP ${formatRupiah(sim.dp)}, Angsuran ${sim.installmentLabel}/bulan, Tenor ${sim.tenorYears} tahun${providerPart}${notePart}`
}

function formatDocumentChecklist(checklist: DocumentChecklist): string | null {
  const available = DOCUMENT_LABELS.filter(([key]) => Boolean(checklist[key])).map(
    ([, label]) => label
  )
  return available.length > 0 ? available.join(", ") : null
}

function buildResearchLines(car: CarUnit): string[] {
  const lines: string[] = []

  lines.push(`- Bahan Bakar (BBM): ${FUEL_LABELS[car.fuelType]}`)

  if (car.engineCc !== null && car.engineCc > 0) {
    lines.push(`- Kapasitas Mesin: ${car.engineCc} cc`)
  }

  const bodyParts = [
    car.bodyType ? `Bodi ${car.bodyType}` : null,
    car.seatCapacity ? `${car.seatCapacity} penumpang` : null,
    car.drivetrain ? `Penggerak ${car.drivetrain}` : null,
  ].filter(Boolean)
  if (bodyParts.length > 0) {
    lines.push(`- Bodi & Kapasitas: ${bodyParts.join(", ")}`)
  }

  const taxParts = [
    car.taxStatus ? `Status ${car.taxStatus}` : null,
    car.taxExpiryDate ? `Berlaku s/d ${car.taxExpiryDate}` : null,
    car.estimatedAnnualTax
      ? `Estimasi PKB ${formatRupiah(car.estimatedAnnualTax)}/tahun`
      : null,
  ].filter(Boolean)
  if (taxParts.length > 0) {
    lines.push(`- Status Pajak: ${taxParts.join(" | ")}`)
  }

  const docsSummary = formatDocumentChecklist(car.documentChecklist)
  if (docsSummary) {
    lines.push(`- Kelengkapan Dokumen: ${docsSummary}`)
  }

  const inspectionParts = [
    car.inspectionSummary.floodFree === true ? "Bebas banjir" : null,
    car.inspectionSummary.majorAccidentFree === true
      ? "Bebas tabrak besar"
      : null,
  ].filter(Boolean)
  if (inspectionParts.length > 0) {
    lines.push(`- Jaminan Inspeksi: ${inspectionParts.join(" & ")}`)
  }

  if (car.warrantyInfo) {
    lines.push(`- Garansi Showroom: ${car.warrantyInfo}`)
  }

  if (car.videoWalkaroundUrl) {
    lines.push(`- Video Walkaround: ${car.videoWalkaroundUrl}`)
  }

  if (car.imperfections.length > 0) {
    lines.push("- Catatan Minus Jujur:")
    for (const item of car.imperfections) {
      lines.push(`  - [${item.severity}] ${item.area}: ${item.description}`)
    }
  }

  return lines
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

  const conditionLines =
    car.conditions.length > 0
      ? car.conditions.map((item) => `  - ${item}`)
      : ["  - Unit terawat dan siap cek langsung di showroom"]

  return [
    `### ${car.name} (${car.year})`,
    "",
    `- URL: ${unitUrl}`,
    `- Status Unit: ${car.status === "booked" ? "Booked" : "Ready"}`,
    `- Kategori: ${car.categoryLabel}`,
    `- Tahun: ${car.year}`,
    `- Transmisi: ${car.transmission}`,
    `- Warna: ${car.color}`,
    `- Plat & Pajak: ${car.plateInfo}`,
    `- Odometer: ${car.mileageLabel}`,
    ...buildResearchLines(car),
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

function buildLlmsFullTxt(
  cars: CarUnit[],
  showroom: ShowroomConfig,
  faqs: ShowroomFaqItem[],
  requestUrl?: string
): string {
  const baseUrl = getSiteUrl(requestUrl)
  const salesLines = showroom.sales.map(
    (person) =>
      `- WhatsApp ${person.name}: ${person.phoneDisplay} (https://wa.me/${person.phoneE164})`
  )

  const carSections = cars.flatMap((car) => buildCarSection(car, baseUrl))

  const faqSections = faqs.flatMap((faq) => [
    `### ${faq.question}`,
    "",
    faq.answer,
    "",
  ])

  return [
    `# ${showroom.name} ${showroom.city.split(",")[0]?.trim() || "Surakarta"} - Katalog Lengkap`,
    "",
    `> Showroom mobil bekas pilihan di ${showroom.city}. Buka ${showroom.hours} dengan pilihan pembelian cash, kredit resmi, dan tukar tambah untuk unit tertentu.`,
    "",
    "## Informasi Showroom & Kontak",
    "",
    `- Nama Showroom: ${showroom.name}`,
    `- Lokasi: ${showroom.city}`,
    `- Jam Operasional: ${showroom.hours}`,
    `- Google Maps: ${showroom.mapsUrl}`,
    `- Instagram: ${showroom.instagramHandle} (${showroom.instagramUrl})`,
    ...salesLines,
    `- Katalog Utama: ${toAbsoluteUrl("/", baseUrl)}`,
    `- Ringkasan LLM: ${toAbsoluteUrl("/llms.txt", baseUrl)}`,
    "",
    `## Katalog Unit Tersedia (${cars.length} Unit)`,
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
      GET: async ({ request }) => {
        const [cars, showroom, faqs] = await Promise.all([
          fetchPublicCars({ includeSold: false }),
          fetchPublicShowroom(),
          fetchPublicFaqs(),
        ])
        const body = buildLlmsFullTxt(cars, showroom, faqs, request.url)
        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
          },
        })
      },
    },
  },
})
