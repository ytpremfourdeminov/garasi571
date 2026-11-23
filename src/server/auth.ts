import type { SupabaseClient, User } from "@supabase/supabase-js"
import { notFound } from "@tanstack/react-router"
import { createServerFn, createServerOnlyFn } from "@tanstack/react-start"
import { getRequest, getRequestHeader } from "@tanstack/react-start/server"
import { z } from "zod"
import { mapDbProfileToDomain } from "@/lib/domain/mappers"
import type { StaffProfile } from "@/lib/domain/types"
import { extractHostname, isDashHostname } from "@/lib/host"
import { getSupabaseServerClient } from "@/lib/supabase.server"
import type { Database } from "@/types/database"

export interface StaffSession {
  supabase: SupabaseClient<Database>
  user: User
  profile: StaffProfile
}

export type LoginWithPasswordResult =
  | {
      ok: true
      profile: StaffProfile
    }
  | {
      ok: false
      error: string
    }

const loginPayloadShapeSchema = z.object({
  email: z.string(),
  password: z.string(),
})

const loginCredentialsSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email staf wajib diisi.")
    .pipe(z.email("Format email tidak valid.")),
  password: z.string().min(1, "Kata sandi wajib diisi."),
})

function createAuthHttpError(status: 401 | 403, message: string): Error {
  const err = new Error(message) as Error & {
    status: number
    statusCode: number
  }
  err.status = status
  err.statusCode = status
  return err
}

/**
 * Ensures the active request targets the `dash.*` subdomain.
 * Throws a TanStack Router 404 (`notFound()`) on non-dashboard hosts.
 */
export const requireDashHost = createServerOnlyFn((): string => {
  const forwardedHost = getRequestHeader("x-forwarded-host")
  let hostname = forwardedHost ? extractHostname(forwardedHost) : ""

  if (!hostname) {
    const hostHeader = getRequestHeader("host")
    hostname = hostHeader ? extractHostname(hostHeader) : ""
  }

  if (!hostname) {
    hostname = extractHostname(getRequest().url)
  }

  if (!isDashHostname(hostname)) {
    throw notFound()
  }

  return hostname
})

export const assertDashHost = requireDashHost

const loadActiveProfile = createServerOnlyFn(
  async (
    supabase: SupabaseClient<Database>,
    userId: string
  ): Promise<StaffProfile | null> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .eq("is_active", true)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    return mapDbProfileToDomain(data)
  }
)

/**
 * Server helper for protected dashboard mutations and queries.
 * Verifies `dash.*` host, Supabase session, and active staff profile.
 */
export const requireStaff = createServerOnlyFn(
  async (): Promise<StaffSession> => {
    requireDashHost()

    const supabase = getSupabaseServerClient<Database>()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      throw createAuthHttpError(
        401,
        "Sesi login tidak valid atau telah berakhir. Silakan masuk kembali."
      )
    }

    const profile = await loadActiveProfile(supabase, user.id)
    if (!profile) {
      throw createAuthHttpError(
        403,
        "Akun Anda tidak memiliki akses staf aktif di Garasi 571."
      )
    }

    return { supabase, user, profile }
  }
)

/**
 * Server helper for admin-only dashboard mutations and queries.
 */
export const requireAdmin = createServerOnlyFn(
  async (): Promise<StaffSession> => {
    const session = await requireStaff()
    if (session.profile.role !== "admin") {
      throw createAuthHttpError(
        403,
        "Akses ditolak. Fitur ini hanya tersedia untuk Admin Garasi 571."
      )
    }
    return session
  }
)

/**
 * Lightweight host check server function for SSR route guards.
 */
export const checkDashHostFn = createServerFn({ method: "GET" }).handler(
  async () => {
    requireDashHost()
    return { ok: true as const }
  }
)

/**
 * Returns the currently signed-in active staff profile, or `null` if unauthenticated.
 * Enforces the `dash.*` subdomain (throws 404 on public host).
 */
export const getCurrentStaffFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<StaffProfile | null> => {
    requireDashHost()

    const supabase = getSupabaseServerClient<Database>()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return null
    }

    return loadActiveProfile(supabase, user.id)
  }
)

/**
 * Signs in a staff member via Supabase Auth email & password and verifies that
 * their `profiles` record exists and has `is_active = true`.
 */
export const loginWithPasswordFn = createServerFn({ method: "POST" })
  .validator((input: unknown) => loginPayloadShapeSchema.parse(input))
  .handler(async ({ data }): Promise<LoginWithPasswordResult> => {
    requireDashHost()

    const parsed = loginCredentialsSchema.safeParse(data)
    if (!parsed.success) {
      return {
        ok: false,
        error:
          parsed.error.issues[0]?.message ??
          "Periksa kembali email dan kata sandi Anda.",
      }
    }

    const supabase = getSupabaseServerClient<Database>()
    const { data: authData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      })

    if (signInError) {
      const normalizedMessage = signInError.message.toLowerCase()
      if (normalizedMessage.includes("email not confirmed")) {
        return {
          ok: false,
          error:
            "Email akun belum diverifikasi. Hubungi Admin Garasi 571 untuk aktivasi.",
        }
      }
      return {
        ok: false,
        error:
          "Email atau kata sandi salah. Periksa kembali kredensial staf Anda.",
      }
    }

    const user = authData.user
    const { data: profileRow, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError || !profileRow) {
      await supabase.auth.signOut()
      return {
        ok: false,
        error:
          "Profil staf belum terdaftar. Hubungi Admin Garasi 571 untuk aktivasi akun.",
      }
    }

    if (!profileRow.is_active) {
      await supabase.auth.signOut()
      return {
        ok: false,
        error: "Akun staf Anda sedang dinonaktifkan. Hubungi Admin Garasi 571.",
      }
    }

    return {
      ok: true,
      profile: mapDbProfileToDomain(profileRow),
    }
  })

/**
 * Signs out the active staff member and clears Supabase SSR session cookies.
 */
export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  requireDashHost()

  const supabase = getSupabaseServerClient<Database>()
  await supabase.auth.signOut()

  return { ok: true as const }
})
