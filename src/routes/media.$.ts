import { createFileRoute } from "@tanstack/react-router"
import { getMediaObject, validateMediaKey } from "@/lib/r2.server"

const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable"

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
}

function inferContentTypeFromKey(key: string): string {
  const ext = key.split(".").pop()?.toLowerCase() ?? ""
  return EXTENSION_CONTENT_TYPES[ext] ?? "application/octet-stream"
}

function normalizeEtag(tag: string): string {
  const trimmed = tag.trim()
  const withoutWeak = trimmed.startsWith("W/")
    ? trimmed.slice(2).trim()
    : trimmed
  return withoutWeak.replace(/^"+|"+$/g, "")
}

function matchesIfNoneMatch(
  ifNoneMatchHeader: string | null,
  httpEtag: string
): boolean {
  if (!ifNoneMatchHeader) {
    return false
  }
  const trimmed = ifNoneMatchHeader.trim()
  if (trimmed === "*") {
    return true
  }

  const target = normalizeEtag(httpEtag)
  if (!target) {
    return false
  }

  return trimmed
    .split(",")
    .some((candidate) => normalizeEtag(candidate) === target)
}

export const Route = createFileRoute("/media/$")({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const rawKey = params._splat ?? ""
        const validKey = validateMediaKey(rawKey)

        if (!validKey) {
          return new Response("Invalid media key", { status: 400 })
        }

        const object = await getMediaObject(validKey)
        if (!object) {
          return new Response("Media not found", { status: 404 })
        }

        const baseHeaders: Record<string, string> = {
          ETag: object.httpEtag,
          "Cache-Control": IMMUTABLE_CACHE_CONTROL,
          "X-Content-Type-Options": "nosniff",
        }

        if (
          matchesIfNoneMatch(
            request.headers.get("if-none-match"),
            object.httpEtag
          )
        ) {
          await object.body.cancel().catch(() => {})
          return new Response(null, {
            status: 304,
            headers: baseHeaders,
          })
        }

        const contentType =
          object.httpMetadata?.contentType || inferContentTypeFromKey(validKey)

        return new Response(object.body, {
          status: 200,
          headers: {
            ...baseHeaders,
            "Content-Type": contentType,
            "Content-Length": String(object.size),
          },
        })
      },
    },
  },
})
