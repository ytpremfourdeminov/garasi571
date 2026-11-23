const DEFAULT_PUBLIC_SITE_ORIGIN = "https://garasi571.deminov.biz.id"
const DASH_PREFIX = "dash."

const PASS_THROUGH_EXACT_PATHS = new Set([
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/llms-full.txt",
])

const PASS_THROUGH_SEGMENT_PREFIXES = [
  "/_server",
  "/_serverfn",
  "/api",
  "/media",
  "/assets",
  "/images",
]

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "")
}

function getConfiguredSiteUrl(): string | undefined {
  const env = (
    import.meta as unknown as {
      env?: { VITE_SITE_URL?: string }
    }
  ).env
  const raw = env?.VITE_SITE_URL?.trim()
  return raw && raw.length > 0 ? raw : undefined
}

function parseUrlSafe(input?: string | null): URL | null {
  if (!input) {
    return null
  }

  const trimmed = input.trim()
  if (!trimmed) {
    return null
  }

  try {
    return new URL(trimmed)
  } catch {
    return null
  }
}

/**
 * Extracts a lowercase hostname without port from a Host header value,
 * comma-separated X-Forwarded-Host header, bare hostname, or absolute URL.
 */
export function extractHostname(hostOrUrl?: string | null): string {
  if (!hostOrUrl) {
    return ""
  }

  const firstEntry = hostOrUrl.split(",", 1)[0]?.trim() ?? ""
  if (!firstEntry) {
    return ""
  }

  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(firstEntry)) {
    const parsed = parseUrlSafe(firstEntry)
    return parsed ? parsed.hostname.toLowerCase().replace(/\.$/, "") : ""
  }

  // Handle bracketed IPv6 hosts such as "[::1]:3009"
  if (firstEntry.startsWith("[")) {
    const closingBracketIndex = firstEntry.indexOf("]")
    if (closingBracketIndex !== -1) {
      return firstEntry.slice(0, closingBracketIndex + 1).toLowerCase()
    }
    return firstEntry.toLowerCase()
  }

  const hostWithoutPath = firstEntry.split("/", 1)[0] ?? ""
  const colonIndex = hostWithoutPath.lastIndexOf(":")
  const hostname =
    colonIndex !== -1 ? hostWithoutPath.slice(0, colonIndex) : hostWithoutPath

  return hostname.trim().toLowerCase().replace(/\.$/, "")
}

/**
 * Extracts the effective hostname from a Fetch API Request, preferring
 * X-Forwarded-Host -> Host -> request.url.
 */
export function getRequestHostname(request: Request): string {
  const forwardedHost = request.headers.get("x-forwarded-host")
  if (forwardedHost) {
    const extracted = extractHostname(forwardedHost)
    if (extracted) {
      return extracted
    }
  }

  const hostHeader = request.headers.get("host")
  if (hostHeader) {
    const extracted = extractHostname(hostHeader)
    if (extracted) {
      return extracted
    }
  }

  return extractHostname(request.url)
}

/**
 * Returns true for dashboard subdomains (`dash.localhost`, `dash.garasi571.*`, etc.).
 */
export function isDashHostname(hostname: string): boolean {
  const normalized = extractHostname(hostname)
  if (!normalized) {
    return false
  }
  return (
    normalized === "dash.localhost" ||
    (normalized.startsWith(DASH_PREFIX) &&
      normalized.length > DASH_PREFIX.length)
  )
}

/**
 * Paths that bypass host-based dashboard URL rewriting on both SSR and client.
 */
export function isPassThroughPath(pathname: string): boolean {
  if (!pathname) {
    return false
  }

  const normalized = pathname.startsWith("/") ? pathname : `/${pathname}`
  const lower = normalized.toLowerCase()

  if (PASS_THROUGH_EXACT_PATHS.has(lower)) {
    return true
  }

  if (lower.startsWith("/favicon")) {
    return true
  }

  for (const prefix of PASS_THROUGH_SEGMENT_PREFIXES) {
    if (lower === prefix || lower.startsWith(`${prefix}/`)) {
      return true
    }
  }

  return false
}

function toOriginWithHostTransform(url: URL, mode: "public" | "dash"): string {
  const next = new URL(url.origin)
  const hostname = extractHostname(next.hostname)

  if (mode === "public" && isDashHostname(hostname)) {
    next.hostname = hostname.slice(DASH_PREFIX.length)
  } else if (mode === "dash" && !isDashHostname(hostname) && hostname) {
    next.hostname = `${DASH_PREFIX}${hostname}`
  }

  return stripTrailingSlash(next.origin)
}

function resolveBaseUrl(requestUrl?: string): URL {
  const fromRequest = parseUrlSafe(requestUrl)
  if (fromRequest && fromRequest.origin !== "null") {
    return fromRequest
  }

  const fromEnv = parseUrlSafe(getConfiguredSiteUrl())
  if (fromEnv && fromEnv.origin !== "null") {
    return fromEnv
  }

  return new URL(DEFAULT_PUBLIC_SITE_ORIGIN)
}

/**
 * Returns the public storefront origin (e.g. `http://localhost:3009` when
 * called from `http://dash.localhost:3009`, or strips `dash.` in production).
 */
export function getPublicSiteOrigin(requestUrl?: string): string {
  const baseUrl = resolveBaseUrl(requestUrl)
  return toOriginWithHostTransform(baseUrl, "public")
}

/**
 * Returns the dashboard subdomain origin (e.g. `http://dash.localhost:3009`
 * locally or `https://dash.garasi571.deminov.biz.id` in production).
 */
export function getDashSiteOrigin(requestUrl?: string): string {
  const baseUrl = resolveBaseUrl(requestUrl)
  return toOriginWithHostTransform(baseUrl, "dash")
}
