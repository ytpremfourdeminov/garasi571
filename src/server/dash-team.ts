import { notFound } from "@tanstack/react-router"
import { createServerFn } from "@tanstack/react-start"
import { mapDbProfileToDomain } from "@/lib/domain/mappers"
import { staffProfileUpdateSchema } from "@/lib/domain/schemas"
import type { StaffProfile } from "@/lib/domain/types"
import { requireAdmin } from "@/server/auth"

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
 * Lists all staff profiles ordered by creation date ascending (Admin only).
 */
export const listTeamProfilesFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<StaffProfile[]> => {
    const { supabase } = await requireAdmin()

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      throw createHttpError(500, "Gagal memuat daftar anggota tim.")
    }

    return data.map(mapDbProfileToDomain)
  }
)

/**
 * Updates a staff profile's role, active status, and optional full name (Admin only).
 * Guards against demoting or deactivating the last active admin (including self-lockout).
 */
export const updateStaffProfileFn = createServerFn({ method: "POST" })
  .validator(staffProfileUpdateSchema)
  .handler(async ({ data }): Promise<StaffProfile> => {
    const { supabase, user } = await requireAdmin()

    const { data: targetProfile, error: targetError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.id)
      .maybeSingle()

    if (targetError) {
      throw createHttpError(500, "Gagal memeriksa data profil staf.")
    }

    if (!targetProfile) {
      throw notFound()
    }

    const wasActiveAdmin =
      targetProfile.role === "admin" && targetProfile.is_active
    const willRemainActiveAdmin = data.role === "admin" && data.isActive

    if (wasActiveAdmin && !willRemainActiveAdmin) {
      const { count, error: countError } = await supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin")
        .eq("is_active", true)
        .neq("id", data.id)

      if (countError) {
        throw createHttpError(500, "Gagal memverifikasi jumlah admin aktif.")
      }

      if ((count ?? 0) === 0) {
        if (data.id === user.id) {
          throw createHttpError(
            400,
            "Anda adalah satu-satunya Admin aktif. Tidak dapat menurunkan peran atau menonaktifkan akun Anda sendiri."
          )
        }
        throw createHttpError(
          400,
          "Minimal harus ada satu Admin aktif di Garasi 571. Aktifkan atau promosikan Admin lain terlebih dahulu."
        )
      }
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from("profiles")
      .update({
        role: data.role,
        is_active: data.isActive,
        ...(data.fullName !== undefined ? { full_name: data.fullName } : {}),
      })
      .eq("id", data.id)
      .select("*")
      .single()

    if (updateError) {
      throw createHttpError(500, "Gagal memperbarui profil staf.")
    }

    return mapDbProfileToDomain(updatedProfile)
  })
