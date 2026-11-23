import { createFileRoute } from "@tanstack/react-router"
import { getRequestHostname, isDashHostname } from "@/lib/host"
import { getAiTrainingPolicy, getSiteUrl } from "@/lib/seo"

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const hostname = getRequestHostname(request)
        if (isDashHostname(hostname)) {
          return new Response("User-agent: *\nDisallow: /\n", {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Cache-Control": "public, max-age=3600",
              Vary: "Host",
            },
          })
        }

        const baseUrl = getSiteUrl(request.url)
        const trainingRule =
          getAiTrainingPolicy() === "disallow-training"
            ? "Disallow: /"
            : "Allow: /"

        const body = [
          "User-agent: Googlebot",
          "Allow: /",
          "",
          "User-agent: Claude-SearchBot",
          "Allow: /",
          "",
          "User-agent: Claude-User",
          "Allow: /",
          "",
          "User-agent: ClaudeBot",
          trainingRule,
          "",
          "User-agent: OAI-SearchBot",
          "Allow: /",
          "",
          "User-agent: ChatGPT-User",
          "Allow: /",
          "",
          "User-agent: GPTBot",
          trainingRule,
          "",
          "User-agent: PerplexityBot",
          "Allow: /",
          "",
          "User-agent: Google-Extended",
          trainingRule,
          "",
          "User-agent: *",
          "Allow: /",
          "",
          `Sitemap: ${baseUrl}/sitemap.xml`,
          "",
        ].join("\n")

        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            Vary: "Host",
          },
        })
      },
    },
  },
})
