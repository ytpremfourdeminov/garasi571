import type { CarCategory, CarUnit, CatalogFilterState } from "@/lib/domain/types"

export const CATEGORY_LABELS: Record<CarCategory, string> = {
  keluarga: "Keluarga 7-Seater",
  harian: "Harian & City Car",
  "hobi-eropa": "Hobi & Eropa",
}

export function getCategoryLabel(category: CarCategory): string {
  return CATEGORY_LABELS[category]
}

export function formatRupiah(amount: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(amount)}`
}

export function formatShortJuta(amount: number): string {
  const juta = amount / 1_000_000
  const formatted = Number.isInteger(juta)
    ? String(juta)
    : juta.toLocaleString("id-ID", { maximumFractionDigits: 1 })
  return `Rp${formatted} jt`
}

export function slugifyText(input: string, maxLength = 80): string {
  const normalized = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")

  if (normalized.length <= maxLength) {
    return normalized
  }

  return normalized.slice(0, maxLength).replace(/-+$/g, "")
}

export function slugifyCarName(name: string, year?: string): string {
  const base = year ? `${name} ${year}` : name
  return slugifyText(base)
}

export function pickUniqueSlug(
  existingSlugs: Iterable<string>,
  rawBase: string,
  fallback: string,
  maxLength = 80
): string {
  const normalizedBase = slugifyText(rawBase, maxLength) || fallback
  const taken = new Set(existingSlugs)
  if (!taken.has(normalizedBase)) {
    return normalizedBase
  }

  for (let suffix = 2; ; suffix += 1) {
    const suffixStr = `-${suffix}`
    const trimmedBase =
      normalizedBase
        .slice(0, Math.max(1, maxLength - suffixStr.length))
        .replace(/-+$/g, "") || fallback
    const candidate = `${trimmedBase}${suffixStr}`
    if (!taken.has(candidate)) {
      return candidate
    }
  }
}

export function buildWhatsAppUrl(phoneE164: string, message: string): string {
  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`
}

export function buildCarInquiryMessage(
  carName: string,
  year: string,
  scheme?: string,
): string {
  const unitLabel = `${carName} (${year})`
  if (scheme) {
    return `Halo Garasi 571, saya tertarik dengan unit ${unitLabel} (${scheme}). Apakah unitnya masih tersedia untuk cek langsung di showroom Surakarta?`
  }
  return `Halo Garasi 571, saya tertarik dengan unit ${unitLabel}. Apakah unitnya masih tersedia untuk cek langsung di showroom Surakarta?`
}

export function filterAndSortCars(
  cars: CarUnit[],
  filters: CatalogFilterState,
): CarUnit[] {
  const query = filters.q?.trim().toLowerCase() ?? ""

  const filtered = cars.filter((car) => {
    if (filters.kategori && filters.kategori !== "all") {
      if (car.category !== filters.kategori) return false
    }

    if (filters.transmisi && filters.transmisi !== "all") {
      if (car.transmissionGroup !== filters.transmisi) return false
    }

    if (filters.bayar && filters.bayar !== "all") {
      if (car.paymentMode !== filters.bayar) return false
    }

    if (filters.budget && filters.budget !== "all") {
      const price = car.cashPrice
      if (filters.budget === "under-120" && price >= 120_000_000) return false
      if (
        filters.budget === "120-200" &&
        (price < 120_000_000 || price > 200_000_000)
      ) {
        return false
      }
      if (filters.budget === "over-200" && price <= 200_000_000) return false
    }

    if (query) {
      const haystack = [
        car.brand,
        car.name,
        car.shortName,
        car.year,
        car.color,
        car.transmission,
        car.plateInfo,
        car.categoryLabel,
        car.bodyType ?? "",
        car.fuelType,
        ...car.highlights,
        ...car.conditions,
      ]
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }

    return true
  })

  if (!filters.urut) {
    return filtered
  }

  return [...filtered].sort((a, b) => {
    if (filters.urut === "harga-terendah") {
      return a.cashPrice - b.cashPrice
    }
    if (filters.urut === "harga-tertinggi") {
      return b.cashPrice - a.cashPrice
    }
    return b.yearSort - a.yearSort || b.cashPrice - a.cashPrice
  })
}

export function getSimilarCars(
  car: CarUnit,
  allCars: CarUnit[],
  limit = 3,
): CarUnit[] {
  return allCars
    .filter((item) => item.slug !== car.slug)
    .sort((a, b) => {
      const aSameCategory = a.category === car.category ? 0 : 1
      const bSameCategory = b.category === car.category ? 0 : 1
      if (aSameCategory !== bSameCategory) {
        return aSameCategory - bSameCategory
      }
      return (
        Math.abs(a.cashPrice - car.cashPrice) -
        Math.abs(b.cashPrice - car.cashPrice)
      )
    })
    .slice(0, limit)
}
