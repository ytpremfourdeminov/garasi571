import { createRouter as createTanStackRouter } from "@tanstack/react-router"
import { extractHostname, isDashHostname, isPassThroughPath } from "@/lib/host"
import { routeTree } from "./routeTree.gen"

const INTERNAL_DASH_PREFIX = "/dash"
const BLOCKED_NOT_FOUND_PREFIX = "/__not_found__"

function resolveHostname(url: URL): string {
  const urlHostname = extractHostname(url.hostname)
  if (typeof window !== "undefined" && window.location.hostname) {
    return extractHostname(window.location.hostname) || urlHostname
  }
  return urlHostname
}

function isBlockedPrefix(pathname: string, prefix: string): boolean {
  const lower = pathname.toLowerCase()
  return lower === prefix || lower.startsWith(`${prefix}/`)
}

function normalizeLeadingSlash(pathname: string): string {
  return pathname.startsWith("/") ? pathname : `/${pathname}`
}

function cloneWithPathname(url: URL, pathname: string): URL {
  const next = new URL(url.href)
  next.pathname = pathname
  return next
}

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,

    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    rewrite: {
      input: ({ url }) => {
        if (isPassThroughPath(url.pathname)) {
          return undefined
        }

        const hostname = resolveHostname(url)
        const normalizedPath = normalizeLeadingSlash(url.pathname)

        if (isDashHostname(hostname)) {
          if (
            isBlockedPrefix(normalizedPath, "/admin") ||
            isBlockedPrefix(normalizedPath, INTERNAL_DASH_PREFIX)
          ) {
            return cloneWithPathname(
              url,
              `${BLOCKED_NOT_FOUND_PREFIX}${normalizedPath}`
            )
          }

          if (normalizedPath === "/") {
            return cloneWithPathname(url, INTERNAL_DASH_PREFIX)
          }

          return cloneWithPathname(
            url,
            `${INTERNAL_DASH_PREFIX}${normalizedPath}`
          )
        }

        if (
          isBlockedPrefix(normalizedPath, INTERNAL_DASH_PREFIX) ||
          isBlockedPrefix(normalizedPath, "/admin")
        ) {
          return cloneWithPathname(
            url,
            `${BLOCKED_NOT_FOUND_PREFIX}${normalizedPath}`
          )
        }

        return undefined
      },
      output: ({ url }) => {
        if (isPassThroughPath(url.pathname)) {
          return undefined
        }

        if (url.pathname.startsWith(`${BLOCKED_NOT_FOUND_PREFIX}/`)) {
          const restored = url.pathname.slice(BLOCKED_NOT_FOUND_PREFIX.length)
          return cloneWithPathname(url, restored || "/")
        }

        const hostname = resolveHostname(url)
        if (!isDashHostname(hostname)) {
          return undefined
        }

        if (
          url.pathname === INTERNAL_DASH_PREFIX ||
          url.pathname === `${INTERNAL_DASH_PREFIX}/`
        ) {
          return cloneWithPathname(url, "/")
        }

        if (url.pathname.startsWith(`${INTERNAL_DASH_PREFIX}/`)) {
          const stripped = url.pathname.slice(INTERNAL_DASH_PREFIX.length)
          return cloneWithPathname(url, stripped || "/")
        }

        return undefined
      },
    },
  })

  return router
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
