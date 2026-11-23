import { notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { pickUniqueSlug, slugifyText } from "@/lib/domain/formatters"
import {
  mapDbSalesContactToDomain,
  mapDbShowroomToDomain,
} from "@/lib/domain/mappers"
import {
  salesContactUpsertSchema,
  showroomUpdateSchema,
} from "@/lib/domain/schemas"
import type { SalesContact, ShowroomConfig } from "@/lib/domain/types"
import { requireAdmin, requireStaff } from "@/server/auth"

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

const salesContactIdInputSchema = z.object({
  id: z.string().uuid("ID kontak sales tidak valid"),
})

const reorderSalesContactsInputSchema = z.object({
  orderedIds: z
    .array(z.string().uuid("ID kontak sales tidak valid"))
    .min(1, "Daftar urutan kontak sales tidak boleh kosong")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Terdapat duplikasi ID kontak sales dalam urutan.",
    }),
})

function createHttpError(status: number, message: string): Error {
  const err = new Error(message) as Error & {
    status: number
    statusCode: number
  }
  err.status = status
  err.statusCode = status
  return err
}

/**
 * Fetches showroom settings and all sales contacts (including inactive) for the dashboard.
 */
export const getDashShowroomFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShowroomConfig> => {
    const { supabase } = await requireStaff()

    const [settingsResult, salesResult] = await Promise.all([
      supabase.from("showroom_settings").select("*").eq("id", 1).maybeSingle(),
      supabase
        .from("sales_contacts")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ])

    if (settingsResult.error || salesResult.error) {
      throw createHttpError(500, "Gagal memuat pengaturan showroom.")
    }

    if (!settingsResult.data) {
      return {
        ...FALLBACK_SHOWROOM_SETTINGS,
        sales: salesResult.data.map(mapDbSalesContactToDomain),
      }
    }

    return mapDbShowroomToDomain(settingsResult.data, salesResult.data)
  }
)

/**
 * Updates the singleton showroom settings (Admin only).
 */
export const updateShowroomSettingsFn = createServerFn({ method: "POST" })
  .validator(showroomUpdateSchema)
  .handler(async ({ data }): Promise<ShowroomConfig> => {
    const { supabase } = await requireAdmin()

    const { data: settingsRow, error: upsertError } = await supabase
      .from("showroom_settings")
      .upsert(
        {
          id: 1,
          name: data.name,
          city: data.city,
          address: data.address,
          hours: data.hours,
          maps_url: data.mapsUrl,
          maps_embed_url: data.mapsEmbedUrl,
          instagram_handle: data.instagramHandle,
          instagram_url: data.instagramUrl,
          logo_url: data.logoUrl,
        },
        { onConflict: "id" }
      )
      .select("*")
      .single()

    if (upsertError) {
      throw createHttpError(500, "Gagal menyimpan pengaturan showroom.")
    }

    const { data: salesRows, error: salesError } = await supabase
      .from("sales_contacts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (salesError) {
      throw createHttpError(500, "Gagal memuat ulang daftar kontak sales.")
    }

    return mapDbShowroomToDomain(settingsRow, salesRows)
  })

/**
 * Creates or updates a WhatsApp sales contact (Admin only).
 */
export const upsertSalesContactFn = createServerFn({ method: "POST" })
  .validator(salesContactUpsertSchema)
  .handler(async ({ data }): Promise<SalesContact> => {
    const { supabase } = await requireAdmin()

    const baseSlug = slugifyText(data.slug || data.name) || "sales"
    let slugQuery = supabase
      .from("sales_contacts")
      .select("id, slug")
      .ilike("slug", `${baseSlug}%`)

    if (data.id) {
      slugQuery = slugQuery.neq("id", data.id)
    }

    const { data: matchingSlugs, error: slugError } = await slugQuery

    if (slugError) {
      throw createHttpError(500, "Gagal memeriksa keunikan slug kontak sales.")
    }

    const resolvedSlug = pickUniqueSlug(
      (matchingSlugs ?? []).map((row) => row.slug),
      baseSlug,
      "sales"
    )

    if (data.id) {
      const { data: existing, error: existingError } = await supabase
        .from("sales_contacts")
        .select("id")
        .eq("id", data.id)
        .maybeSingle()

      if (existingError) {
        throw createHttpError(500, "Gagal memeriksa data kontak sales.")
      }

      if (!existing) {
        throw notFound()
      }

      const { data: updated, error: updateError } = await supabase
        .from("sales_contacts")
        .update({
          slug: resolvedSlug,
          name: data.name,
          role: data.role,
          phone_display: data.phoneDisplay,
          phone_e164: data.phoneE164,
          is_active: data.isActive,
          sort_order: data.sortOrder,
        })
        .eq("id", data.id)
        .select("*")
        .single()

      if (updateError) {
        if (updateError.code === "23505") {
          throw createHttpError(
            409,
            "Slug kontak sales sudah digunakan. Gunakan slug yang berbeda."
          )
        }
        throw createHttpError(500, "Gagal memperbarui kontak sales.")
      }

      return mapDbSalesContactToDomain(updated)
    }

    const { data: inserted, error: insertError } = await supabase
      .from("sales_contacts")
      .insert({
        slug: resolvedSlug,
        name: data.name,
        role: data.role,
        phone_display: data.phoneDisplay,
        phone_e164: data.phoneE164,
        is_active: data.isActive,
        sort_order: data.sortOrder,
      })
      .select("*")
      .single()

    if (insertError) {
      if (insertError.code === "23505") {
        throw createHttpError(
          409,
          "Slug kontak sales sudah digunakan. Gunakan slug yang berbeda."
        )
      }
      throw createHttpError(500, "Gagal menambahkan kontak sales baru.")
    }

    return mapDbSalesContactToDomain(inserted)
  })

/**
 * Deletes a sales contact by ID (Admin only).
 */
export const deleteSalesContactFn = createServerFn({ method: "POST" })
  .validator(salesContactIdInputSchema)
  .handler(async ({ data }) => {
    const { supabase } = await requireAdmin()

    const { data: deleted, error } = await supabase
      .from("sales_contacts")
      .delete()
      .eq("id", data.id)
      .select("id")
      .maybeSingle()

    if (error) {
      throw createHttpError(500, "Gagal menghapus kontak sales.")
    }

    if (!deleted) {
      throw notFound()
    }

    return {
      ok: true as const,
      deletedId: deleted.id,
    }
  })

/**
 * Updates `sort_order` for an ordered list of sales contact IDs (Admin only).
 */
export const reorderSalesContactsFn = createServerFn({ method: "POST" })
  .validator(reorderSalesContactsInputSchema)
  .handler(async ({ data }): Promise<SalesContact[]> => {
    const { supabase } = await requireAdmin()

    const results = await Promise.all(
      data.orderedIds.map((id, index) =>
        supabase
          .from("sales_contacts")
          .update({ sort_order: index })
          .eq("id", id)
      )
    )

    const failed = results.find((res) => res.error)
    if (failed?.error) {
      throw createHttpError(500, "Gagal memperbarui urutan kontak sales.")
    }

    const { data: salesRows, error: fetchError } = await supabase
      .from("sales_contacts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (fetchError) {
      throw createHttpError(500, "Gagal memuat ulang daftar kontak sales.")
    }

    return salesRows.map(mapDbSalesContactToDomain)
  })
