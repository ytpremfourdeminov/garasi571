import { SHOWROOM } from "@/data/showroom"
import { CARS, formatRupiah, type CarUnit } from "@/data/cars"
import { type ShowroomFaqItem } from "@/data/faq"

const DEFAULT_SITE_URL = "https://garasi571.id"

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "")
}

function parseVerifiedOdometerKm(car: CarUnit): number | null {
  if (!car.mileageVerified) {
    return null
  }

  const ribuMatch = car.mileageLabel.match(/(\d+(?:[.,]\d+)?)\s*ribu/i)
  if (ribuMatch) {
    const parsed = Number(ribuMatch[1].replace(",", "."))
    if (Number.isFinite(parsed) && parsed > 0) {
      return Math.round(parsed * 1000)
    }
  }

  const exactMatch = car.mileageLabel.match(
    /\b(\d{1,3}(?:[.,]\d{3})+|\d{4,})\b/
  )
  if (exactMatch) {
    const parsed = Number(exactMatch[1].replace(/[.,]/g, ""))
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed
    }
  }

  return null
}

export function getSiteUrl(requestUrl?: string): string {
  const envUrl = import.meta.env.VITE_SITE_URL?.trim()
  if (envUrl) {
    return stripTrailingSlash(envUrl)
  }

  if (requestUrl) {
    try {
      const parsed = new URL(requestUrl)
      if (parsed.origin && parsed.origin !== "null") {
        return stripTrailingSlash(parsed.origin)
      }
    } catch {
      // Fallback to default site URL when requestUrl is not a valid absolute URL.
    }
  }

  return DEFAULT_SITE_URL
}

export function toAbsoluteUrl(path: string, siteUrl?: string): string {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const baseUrl = getSiteUrl(siteUrl)
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${baseUrl}${normalizedPath}`
}

export function getAiTrainingPolicy(): "allow" | "disallow-training" {
  return import.meta.env.VITE_AI_TRAINING_POLICY?.trim() === "disallow-training"
    ? "disallow-training"
    : "allow"
}

export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}

export function buildCanonicalLink(
  path: string,
  siteUrl?: string
): { rel: "canonical"; href: string } {
  return {
    rel: "canonical",
    href: toAbsoluteUrl(path, siteUrl),
  }
}

export function buildSocialMeta(opts: {
  title: string
  description: string
  path: string
  imagePath?: string
  imageWidth?: number
  imageHeight?: number
  imageAlt?: string
  type?: "website" | "product"
  siteUrl?: string
}): Array<Record<string, string>> {
  const url = toAbsoluteUrl(opts.path, opts.siteUrl)
  const meta: Array<Record<string, string>> = [
    { property: "og:type", content: opts.type ?? "website" },
    { property: "og:title", content: opts.title },
    { property: "og:description", content: opts.description },
    { property: "og:url", content: url },
    { name: "twitter:title", content: opts.title },
    { name: "twitter:description", content: opts.description },
  ]

  if (opts.imagePath) {
    const imageUrl = toAbsoluteUrl(opts.imagePath, opts.siteUrl)
    meta.push({ property: "og:image", content: imageUrl })
    if (opts.imageWidth !== undefined) {
      meta.push({
        property: "og:image:width",
        content: String(opts.imageWidth),
      })
    }
    if (opts.imageHeight !== undefined) {
      meta.push({
        property: "og:image:height",
        content: String(opts.imageHeight),
      })
    }
    if (opts.imageAlt) {
      meta.push({ property: "og:image:alt", content: opts.imageAlt })
    }
    meta.push({ name: "twitter:image", content: imageUrl })
  }

  return meta
}

export function buildAutoDealerJsonLd(
  siteUrl?: string
): Record<string, unknown> {
  const baseUrl = getSiteUrl(siteUrl)
  const logoUrl = toAbsoluteUrl(SHOWROOM.logoSrc, baseUrl)

  return {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${baseUrl}/#autodealer`,
    name: SHOWROOM.name,
    url: baseUrl,
    logo: logoUrl,
    image: logoUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Surakarta",
      addressRegion: "Jawa Tengah",
      addressCountry: "ID",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "08:00",
        closes: "16:00",
      },
    ],
    telephone: SHOWROOM.sales[0].phoneDisplay,
    contactPoint: SHOWROOM.sales.map((person) => ({
      "@type": "ContactPoint",
      contactType: "sales",
      name: person.name,
      telephone: person.phoneDisplay,
      areaServed: "ID",
      availableLanguage: ["Indonesian"],
    })),
    hasMap: SHOWROOM.mapsUrl,
    sameAs: [SHOWROOM.instagramUrl],
  }
}

export function buildItemListJsonLd(
  cars: readonly CarUnit[] = CARS,
  siteUrl?: string
): Record<string, unknown> {
  const baseUrl = getSiteUrl(siteUrl)

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: cars.length,
    itemListElement: cars.map((car, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: `${car.name} (${car.year})`,
      url: toAbsoluteUrl(`/mobil/${car.slug}`, baseUrl),
    })),
  }
}

export function buildCarProductJsonLd(
  car: CarUnit,
  siteUrl?: string
): Record<string, unknown> {
  const baseUrl = getSiteUrl(siteUrl)
  const url = toAbsoluteUrl(`/mobil/${car.slug}`, baseUrl)
  const odometerKm = parseVerifiedOdometerKm(car)

  const paymentSummary =
    car.paymentMode === "cash-only"
      ? `Harga cash ${formatRupiah(car.cashPrice)} (khusus cash)`
      : car.creditPrice !== null
        ? `Harga cash ${formatRupiah(car.cashPrice)}, kredit ${formatRupiah(car.creditPrice)}`
        : `Harga cash ${formatRupiah(car.cashPrice)}`

  const mileageSummary = car.mileageVerified
    ? `, odometer ${car.mileageLabel}`
    : ""

  const description = `${car.name} tahun ${car.year}, warna ${car.color}, transmisi ${car.transmission}${mileageSummary}. ${paymentSummary}. Lokasi unit di ${car.location}.`

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["Product", "Car"],
    name: `${car.name} (${car.year})`,
    url,
    brand: {
      "@type": "Brand",
      name: car.brand,
    },
    modelDate: String(car.yearSort),
    vehicleModelDate: car.year,
    color: car.color,
    vehicleTransmission: car.transmission,
    image: car.images.slice(0, 6).map((img) => toAbsoluteUrl(img.src, baseUrl)),
    description,
    offers: {
      "@type": "Offer",
      priceCurrency: "IDR",
      price: car.cashPrice,
      itemCondition: "https://schema.org/UsedCondition",
      availability: "https://schema.org/InStock",
      url,
      seller: {
        "@type": "AutoDealer",
        name: SHOWROOM.name,
        url: baseUrl,
      },
    },
  }

  if (odometerKm !== null) {
    jsonLd.mileageFromOdometer = {
      "@type": "QuantitativeValue",
      value: odometerKm,
      unitCode: "KMT",
    }
  }

  return jsonLd
}

export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
  siteUrl?: string
): Record<string, unknown> {
  const baseUrl = getSiteUrl(siteUrl)

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: toAbsoluteUrl(item.path, baseUrl),
    })),
  }
}

export function buildFaqPageJsonLd(
  items: readonly ShowroomFaqItem[]
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  }
}
