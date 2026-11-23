import { notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { mapDbFaqToDomain } from "@/lib/domain/mappers"
import { faqUpsertSchema } from "@/lib/domain/schemas"
import type { ShowroomFaqItem } from "@/lib/domain/types"
import { requireStaff } from "@/server/auth"

const faqIdInputSchema = z.object({
  id: z.string().uuid("ID FAQ tidak valid"),
})

const reorderFaqsInputSchema = z.object({
  orderedIds: z
    .array(z.string().uuid("ID FAQ tidak valid"))
    .min(1, "Daftar urutan FAQ tidak boleh kosong")
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Terdapat duplikasi ID FAQ dalam urutan.",
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
 * Lists all showroom FAQs (published and draft) ordered by `sort_order`.
 */
export const listDashFaqsFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShowroomFaqItem[]> => {
    const { supabase } = await requireStaff()

    const { data, error } = await supabase
      .from("showroom_faqs")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (error) {
      throw createHttpError(500, "Gagal memuat daftar FAQ showroom.")
    }

    return data.map(mapDbFaqToDomain)
  }
)

/**
 * Creates or updates a showroom FAQ entry.
 */
export const upsertFaqFn = createServerFn({ method: "POST" })
  .validator(faqUpsertSchema)
  .handler(async ({ data }): Promise<ShowroomFaqItem> => {
    const { supabase } = await requireStaff()

    let slugQuery = supabase
      .from("showroom_faqs")
      .select("id")
      .eq("slug", data.slug)
      .limit(1)

    if (data.id) {
      slugQuery = slugQuery.neq("id", data.id)
    }

    const { data: duplicateSlug, error: slugError } =
      await slugQuery.maybeSingle()

    if (slugError) {
      throw createHttpError(500, "Gagal memeriksa keunikan slug FAQ.")
    }

    if (duplicateSlug) {
      throw createHttpError(
        409,
        "Slug FAQ sudah digunakan. Gunakan slug yang berbeda."
      )
    }

    if (data.id) {
      const { data: existing, error: existingError } = await supabase
        .from("showroom_faqs")
        .select("id")
        .eq("id", data.id)
        .maybeSingle()

      if (existingError) {
        throw createHttpError(500, "Gagal memeriksa data FAQ.")
      }

      if (!existing) {
        throw notFound()
      }

      const { data: updated, error: updateError } = await supabase
        .from("showroom_faqs")
        .update({
          slug: data.slug,
          question: data.question,
          answer: data.answer,
          is_published: data.isPublished,
          sort_order: data.sortOrder,
        })
        .eq("id", data.id)
        .select("*")
        .single()

      if (updateError) {
        if (updateError.code === "23505") {
          throw createHttpError(
            409,
            "Slug FAQ sudah digunakan. Gunakan slug yang berbeda."
          )
        }
        throw createHttpError(500, "Gagal memperbarui FAQ.")
      }

      return mapDbFaqToDomain(updated)
    }

    const { data: inserted, error: insertError } = await supabase
      .from("showroom_faqs")
      .insert({
        slug: data.slug,
        question: data.question,
        answer: data.answer,
        is_published: data.isPublished,
        sort_order: data.sortOrder,
      })
      .select("*")
      .single()

    if (insertError) {
      if (insertError.code === "23505") {
        throw createHttpError(
          409,
          "Slug FAQ sudah digunakan. Gunakan slug yang berbeda."
        )
      }
      throw createHttpError(500, "Gagal menambahkan FAQ baru.")
    }

    return mapDbFaqToDomain(inserted)
  })

/**
 * Deletes a showroom FAQ by ID.
 */
export const deleteFaqFn = createServerFn({ method: "POST" })
  .validator(faqIdInputSchema)
  .handler(async ({ data }) => {
    const { supabase } = await requireStaff()

    const { data: deleted, error } = await supabase
      .from("showroom_faqs")
      .delete()
      .eq("id", data.id)
      .select("id")
      .maybeSingle()

    if (error) {
      throw createHttpError(500, "Gagal menghapus FAQ.")
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
 * Updates `sort_order` for an ordered list of FAQ IDs.
 */
export const reorderFaqsFn = createServerFn({ method: "POST" })
  .validator(reorderFaqsInputSchema)
  .handler(async ({ data }): Promise<ShowroomFaqItem[]> => {
    const { supabase } = await requireStaff()

    const results = await Promise.all(
      data.orderedIds.map((id, index) =>
        supabase
          .from("showroom_faqs")
          .update({ sort_order: index })
          .eq("id", id)
      )
    )

    const failed = results.find((res) => res.error)
    if (failed?.error) {
      throw createHttpError(500, "Gagal memperbarui urutan FAQ.")
    }

    const { data: faqRows, error: fetchError } = await supabase
      .from("showroom_faqs")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true })

    if (fetchError) {
      throw createHttpError(500, "Gagal memuat ulang daftar FAQ.")
    }

    return faqRows.map(mapDbFaqToDomain)
  })
