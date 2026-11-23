import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"
import {
  getCookies,
  setCookie,
  setResponseHeader,
} from "@tanstack/react-start/server"
// @ts-expect-error -- cloudflare:workers is provided at runtime by Cloudflare Workers
import { env as cfEnv } from "cloudflare:workers"
import { z } from "zod"

const supabaseConfigSchema = z.object({
  url: z.url("SUPABASE_URL must be a valid URL"),
  publishedKey: z.string().min(1, "SUPABASE_PUBLISHED_KEY is required"),
})

export type SupabaseServerConfig = z.infer<typeof supabaseConfigSchema>

function readEnvValue(key: string): string | undefined {
  const workerEnv = cfEnv as Record<string, unknown> | undefined
  const workerVal = workerEnv?.[key]
  if (typeof workerVal === "string" && workerVal.length > 0) {
    return workerVal
  }

  if (typeof process !== "undefined") {
    const processVal = process.env[key]
    if (typeof processVal === "string" && processVal.length > 0) {
      return processVal
    }
  }

  return undefined
}

function readSupabaseConfig(): SupabaseServerConfig {
  return supabaseConfigSchema.parse({
    url: readEnvValue("SUPABASE_URL"),
    publishedKey: readEnvValue("SUPABASE_PUBLISHED_KEY"),
  })
}

/**
 * Stateless Supabase client using the published (anon) key.
 * Safe for public SSR / SEO routes where no user session is needed.
 */
export function getSupabasePublicClient<TDatabase = any>() {
  const { url, publishedKey } = readSupabaseConfig()
  return createClient<TDatabase>(url, publishedKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

/**
 * Request-scoped Supabase SSR client wired to TanStack Start server cookies.
 * Respects Supabase RLS and writes refreshed session cookies + no-store
 * cache headers back to the HTTP response.
 */
export function getSupabaseServerClient<TDatabase = any>() {
  const { url, publishedKey } = readSupabaseConfig()
  return createServerClient<TDatabase>(url, publishedKey, {
    cookies: {
      getAll() {
        return Object.entries(getCookies()).map(([name, value]) => ({
          name,
          value,
        }))
      },
      setAll(cookiesToSet, headers) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            setCookie(name, value, {
              ...options,
              path: options.path ?? "/",
              sameSite: options.sameSite ?? "lax",
              httpOnly: options.httpOnly ?? true,
            })
          }
          for (const [key, value] of Object.entries(headers)) {
            setResponseHeader(key, value)
          }
        } catch {
          // Response headers may already be committed during streaming SSR.
        }
      },
    },
  })
}
