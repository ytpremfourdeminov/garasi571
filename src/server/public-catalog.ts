import { createServerFn, createServerOnlyFn } from "@tanstack/react-start"
import { z } from "zod"
import { getSimilarCars } from "@/lib/domain/formatters"
import {
  mapDbCarToDomain,
  mapDbFaqToDomain,
  mapDbSalesContactToDomain,
  mapDbShowroomToDomain,
} from "@/lib/domain/mappers"
import type {
  CarUnit,
  ShowroomConfig,
  ShowroomFaqItem,
} from "@/lib/domain/types"
import { getSupabasePublicClient } from "@/lib/supabase.server"
import type { Database } from "@/types/database"

type DbCarRow = Database["public"]["Tables"]["cars"]["Row"]
type DbCarImageRow = Database["public"]["Tables"]["car_images"]["Row"]
type DbCarCreditRow =
  Database["public"]["Tables"]["car_credit_simulations"]["Row"]

type DbCarWithRelations = DbCarRow & {
  car_images?: DbCarImageRow[] | null
  car_credit_simulations?: DbCarCreditRow[] | null
}

const PUBLIC_ACTIVE_STATUSES = ["ready", "booked"] as const
const PUBLIC_ALL_VISIBLE_STATUSES = ["ready", "booked", "sold"] as const

const FALLBACK_SHOWROOM_SETTINGS: Omit<ShowroomConfig, "sales"> = {
  id: 1,
  name: "Garasi 571",
  city: "Surakarta, Jawa Tengah",
  address: "Surakarta, Jawa Tengah",
  hours: "Setiap hari, 08:00 - 16:00 WIB",
  mapsUrl: "https://maps.app.goo.gl/4wLS9NRMExMHPaXA9",
  mapsEmbedUrl:
    "https://maps.google.com/maps?q=-7.5256103,110.818928&z=16&output=embed",
  instagramHandle: "@garasi.571",
  instagramUrl: "https://www.instagram.com/garasi.571/",
  logoSrc: "/images/brand/garasi-571-logo.png",
  logoUrl: "/images/brand/garasi-571-logo.png",
}

function throwPublicError(publicMessage: string): never {
  throw new Error(publicMessage)
}

function mapCarRowWithRelations(row: DbCarWithRelations): CarUnit {
  const { car_images, car_credit_simulations, ...carRow } = row
  return mapDbCarToDomain(
    carRow,
    car_images ?? [],
    car_credit_simulations ?? [],
  )
}

export const fetchPublicShowroom = createServerOnlyFn(
  async (): Promise<ShowroomConfig> => {
    try {
      const supabase = getSupabasePublicClient<Database>()
      const [settingsResult, salesResult] = await Promise.all([
        supabase
          .from("showroom_settings")
          .select("*")
          .eq("id", 1)
          .maybeSingle(),
        supabase
          .from("sales_contacts")
          .select("*")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ])

      if (settingsResult.error || salesResult.error) {
        throwPublicError("Gagal memuat profil showroom.")
      }

      const salesRows = salesResult.data
      if (!settingsResult.data) {
        return {
          ...FALLBACK_SHOWROOM_SETTINGS,
          sales: salesRows.map(mapDbSalesContactToDomain),
        }
      }

      return mapDbShowroomToDomain(settingsResult.data, salesRows)
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Gagal memuat profil showroom."
      ) {
        throw error
      }
      throwPublicError("Gagal memuat profil showroom.")
    }
  },
)

export const getPublicShowroomFn = createServerFn({ method: "GET" }).handler(
  async () => {
    return fetchPublicShowroom()
  },
)

export const fetchPublicCars = createServerOnlyFn(
  async (options?: { includeSold?: boolean }): Promise<CarUnit[]> => {
    try {
      const supabase = getSupabasePublicClient<Database>()
      const statuses = options?.includeSold
        ? [...PUBLIC_ALL_VISIBLE_STATUSES]
        : [...PUBLIC_ACTIVE_STATUSES]

      const { data, error } = await supabase
        .from("cars")
        .select("*, car_images(*), car_credit_simulations(*)")
        .in("status", statuses)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })

      if (error) {
        throwPublicError("Gagal memuat daftar unit katalog.")
      }

      const rows: DbCarWithRelations[] = data
      return rows.map(mapCarRowWithRelations)
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Gagal memuat daftar unit katalog."
      ) {
        throw error
      }
      throwPublicError("Gagal memuat daftar unit katalog.")
    }
  },
)

const getPublicCarsInputSchema = z
  .object({
    includeSold: z.boolean().optional(),
  })
  .optional()

export const getPublicCarsFn = createServerFn({ method: "GET" })
  .validator(getPublicCarsInputSchema)
  .handler(async ({ data }) => {
    return fetchPublicCars(data)
  })

export const fetchPublicCarBySlug = createServerOnlyFn(
  async (
    slug: string,
  ): Promise<{ car: CarUnit; similarCars: CarUnit[] } | null> => {
    const normalizedSlug = slug.trim()
    if (!normalizedSlug) {
      return null
    }

    try {
      const supabase = getSupabasePublicClient<Database>()
      const { data, error } = await supabase
        .from("cars")
        .select("*, car_images(*), car_credit_simulations(*)")
        .eq("slug", normalizedSlug)
        .in("status", [...PUBLIC_ALL_VISIBLE_STATUSES])
        .maybeSingle()

      if (error) {
        throwPublicError("Gagal memuat detail unit.")
      }

      if (!data) {
        return null
      }

      const car = mapCarRowWithRelations(data)
      const activeCars = await fetchPublicCars({ includeSold: false })
      const similarCars = getSimilarCars(car, activeCars, 3)

      return { car, similarCars }
    } catch (error) {
      if (error instanceof Error && error.message === "Gagal memuat detail unit.") {
        throw error
      }
      throwPublicError("Gagal memuat detail unit.")
    }
  },
)

const getPublicCarBySlugInputSchema = z.object({
  slug: z.string().min(1),
})

export const getPublicCarBySlugFn = createServerFn({ method: "GET" })
  .validator(getPublicCarBySlugInputSchema)
  .handler(async ({ data }) => {
    return fetchPublicCarBySlug(data.slug)
  })

export const fetchPublicFaqs = createServerOnlyFn(
  async (): Promise<ShowroomFaqItem[]> => {
    try {
      const supabase = getSupabasePublicClient<Database>()
      const { data, error } = await supabase
        .from("showroom_faqs")
        .select("*")
        .eq("is_published", true)
        .order("sort_order", { ascending: true })

      if (error) {
        throwPublicError("Gagal memuat daftar FAQ.")
      }

      return data.map(mapDbFaqToDomain)
    } catch (error) {
      if (error instanceof Error && error.message === "Gagal memuat daftar FAQ.") {
        throw error
      }
      throwPublicError("Gagal memuat daftar FAQ.")
    }
  },
)

export const getPublicFaqsFn = createServerFn({ method: "GET" }).handler(
  async () => {
    return fetchPublicFaqs()
  },
)
