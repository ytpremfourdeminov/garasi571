import { createFileRoute } from "@tanstack/react-router"
import { formatRupiah } from "@/lib/domain/formatters"
import type { CarUnit, ShowroomConfig } from "@/lib/domain/types"
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo"
import { fetchPublicCars, fetchPublicShowroom } from "@/server/public-catalog"

function formatPriceSummary(car: CarUnit): string {
  if (car.creditPrice !== null) {
    return `cash ${formatRupiah(car.cashPrice)} / kredit ${formatRupiah(car.creditPrice)}`
  }
  return `cash ${formatRupiah(car.cashPrice)} (Special Price, khusus cash)`
}

function buildLlmsTxt(
  cars: CarUnit[],
  showroom: ShowroomConfig,
  requestUrl?: string
): string {
  const baseUrl = getSiteUrl(requestUrl)
  const salesLines = showroom.sales.map(
    (person) =>
      `- WhatsApp ${person.name}: ${person.phoneDisplay} (https://wa.me/${person.phoneE164})`
  )
  const carLines = cars.map((car) => {
    const unitUrl = toAbsoluteUrl(`/mobil/${car.slug}`, baseUrl)
    const priceSummary = formatPriceSummary(car)
    return `- [${car.name} (${car.year})](${unitUrl}): ${car.categoryLabel}, ${car.transmission}, warna ${car.color}, ${priceSummary}, kilometer ${car.mileageLabel}.`
  })

  return [
    `# ${showroom.name} ${showroom.city.split(",")[0]?.trim() || "Surakarta"}`,
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
    `- Katalog Lengkap (LLM): ${toAbsoluteUrl("/llms-full.txt", baseUrl)}`,
    "",
    `## Unit Mobil Tersedia (${cars.length} Unit)`,
    "",
    ...carLines,
    "",
  ].join("\n")
}

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const [cars, showroom] = await Promise.all([
          fetchPublicCars({ includeSold: false }),
          fetchPublicShowroom(),
        ])
        const body = buildLlmsTxt(cars, showroom, request.url)
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
