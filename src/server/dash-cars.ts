import type { SupabaseClient } from "@supabase/supabase-js"
import { notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import {
  pickUniqueSlug,
  slugifyCarName,
  slugifyText,
} from "@/lib/domain/formatters"
import {
  mapDbCarImageToDomain,
  mapDbCarToDomain,
  mapDomainCarToDbInsert,
  mapDomainCarToDbUpdate,
} from "@/lib/domain/mappers"
import {
  carFeaturedSchema,
  carQuickStatusSchema,
  carUpsertSchema,
  imageAngleTagSchema,
} from "@/lib/domain/schemas"
import type { CarImage, CarUnit } from "@/lib/domain/types"
import { deleteMediaObject, validateMediaKey } from "@/lib/r2.server"
import { requireAdmin, requireStaff } from "@/server/auth"
import type { Database } from "@/types/database"

type DbCarRow = Database["public"]["Tables"]["cars"]["Row"]
type DbCarImageRow = Database["public"]["Tables"]["car_images"]["Row"]
type DbCarCreditRow =
  Database["public"]["Tables"]["car_credit_simulations"]["Row"]

type DbCarWithRelations = DbCarRow & {
  car_images?: DbCarImageRow[] | null
  car_credit_simulations?: DbCarCreditRow[] | null
}

export interface DashCarsKpis {
  total: number
  ready: number
  booked: number
  sold: number
  draft: number
  archived: number
}

export interface DashCarsListResult {
  cars: CarUnit[]
  kpis: DashCarsKpis
}

const listDashCarsInputSchema = z
  .object({
    includeArchived: z.boolean().optional(),
  })
  .optional()

const carIdInputSchema = z.object({
  id: z.string().uuid("ID mobil tidak valid"),
})

const deleteCarImageInputSchema = z.object({
  id: z.string().uuid("ID foto tidak valid"),
  carId: z.string().uuid("ID mobil tidak valid").optional(),
})

const updateCarImagesOrderAndMetaSchema = z.object({
  carId: z.string().uuid("ID mobil tidak valid"),
  images: z.array(
    z.object({
      id: z.string().uuid("ID foto tidak valid"),
      sortOrder: z.number().int().nonnegative(),
      isCover: z.boolean(),
      alt: z.string().trim().min(1, "Teks alternatif (alt) wajib diisi"),
      angleTag: imageAngleTagSchema,
    })
  ),
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

function mapCarRowWithRelations(row: DbCarWithRelations): CarUnit {
  const { car_images, car_credit_simulations, ...carRow } = row
  return mapDbCarToDomain(
    carRow,
    car_images ?? [],
    car_credit_simulations ?? []
  )
}

function computeCarsKpis(rows: DbCarRow[]): DashCarsKpis {
  const kpis: DashCarsKpis = {
    total: rows.length,
    ready: 0,
    booked: 0,
    sold: 0,
    draft: 0,
    archived: 0,
  }

  for (const row of rows) {
    if (row.status === "ready") kpis.ready += 1
    else if (row.status === "booked") kpis.booked += 1
    else if (row.status === "sold") kpis.sold += 1
    else if (row.status === "draft") kpis.draft += 1
    else if (row.status === "archived") kpis.archived += 1
  }

  return kpis
}

async function fetchCarByIdOrThrow(
  supabase: SupabaseClient<Database>,
  carId: string
): Promise<CarUnit> {
  const { data, error } = await supabase
    .from("cars")
    .select("*, car_images(*), car_credit_simulations(*)")
    .eq("id", carId)
    .maybeSingle()

  if (error) {
    throw createHttpError(500, "Gagal memuat data unit mobil.")
  }

  if (!data) {
    throw notFound()
  }

  return mapCarRowWithRelations(data)
}

async function resolveUniqueCarSlug(
  supabase: SupabaseClient<Database>,
  rawSlug: string,
  excludeId?: string
): Promise<string> {
  const baseSlug = slugifyText(rawSlug) || "unit"
  let query = supabase
    .from("cars")
    .select("id, slug")
    .ilike("slug", `${baseSlug}%`)
  if (excludeId) {
    query = query.neq("id", excludeId)
  }

  const { data, error } = await query
  if (error) {
    throw createHttpError(500, "Gagal memeriksa keunikan slug unit mobil.")
  }

  return pickUniqueSlug(
    data.map((row) => row.slug),
    baseSlug,
    "unit"
  )
}

async function resolveFeaturedState(
  supabase: SupabaseClient<Database>,
  isFeatured: boolean,
  requestedOrder?: number | null,
  excludeCarId?: string
): Promise<{ isFeatured: boolean; featuredOrder: number | null }> {
  if (!isFeatured) {
    return { isFeatured: false, featuredOrder: null }
  }

  let query = supabase
    .from("cars")
    .select("id, featured_order")
    .eq("is_featured", true)

  if (excludeCarId) {
    query = query.neq("id", excludeCarId)
  }

  const { data, error } = await query
  if (error) {
    throw createHttpError(500, "Gagal memeriksa daftar mobil unggulan.")
  }

  const featuredRows = data
  if (featuredRows.length >= 3) {
    throw createHttpError(
      400,
      "Maksimal 3 unit dapat dijadikan mobil unggulan (featured). Nonaktifkan salah satu unit unggulan terlebih dahulu."
    )
  }

  const usedSlots = new Set<number>()
  for (const row of featuredRows) {
    if (
      row.featured_order !== null &&
      row.featured_order >= 1 &&
      row.featured_order <= 3
    ) {
      usedSlots.add(row.featured_order)
    }
  }

  if (
    requestedOrder !== null &&
    requestedOrder !== undefined &&
    requestedOrder >= 1 &&
    requestedOrder <= 3 &&
    !usedSlots.has(requestedOrder)
  ) {
    return { isFeatured: true, featuredOrder: requestedOrder }
  }

  const nextSlot = [1, 2, 3].find((slot) => !usedSlots.has(slot)) ?? 1
  return { isFeatured: true, featuredOrder: nextSlot }
}

/**
 * Lists inventory cars for the staff dashboard along with stock KPI counts.
 */
export const listDashCarsFn = createServerFn({ method: "GET" })
  .validator(listDashCarsInputSchema)
  .handler(async ({ data }): Promise<DashCarsListResult> => {
    const { supabase } = await requireStaff()

    const { data: rows, error } = await supabase
      .from("cars")
      .select("*, car_images(*), car_credit_simulations(*)")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })

    if (error) {
      throw createHttpError(500, "Gagal memuat daftar inventaris mobil.")
    }

    const allRows: DbCarWithRelations[] = rows
    const kpis = computeCarsKpis(allRows)
    const includeArchived = data?.includeArchived ?? true

    const filteredRows = includeArchived
      ? allRows
      : allRows.filter((row) => row.status !== "archived")

    return {
      cars: filteredRows.map(mapCarRowWithRelations),
      kpis,
    }
  })

/**
 * Fetches a single car unit by UUID for editing in the dashboard.
 */
export const getDashCarByIdFn = createServerFn({ method: "GET" })
  .validator(carIdInputSchema)
  .handler(async ({ data }): Promise<CarUnit> => {
    const { supabase } = await requireStaff()
    return fetchCarByIdOrThrow(supabase, data.id)
  })

/**
 * Creates a new car unit along with its credit simulations.
 */
export const createCarFn = createServerFn({ method: "POST" })
  .validator(carUpsertSchema)
  .handler(async ({ data }): Promise<CarUnit> => {
    const { supabase, user } = await requireStaff()

    const resolvedSlug = await resolveUniqueCarSlug(
      supabase,
      data.slug || slugifyCarName(data.name, data.year)
    )

    const featured =
      data.status === "archived"
        ? { isFeatured: false, featuredOrder: null }
        : await resolveFeaturedState(
            supabase,
            data.isFeatured,
            data.featuredOrder
          )

    const insertPayload = mapDomainCarToDbInsert(
      {
        ...data,
        slug: resolvedSlug,
        isFeatured: featured.isFeatured,
        featuredOrder: featured.featuredOrder,
      },
      user.id
    )

    const { data: insertedCar, error: insertError } = await supabase
      .from("cars")
      .insert(insertPayload)
      .select("id")
      .single()

    if (insertError) {
      if (insertError.code === "23505") {
        throw createHttpError(
          409,
          "Slug URL sudah digunakan oleh unit lain. Gunakan slug yang berbeda."
        )
      }
      throw createHttpError(500, "Gagal menyimpan unit mobil baru.")
    }

    if (data.creditSimulations.length > 0) {
      const creditRows = data.creditSimulations.map((item, index) => ({
        car_id: insertedCar.id,
        label: item.label,
        provider: item.provider || null,
        dp: item.dp,
        installment: item.installment,
        installment_label: item.installmentLabel,
        tenor_years: item.tenorYears,
        note: item.note || null,
        sort_order: item.sortOrder ?? index,
      }))

      const { error: creditError } = await supabase
        .from("car_credit_simulations")
        .insert(creditRows)

      if (creditError) {
        await supabase.from("cars").delete().eq("id", insertedCar.id)
        throw createHttpError(500, "Gagal menyimpan paket simulasi kredit.")
      }
    }

    return fetchCarByIdOrThrow(supabase, insertedCar.id)
  })

/**
 * Updates an existing car unit and replaces its credit simulations cleanly.
 */
export const updateCarFn = createServerFn({ method: "POST" })
  .validator(carUpsertSchema)
  .handler(async ({ data }): Promise<CarUnit> => {
    const { supabase } = await requireStaff()

    if (!data.id) {
      throw createHttpError(
        400,
        "ID mobil wajib disertakan untuk pembaruan unit."
      )
    }

    const carId = data.id

    const { data: existingCar, error: existingError } = await supabase
      .from("cars")
      .select("id")
      .eq("id", carId)
      .maybeSingle()

    if (existingError) {
      throw createHttpError(500, "Gagal memeriksa data unit mobil.")
    }

    if (!existingCar) {
      throw notFound()
    }

    const resolvedSlug = await resolveUniqueCarSlug(
      supabase,
      data.slug || slugifyCarName(data.name, data.year),
      carId
    )

    const featured =
      data.status === "archived"
        ? { isFeatured: false, featuredOrder: null }
        : await resolveFeaturedState(
            supabase,
            data.isFeatured,
            data.featuredOrder,
            carId
          )

    const updatePayload = mapDomainCarToDbUpdate({
      ...data,
      slug: resolvedSlug,
      isFeatured: featured.isFeatured,
      featuredOrder: featured.featuredOrder,
    })

    const { error: updateError } = await supabase
      .from("cars")
      .update(updatePayload)
      .eq("id", carId)

    if (updateError) {
      if (updateError.code === "23505") {
        throw createHttpError(
          409,
          "Slug URL sudah digunakan oleh unit lain. Gunakan slug yang berbeda."
        )
      }
      throw createHttpError(500, "Gagal memperbarui data unit mobil.")
    }

    const { error: deleteCreditsError } = await supabase
      .from("car_credit_simulations")
      .delete()
      .eq("car_id", carId)

    if (deleteCreditsError) {
      throw createHttpError(500, "Gagal memperbarui paket simulasi kredit.")
    }

    if (data.creditSimulations.length > 0) {
      const creditRows = data.creditSimulations.map((item, index) => ({
        car_id: carId,
        label: item.label,
        provider: item.provider || null,
        dp: item.dp,
        installment: item.installment,
        installment_label: item.installmentLabel,
        tenor_years: item.tenorYears,
        note: item.note || null,
        sort_order: item.sortOrder ?? index,
      }))

      const { error: insertCreditsError } = await supabase
        .from("car_credit_simulations")
        .insert(creditRows)

      if (insertCreditsError) {
        throw createHttpError(500, "Gagal menyimpan paket simulasi kredit.")
      }
    }

    return fetchCarByIdOrThrow(supabase, carId)
  })

/**
 * Quickly updates a car's stock status (clearing featured flag if archived).
 */
export const quickUpdateCarStatusFn = createServerFn({ method: "POST" })
  .validator(carQuickStatusSchema)
  .handler(async ({ data }): Promise<CarUnit> => {
    const { supabase } = await requireStaff()

    const updateFields =
      data.status === "archived"
        ? {
            status: data.status,
            is_featured: false,
            featured_order: null,
          }
        : { status: data.status }

    const { data: updated, error } = await supabase
      .from("cars")
      .update(updateFields)
      .eq("id", data.id)
      .select("id")
      .maybeSingle()

    if (error) {
      throw createHttpError(500, "Gagal memperbarui status unit mobil.")
    }

    if (!updated) {
      throw notFound()
    }

    return fetchCarByIdOrThrow(supabase, data.id)
  })

/**
 * Toggles a car's featured hero status while enforcing at most 3 featured units.
 */
export const toggleFeaturedCarFn = createServerFn({ method: "POST" })
  .validator(carFeaturedSchema)
  .handler(async ({ data }): Promise<CarUnit> => {
    const { supabase } = await requireStaff()

    const { data: targetCar, error: fetchError } = await supabase
      .from("cars")
      .select("id, status")
      .eq("id", data.id)
      .maybeSingle()

    if (fetchError) {
      throw createHttpError(500, "Gagal memeriksa data unit mobil.")
    }

    if (!targetCar) {
      throw notFound()
    }

    if (data.isFeatured && targetCar.status === "archived") {
      throw createHttpError(
        400,
        "Unit yang diarsipkan tidak dapat dijadikan mobil unggulan."
      )
    }

    const featured = await resolveFeaturedState(
      supabase,
      data.isFeatured,
      data.featuredOrder,
      data.id
    )

    const { error: updateError } = await supabase
      .from("cars")
      .update({
        is_featured: featured.isFeatured,
        featured_order: featured.featuredOrder,
      })
      .eq("id", data.id)

    if (updateError) {
      throw createHttpError(500, "Gagal memperbarui status mobil unggulan.")
    }

    return fetchCarByIdOrThrow(supabase, data.id)
  })

/**
 * Archives a car unit and removes it from featured slots.
 */
export const archiveCarFn = createServerFn({ method: "POST" })
  .validator(carIdInputSchema)
  .handler(async ({ data }): Promise<CarUnit> => {
    const { supabase } = await requireStaff()

    const { data: updated, error } = await supabase
      .from("cars")
      .update({
        status: "archived",
        is_featured: false,
        featured_order: null,
      })
      .eq("id", data.id)
      .select("id")
      .maybeSingle()

    if (error) {
      throw createHttpError(500, "Gagal mengarsipkan unit mobil.")
    }

    if (!updated) {
      throw notFound()
    }

    return fetchCarByIdOrThrow(supabase, data.id)
  })

/**
 * Permanently deletes a car unit (Admin only) and cleans up all associated R2 media objects.
 */
export const deleteCarPermanentlyFn = createServerFn({ method: "POST" })
  .validator(carIdInputSchema)
  .handler(async ({ data }) => {
    const { supabase } = await requireAdmin()

    const { data: imageRows, error: imagesError } = await supabase
      .from("car_images")
      .select("r2_key")
      .eq("car_id", data.id)

    if (imagesError) {
      throw createHttpError(500, "Gagal mengambil data foto unit mobil.")
    }

    const { data: deletedCar, error: deleteError } = await supabase
      .from("cars")
      .delete()
      .eq("id", data.id)
      .select("id")
      .maybeSingle()

    if (deleteError) {
      throw createHttpError(500, "Gagal menghapus unit mobil secara permanen.")
    }

    if (!deletedCar) {
      throw notFound()
    }

    const validKeys = imageRows
      .map((row) => row.r2_key)
      .filter((key) => Boolean(validateMediaKey(key)))

    const r2Results = await Promise.allSettled(
      validKeys.map((key) => deleteMediaObject(key))
    )

    const failedDeletes = r2Results.filter(
      (result) => result.status === "rejected"
    )
    if (failedDeletes.length > 0) {
      console.error(
        `[deleteCarPermanentlyFn] Failed to delete ${failedDeletes.length} R2 object(s) for car ${data.id}`
      )
    }

    return {
      ok: true as const,
      deletedId: data.id,
      deletedMediaCount: validKeys.length - failedDeletes.length,
    }
  })

/**
 * Updates sort order, cover flag, alt text, and angle tag for a car's images,
 * enforcing a single cover image per car.
 */
export const updateCarImagesOrderAndMetaFn = createServerFn({ method: "POST" })
  .validator(updateCarImagesOrderAndMetaSchema)
  .handler(async ({ data }): Promise<CarImage[]> => {
    const { supabase } = await requireStaff()

    const { data: carRow, error: carError } = await supabase
      .from("cars")
      .select("id")
      .eq("id", data.carId)
      .maybeSingle()

    if (carError) {
      throw createHttpError(500, "Gagal memeriksa data unit mobil.")
    }

    if (!carRow) {
      throw notFound()
    }

    let seenCover = false
    const normalizedImages = data.images.map((item) => {
      if (item.isCover && !seenCover) {
        seenCover = true
        return item
      }
      return { ...item, isCover: false }
    })

    const chosenCover = normalizedImages.find((item) => item.isCover)

    if (chosenCover) {
      const { error: resetError } = await supabase
        .from("car_images")
        .update({ is_cover: false })
        .eq("car_id", data.carId)
        .neq("id", chosenCover.id)

      if (resetError) {
        throw createHttpError(500, "Gagal memperbarui status foto cover.")
      }
    }

    if (normalizedImages.length > 0) {
      const updateResults = await Promise.all(
        normalizedImages.map((item) =>
          supabase
            .from("car_images")
            .update({
              sort_order: item.sortOrder,
              is_cover: item.isCover,
              alt: item.alt,
              angle_tag: item.angleTag,
            })
            .eq("id", item.id)
            .eq("car_id", data.carId)
        )
      )

      const failedUpdate = updateResults.find((res) => res.error)
      if (failedUpdate?.error) {
        throw createHttpError(500, "Gagal memperbarui metadata foto mobil.")
      }
    }

    const { data: refreshedRows, error: fetchError } = await supabase
      .from("car_images")
      .select("*")
      .eq("car_id", data.carId)
      .order("sort_order", { ascending: true })

    if (fetchError) {
      throw createHttpError(500, "Gagal memuat ulang daftar foto mobil.")
    }

    let finalRows = refreshedRows
    if (finalRows.length > 0 && !finalRows.some((row) => row.is_cover)) {
      const firstRow = finalRows[0]
      const { error: promoteError } = await supabase
        .from("car_images")
        .update({ is_cover: true })
        .eq("id", firstRow.id)
        .eq("car_id", data.carId)

      if (promoteError) {
        throw createHttpError(500, "Gagal menetapkan foto cover utama.")
      }

      finalRows = finalRows.map((row, idx) =>
        idx === 0 ? { ...row, is_cover: true } : row
      )
    }

    return [...finalRows]
      .sort((a, b) => {
        if (a.is_cover !== b.is_cover) {
          return a.is_cover ? -1 : 1
        }
        return a.sort_order - b.sort_order
      })
      .map(mapDbCarImageToDomain)
  })

/**
 * Deletes a single car image from Supabase and Cloudflare R2, promoting a fallback cover if needed.
 */
export const deleteCarImageFn = createServerFn({ method: "POST" })
  .validator(deleteCarImageInputSchema)
  .handler(async ({ data }) => {
    const { supabase } = await requireStaff()

    let fetchQuery = supabase
      .from("car_images")
      .select("id, car_id, r2_key, is_cover")
      .eq("id", data.id)

    if (data.carId) {
      fetchQuery = fetchQuery.eq("car_id", data.carId)
    }

    const { data: imageRow, error: fetchError } = await fetchQuery.maybeSingle()

    if (fetchError) {
      throw createHttpError(500, "Gagal memeriksa data foto mobil.")
    }

    if (!imageRow) {
      throw notFound()
    }

    const { error: deleteError } = await supabase
      .from("car_images")
      .delete()
      .eq("id", imageRow.id)

    if (deleteError) {
      throw createHttpError(500, "Gagal menghapus foto mobil dari database.")
    }

    if (validateMediaKey(imageRow.r2_key)) {
      try {
        await deleteMediaObject(imageRow.r2_key)
      } catch (err) {
        console.error(
          `[deleteCarImageFn] Failed to delete R2 object ${imageRow.r2_key}:`,
          err
        )
      }
    }

    if (imageRow.is_cover) {
      const { data: nextImage } = await supabase
        .from("car_images")
        .select("id")
        .eq("car_id", imageRow.car_id)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle()

      if (nextImage) {
        await supabase
          .from("car_images")
          .update({ is_cover: true })
          .eq("id", nextImage.id)
      }
    }

    return {
      ok: true as const,
      deletedId: imageRow.id,
      carId: imageRow.car_id,
    }
  })
