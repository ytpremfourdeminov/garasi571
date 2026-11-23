import { createFileRoute } from "@tanstack/react-router"
import { CARS, formatRupiah, type CarUnit } from "@/data/cars"
import { SHOWROOM } from "@/data/showroom"
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo"

function formatPriceSummary(car: CarUnit): string {
  if (car.creditPrice !== null) {
    return `cash ${formatRupiah(car.cashPrice)} / kredit ${formatRupiah(car.creditPrice)}`
  }
  return `cash ${formatRupiah(car.cashPrice)} (Special Price, khusus cash)`
}

function buildLlmsTxt(requestUrl?: string): string {
  const baseUrl = getSiteUrl(requestUrl)
  const salesLines = SHOWROOM.sales.map(
    (person) =>
      `- WhatsApp ${person.name}: ${person.phoneDisplay} (https://wa.me/${person.phoneE164})`
  )
  const carLines = CARS.map((car) => {
    const unitUrl = toAbsoluteUrl(`/mobil/${car.slug}`, baseUrl)
    const priceSummary = formatPriceSummary(car)
    return `- [${car.name} (${car.year})](${unitUrl}): ${car.categoryLabel}, ${car.transmission}, warna ${car.color}, ${priceSummary}, kilometer ${car.mileageLabel}.`
  })

  return [
    "# Garasi 571 Surakarta",
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
    `- Katalog Lengkap (LLM): ${toAbsoluteUrl("/llms-full.txt", baseUrl)}`,
    "",
    `## Stok Mobil Tersedia (${CARS.length} Unit)`,
    "",
    ...carLines,
    "",
  ].join("\n")
}

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const body = buildLlmsTxt(request.url)
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
