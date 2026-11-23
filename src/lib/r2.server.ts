import {
  getMediaBucket,
  type R2Object,
  type R2ObjectBody,
} from "@/lib/env.server"

const ALLOWED_MEDIA_PREFIXES = ["cars/", "brand/"] as const
const IMMUTABLE_CACHE_CONTROL = "public, max-age=31536000, immutable"

export type MediaBody =
  | ReadableStream<Uint8Array>
  | ArrayBuffer
  | ArrayBufferView
  | string
  | Blob
  | null

function hasControlChar(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i)
    if (code <= 0x1f || code === 0x7f) {
      return true
    }
  }
  return false
}

/**
 * Validates that an R2 media key is safe and scoped under `cars/` or `brand/`.
 * Returns the validated key or `null` when invalid.
 */
export function validateMediaKey(key: string): string | null {
  if (typeof key !== "string" || key.length === 0) {
    return null
  }
  if (key.trim() !== key || key.startsWith("/") || key.includes("\\")) {
    return null
  }
  if (key.includes("..") || hasControlChar(key)) {
    return null
  }
  if (!ALLOWED_MEDIA_PREFIXES.some((prefix) => key.startsWith(prefix))) {
    return null
  }

  const segments = key.split("/")
  if (
    segments.length < 2 ||
    segments.some(
      (segment) => segment.length === 0 || segment === "." || segment === ".."
    )
  ) {
    return null
  }

  return key
}

function requireValidMediaKey(key: string): string {
  const validKey = validateMediaKey(key)
  if (!validKey) {
    throw new Error(`Invalid R2 media key: ${key}`)
  }
  return validKey
}

/**
 * Stores a media object in Cloudflare R2 with immutable cache metadata.
 */
export async function putMediaObject(
  key: string,
  body: MediaBody,
  contentType: string,
  customMetadata?: Record<string, string>
): Promise<R2Object | null> {
  const validKey = requireValidMediaKey(key)
  const bucket = getMediaBucket()

  return bucket.put(validKey, body, {
    httpMetadata: {
      contentType,
      cacheControl: IMMUTABLE_CACHE_CONTROL,
    },
    ...(customMetadata ? { customMetadata } : {}),
  })
}

/**
 * Retrieves a media object body from Cloudflare R2.
 */
export async function getMediaObject(
  key: string
): Promise<R2ObjectBody | null> {
  const validKey = requireValidMediaKey(key)
  const bucket = getMediaBucket()
  return bucket.get(validKey)
}

/**
 * Deletes a media object from Cloudflare R2.
 */
export async function deleteMediaObject(key: string): Promise<void> {
  const validKey = requireValidMediaKey(key)
  const bucket = getMediaBucket()
  await bucket.delete(validKey)
}
