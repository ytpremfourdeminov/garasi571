import { createFileRoute } from "@tanstack/react-router"
import { z } from "zod"
import { imageAngleTagSchema } from "@/lib/domain/schemas"
import { deleteMediaObject, putMediaObject } from "@/lib/r2.server"
import { getSupabaseServerClient } from "@/lib/supabase.server"
import type { Database } from "@/types/database"

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024

const ALLOWED_MIME_EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
}

const uuidSchema = z.uuid()
const mediaScopeSchema = z.enum(["cars", "brand"])

function jsonError(status: number, error: string): Response {
  return Response.json({ error }, { status })
}

function extractHostname(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")
  const rawHost =
    (forwardedHost ? forwardedHost.split(",")[0] : null) ??
    request.headers.get("host")

  if (rawHost) {
    const cleaned = rawHost.trim().toLowerCase()
    if (cleaned.startsWith("[")) {
      const closingIdx = cleaned.indexOf("]")
      return closingIdx >= 0 ? cleaned.slice(0, closingIdx + 1) : cleaned
    }
    return cleaned.split(":")[0] ?? ""
  }

  try {
    return new URL(request.url).hostname.toLowerCase()
  } catch {
    return ""
  }
}

function isDashHostname(hostname: string): boolean {
  return hostname === "dash.localhost" || hostname.startsWith("dash.")
}

function getOptionalString(
  formData: FormData,
  key: string
): string | undefined {
  const value = formData.get(key)
  if (typeof value !== "string") {
    return undefined
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function parseOptionalInt(
  formData: FormData,
  key: string,
  min: number,
  defaultValue: number
): { ok: true; value: number } | { ok: false; error: string } {
  const raw = getOptionalString(formData, key)
  if (raw === undefined) {
    return { ok: true, value: defaultValue }
  }
  const parsed = Number(raw)
  if (!Number.isInteger(parsed) || parsed < min) {
    return {
      ok: false,
      error: `Field ${key} must be an integer >= ${min}`,
    }
  }
  return { ok: true, value: parsed }
}

function parseOptionalBoolean(
  formData: FormData,
  key: string,
  defaultValue: boolean
): { ok: true; value: boolean } | { ok: false; error: string } {
  const raw = getOptionalString(formData, key)
  if (raw === undefined) {
    return { ok: true, value: defaultValue }
  }
  const normalized = raw.toLowerCase()
  if (normalized === "true" || normalized === "1") {
    return { ok: true, value: true }
  }
  if (normalized === "false" || normalized === "0") {
    return { ok: true, value: false }
  }
  return { ok: false, error: `Field ${key} must be a boolean` }
}

export const Route = createFileRoute("/api/dash/media/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const hostname = extractHostname(request)
        if (!isDashHostname(hostname)) {
          return jsonError(404, "Not found")
        }

        const supabase = getSupabaseServerClient<Database>()
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
          return jsonError(401, "Unauthorized")
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("id, role, is_active")
          .eq("id", user.id)
          .eq("is_active", true)
          .in("role", ["admin", "sales"])
          .maybeSingle()

        if (profileError) {
          return jsonError(500, "Failed to verify staff profile")
        }
        if (!profile) {
          return jsonError(
            403,
            "Forbidden: inactive or unauthorized staff account"
          )
        }

        let formData: FormData
        try {
          formData = await request.formData()
        } catch {
          return jsonError(400, "Invalid multipart/form-data payload")
        }

        const fileEntry = formData.get("file")
        if (!(fileEntry instanceof Blob)) {
          return jsonError(400, "Missing image file")
        }
        if (fileEntry.size <= 0) {
          return jsonError(400, "Image file is empty")
        }
        if (fileEntry.size > MAX_FILE_SIZE_BYTES) {
          return jsonError(400, "Image file exceeds maximum size of 5 MB")
        }

        const mimeType = fileEntry.type.toLowerCase()
        const ext = ALLOWED_MIME_EXTENSIONS[mimeType]
        if (!ext) {
          return jsonError(
            400,
            "Unsupported image format. Allowed: image/webp, image/jpeg, image/png"
          )
        }

        const scopeParsed = mediaScopeSchema.safeParse(
          getOptionalString(formData, "scope")
        )
        if (!scopeParsed.success) {
          return jsonError(400, "Field scope must be 'cars' or 'brand'")
        }
        const scope = scopeParsed.data

        const rawCarId = getOptionalString(formData, "carId")
        if (rawCarId !== undefined && !uuidSchema.safeParse(rawCarId).success) {
          return jsonError(400, "Field carId must be a valid UUID")
        }
        const carId = scope === "cars" ? rawCarId : undefined

        const rawAngleTag = getOptionalString(formData, "angleTag")
        let angleTag: z.infer<typeof imageAngleTagSchema> = "lainnya"
        if (rawAngleTag !== undefined) {
          const parsedAngle = imageAngleTagSchema.safeParse(rawAngleTag)
          if (!parsedAngle.success) {
            return jsonError(400, "Invalid angleTag value")
          }
          angleTag = parsedAngle.data
        }

        const widthResult = parseOptionalInt(formData, "width", 1, 1280)
        if (!widthResult.ok) {
          return jsonError(400, widthResult.error)
        }

        const heightResult = parseOptionalInt(formData, "height", 1, 1280)
        if (!heightResult.ok) {
          return jsonError(400, heightResult.error)
        }

        const sortOrderResult = parseOptionalInt(formData, "sortOrder", 0, 0)
        if (!sortOrderResult.ok) {
          return jsonError(400, sortOrderResult.error)
        }

        const isCoverResult = parseOptionalBoolean(formData, "isCover", false)
        if (!isCoverResult.ok) {
          return jsonError(400, isCoverResult.error)
        }

        const alt = getOptionalString(formData, "alt") ?? "Foto unit Garasi 571"

        const r2Key =
          scope === "cars"
            ? `cars/${carId ?? "drafts"}/${crypto.randomUUID()}.${ext}`
            : `brand/logo-${crypto.randomUUID()}.${ext}`
        const url = `/media/${r2Key}`

        const body = await fileEntry.arrayBuffer()
        await putMediaObject(r2Key, body, mimeType, {
          scope,
          ...(carId ? { carId } : {}),
          uploadedBy: user.id,
        })

        let imageId: string | undefined
        if (scope === "cars" && carId) {
          const { data: insertedImage, error: insertError } = await supabase
            .from("car_images")
            .insert({
              car_id: carId,
              r2_key: r2Key,
              url,
              width: widthResult.value,
              height: heightResult.value,
              alt,
              angle_tag: angleTag,
              sort_order: sortOrderResult.value,
              is_cover: isCoverResult.value,
            })
            .select("id")
            .single()

          if (insertError) {
            try {
              await deleteMediaObject(r2Key)
            } catch {
              // Best-effort rollback when DB insert fails.
            }
            return jsonError(500, "Failed to save car image metadata")
          }

          imageId = insertedImage.id
        }

        return Response.json(
          {
            r2Key,
            url,
            width: widthResult.value,
            height: heightResult.value,
            fileSizeBytes: fileEntry.size,
            mimeType,
            ...(imageId ? { imageId } : {}),
          },
          { status: 200 }
        )
      },
    },
  },
})
