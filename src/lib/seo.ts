import { DEFAULT_SHOWROOM_CONFIG } from "@/components/showroom-context"
import { formatRupiah } from "@/lib/domain/formatters"
import type {
  CarImage,
  CarStatus,
  CarUnit,
  FuelType,
  ShowroomConfig,
  ShowroomFaqItem,
} from "@/lib/domain/types"

const DEFAULT_SITE_URL = "https://garasi571.id"

const FUEL_TYPE_SCHEMA_MAP: Record<FuelType, string> = {
  bensin: "Gasoline",
  diesel: "Diesel",
  hybrid: "Hybrid",
  phev: "Plug-in hybrid",
  ev: "Electricity",
}

const AVAILABILITY_SCHEMA_MAP: Record<CarStatus, string> = {
  ready: "https://schema.org/InStock",
  booked: "https://schema.org/LimitedAvailability",
  sold: "https://schema.org/SoldOut",
  draft: "https://schema.org/InStock",
  archived: "https://schema.org/SoldOut",
}

export type SeoCarInput = Pick<
  CarUnit,
  | "slug"
  | "brand"
  | "name"
  | "year"
  | "yearSort"
  | "color"
  | "transmission"
  | "mileageLabel"
  | "mileageVerified"
  | "location"
  | "cashPrice"
  | "creditPrice"
  | "paymentMode"
> & {
  images: readonly Pick<CarImage, "src">[]
} & Partial<
    Pick<
      CarUnit,
      | "status"
      | "fuelType"
      | "engineCc"
      | "bodyType"
      | "seatCapacity"
      | "drivetrain"
    >
  >

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "")
}

function parseOpeningHours(hours: string): { opens: string; closes: string } {
  const match = hours.match(/(\d{2}:\d{2})\s*[-–]\s*(\d{2}:\d{2})/)
  if (match) {
    return { opens: match[1], closes: match[2] }
  }
  return { opens: "08:00", closes: "16:00" }
}

function parseCityAndRegion(city: string): {
  addressLocality: string
  addressRegion: string
} {
  const parts = city
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
  return {
    addressLocality: parts[0] ?? "Surakarta",
    addressRegion: parts[1] ?? "Jawa Tengah",
  }
}

function parseVerifiedOdometerKm(
  car: Pick<CarUnit, "mileageVerified" | "mileageLabel">
): number | null {
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
  siteUrl?: string,
  showroom: ShowroomConfig = DEFAULT_SHOWROOM_CONFIG
): Record<string, unknown> {
  const baseUrl = getSiteUrl(siteUrl)
  const logoPath = showroom.logoSrc || showroom.logoUrl
  const logoUrl = toAbsoluteUrl(logoPath, baseUrl)
  const { addressLocality, addressRegion } = parseCityAndRegion(showroom.city)
  const { opens, closes } = parseOpeningHours(showroom.hours)
  const primaryPhone = showroom.sales[0]?.phoneDisplay

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${baseUrl}/#autodealer`,
    name: showroom.name,
    url: baseUrl,
    logo: logoUrl,
    image: logoUrl,
    address: {
      "@type": "PostalAddress",
      addressLocality,
      addressRegion,
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
        opens,
        closes,
      },
    ],
    contactPoint: showroom.sales.map((person) => ({
      "@type": "ContactPoint",
      contactType: "sales",
      name: person.name,
      telephone: person.phoneDisplay,
      areaServed: "ID",
      availableLanguage: ["Indonesian"],
    })),
    hasMap: showroom.mapsUrl,
    sameAs: showroom.instagramUrl ? [showroom.instagramUrl] : [],
  }

  if (primaryPhone) {
    jsonLd.telephone = primaryPhone
  }

  return jsonLd
}

export function buildItemListJsonLd(
  cars: readonly Pick<CarUnit, "name" | "year" | "slug">[] = [],
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
  car: SeoCarInput,
  siteUrl?: string,
  showroom: ShowroomConfig = DEFAULT_SHOWROOM_CONFIG
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

  const availability = car.status
    ? AVAILABILITY_SCHEMA_MAP[car.status]
    : "https://schema.org/InStock"

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
      availability,
      url,
      seller: {
        "@type": "AutoDealer",
        name: showroom.name,
        url: baseUrl,
      },
    },
  }

  if (car.fuelType) {
    jsonLd.fuelType = FUEL_TYPE_SCHEMA_MAP[car.fuelType]
  }

  if (car.engineCc !== null && car.engineCc !== undefined && car.engineCc > 0) {
    jsonLd.vehicleEngine = {
      "@type": "EngineSpecification",
      engineDisplacement: {
        "@type": "QuantitativeValue",
        value: car.engineCc,
        unitCode: "CMQ",
      },
    }
  }

  if (car.bodyType) {
    jsonLd.bodyType = car.bodyType
  }

  if (
    car.seatCapacity !== null &&
    car.seatCapacity !== undefined &&
    car.seatCapacity > 0
  ) {
    jsonLd.vehicleSeatingCapacity = car.seatCapacity
  }

  if (car.drivetrain) {
    jsonLd.driveWheelConfiguration = car.drivetrain
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
  items: readonly Pick<ShowroomFaqItem, "question" | "answer">[]
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
