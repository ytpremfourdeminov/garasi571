export interface R2Range {
  offset?: number
  length?: number
  suffix?: number
}

export interface R2Checksums {
  readonly md5?: ArrayBuffer
  readonly sha1?: ArrayBuffer
  readonly sha256?: ArrayBuffer
  readonly sha384?: ArrayBuffer
  readonly sha512?: ArrayBuffer
  toJSON: () => Record<string, string>
}

export interface R2HTTPMetadata {
  contentType?: string
  contentLanguage?: string
  contentDisposition?: string
  contentEncoding?: string
  cacheControl?: string
  cacheExpiry?: Date
}

export interface R2Conditional {
  etagMatches?: string
  etagDoesNotMatch?: string
  uploadedBefore?: Date
  uploadedAfter?: Date
}

export interface R2GetOptions {
  onlyIf?: R2Conditional | Headers
  range?: R2Range | Headers
}

export interface R2PutOptions {
  onlyIf?: R2Conditional | Headers
  httpMetadata?: R2HTTPMetadata | Headers
  customMetadata?: Record<string, string>
  md5?: ArrayBuffer | ArrayBufferView | string
  sha1?: ArrayBuffer | ArrayBufferView | string
  sha256?: ArrayBuffer | ArrayBufferView | string
  sha384?: ArrayBuffer | ArrayBufferView | string
  sha512?: ArrayBuffer | ArrayBufferView | string
  storageClass?: "Standard" | "InfrequentAccess"
}

export interface R2ListOptions {
  limit?: number
  prefix?: string
  cursor?: string
  delimiter?: string
  include?: Array<"httpMetadata" | "customMetadata">
}

export interface R2Object {
  readonly key: string
  readonly version: string
  readonly size: number
  readonly etag: string
  readonly httpEtag: string
  readonly checksums: R2Checksums
  readonly uploaded: Date
  readonly httpMetadata?: R2HTTPMetadata
  readonly customMetadata?: Record<string, string>
  readonly range?: R2Range
  readonly storageClass: string
  writeHttpMetadata: (headers: Headers) => void
}

export interface R2ObjectBody extends R2Object {
  readonly body: ReadableStream<Uint8Array>
  readonly bodyUsed: boolean
  arrayBuffer: () => Promise<ArrayBuffer>
  bytes: () => Promise<Uint8Array>
  text: () => Promise<string>
  json: <T = unknown>() => Promise<T>
  blob: () => Promise<Blob>
}

export interface R2Objects {
  readonly objects: R2Object[]
  readonly truncated: boolean
  readonly cursor?: string
  readonly delimitedPrefixes: string[]
}

export interface R2Bucket {
  head: (key: string) => Promise<R2Object | null>
  get: ((
    key: string,
    options: R2GetOptions & { onlyIf: R2Conditional | Headers }
  ) => Promise<R2ObjectBody | R2Object | null>) &
    ((key: string, options?: R2GetOptions) => Promise<R2ObjectBody | null>)
  put: (
    key: string,
    value:
      | ReadableStream<Uint8Array>
      | ArrayBuffer
      | ArrayBufferView
      | string
      | Blob
      | null,
    options?: R2PutOptions
  ) => Promise<R2Object | null>
  delete: (keys: string | string[]) => Promise<void>
  list: (options?: R2ListOptions) => Promise<R2Objects>
}

export interface ServerEnv {
  supabaseUrl: string
  supabasePublishedKey: string
  siteUrl: string
  isLocal: boolean
}

type CloudflareEnvRecord = Record<string, unknown>

const DEFAULT_LOCAL_SITE_URL = "http://localhost:3003"
const DEFAULT_PROD_SITE_URL = "https://garasi571.deminov.biz.id"

async function loadCloudflareEnv(): Promise<CloudflareEnvRecord | undefined> {
  try {
    // Dynamic import keeps non-Workers tooling/tests from failing on cloudflare:workers.
    const moduleId = "cloudflare:workers"
    const mod = (await import(/* @vite-ignore */ moduleId)) as {
      env?: CloudflareEnvRecord
    }
    return mod.env
  } catch {
    return undefined
  }
}

const cloudflareEnv = await loadCloudflareEnv()

function getProcessEnv(): Record<string, string | undefined> | undefined {
  const globalWithProcess = globalThis as {
    process?: { env?: Record<string, string | undefined> }
  }
  return globalWithProcess.process?.env
}

function readEnvString(key: string): string | undefined {
  const cfValue = cloudflareEnv?.[key]
  if (typeof cfValue === "string") {
    const trimmed = cfValue.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }

  const processValue = getProcessEnv()?.[key]
  if (typeof processValue === "string") {
    const trimmed = processValue.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }

  return undefined
}

function requireEnvString(key: string): string {
  const value = readEnvString(key)
  if (!value) {
    throw new Error(
      `Missing required server environment variable: ${key}. Configure it in .env.local for local dev or Cloudflare Worker env.`
    )
  }
  return value
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "")
}

function isLocalHostname(url: string): boolean {
  try {
    const { hostname } = new URL(url)
    return (
      hostname === "localhost" ||
      hostname.endsWith(".localhost") ||
      hostname === "127.0.0.1"
    )
  } catch {
    return false
  }
}

function getImportMetaEnv():
  { DEV?: boolean; VITE_SITE_URL?: string } | undefined {
  return (
    import.meta as unknown as {
      env?: { DEV?: boolean; VITE_SITE_URL?: string }
    }
  ).env
}

function isDevRuntime(): boolean {
  if (getImportMetaEnv()?.DEV) {
    return true
  }
  return getProcessEnv()?.NODE_ENV === "development"
}

export function getServerEnv(): ServerEnv {
  const supabaseUrl = requireEnvString("SUPABASE_URL")
  const supabasePublishedKey = requireEnvString("SUPABASE_PUBLISHED_KEY")

  const configuredSiteUrl =
    readEnvString("SITE_URL") ??
    readEnvString("VITE_SITE_URL") ??
    getImportMetaEnv()?.VITE_SITE_URL?.trim()

  const fallbackSiteUrl = isDevRuntime()
    ? DEFAULT_LOCAL_SITE_URL
    : DEFAULT_PROD_SITE_URL

  const siteUrl = stripTrailingSlash(
    configuredSiteUrl && configuredSiteUrl.length > 0
      ? configuredSiteUrl
      : fallbackSiteUrl
  )

  return {
    supabaseUrl,
    supabasePublishedKey,
    siteUrl,
    isLocal: isLocalHostname(siteUrl) || isDevRuntime(),
  }
}

export function getMediaBucket(): R2Bucket {
  const bucket = cloudflareEnv?.MEDIA_BUCKET as R2Bucket | undefined
  if (!bucket || typeof bucket.get !== "function") {
    throw new Error(
      "Missing Cloudflare R2 binding: MEDIA_BUCKET. Verify r2_buckets in wrangler.jsonc and run via Cloudflare Vite/Wrangler runtime."
    )
  }
  return bucket
}
