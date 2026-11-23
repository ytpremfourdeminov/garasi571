import { createBrowserClient } from "@supabase/ssr"

export interface SupabasePublicConfig {
  url: string
  publishedKey: string
}

/**
 * Lightweight browser Supabase client initialized with public config
 * passed from a server loader or props (never bundling server env).
 */
export function getSupabaseBrowserClient<TDatabase = any>(
  config: SupabasePublicConfig
) {
  return createBrowserClient<TDatabase>(config.url, config.publishedKey)
}
