import { createFileRoute } from "@tanstack/react-router"
import { CARS } from "@/data/cars"
import { getSiteUrl, toAbsoluteUrl } from "@/lib/seo"

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function buildUrlEntry(
  loc: string,
  changefreq: "daily" | "weekly",
  priority: string
): string {
  return [
    "  <url>",
    `    <loc>${escapeXml(loc)}</loc>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n")
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const baseUrl = getSiteUrl(request.url)

        const entries = [
          buildUrlEntry(`${baseUrl}/`, "daily", "1.0"),
          ...CARS.map((car) =>
            buildUrlEntry(
              toAbsoluteUrl(`/mobil/${car.slug}`, baseUrl),
              "weekly",
              "0.9"
            )
          ),
        ]

        const xml = [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          ...entries,
          "</urlset>",
          "",
        ].join("\n")

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        })
      },
    },
  },
})
