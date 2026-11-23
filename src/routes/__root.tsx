import * as React from "react"
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools"
import { TanStackDevtools } from "@tanstack/react-devtools"
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react"
import { cn } from "cn"
import { Button, buttonVariants } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"

import appCss from "../styles.css?url"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Garasi 571 Surakarta | Katalog Mobil Bekas Pilihan",
      },
      {
        name: "description",
        content:
          "Pilihan mobil bekas siap pakai di Garasi 571 Surakarta. Tersedia cash, kredit, dan tukar tambah, buka setiap hari 08:00 - 16:00 WIB.",
      },
      {
        property: "og:site_name",
        content: "Garasi 571",
      },
      {
        property: "og:locale",
        content: "id_ID",
      },
      {
        name: "twitter:card",
        content: "summary_large_image",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        type: "image/png",
        href: "/favicon.png",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: RootNotFound,
  errorComponent: RootErrorBoundary,
  shellComponent: RootDocument,
})

function RootComponent() {
  return (
    <TooltipProvider delay={150}>
      <Outlet />
    </TooltipProvider>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}

        {import.meta.env.DEV ? (
          <TanStackDevtools
            config={{
              position: "bottom-right",
            }}
            plugins={[
              {
                name: "TanStack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        ) : null}
        <Scripts />
      </body>
    </html>
  )
}

function RootNotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <section className="w-full max-w-xl border border-border bg-card p-6 sm:p-8">
        <p className="text-sm font-semibold tracking-wider text-primary uppercase">
          404
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Halaman yang Anda cari tidak tersedia atau tautannya sudah berubah.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href="/"
            className={cn(
              buttonVariants({ variant: "default" }),
              "no-underline"
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Kembali ke Beranda</span>
          </a>
        </div>
      </section>
    </main>
  )
}

function RootErrorBoundary({ reset }: ErrorComponentProps) {
  const handleReload = () => {
    reset()
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-16 text-foreground sm:px-6 lg:px-8">
      <section className="w-full max-w-xl border border-border bg-card p-6 sm:p-8">
        <div className="inline-flex size-11 items-center justify-center border border-border bg-secondary text-primary">
          <AlertTriangle className="size-5" aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Terjadi Kendala Saat Memuat Halaman
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Maaf, halaman belum dapat ditampilkan saat ini. Silakan muat ulang
          halaman atau kembali ke beranda.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button type="button" variant="default" onClick={handleReload}>
            <RefreshCw className="size-4" aria-hidden="true" />
            <span>Muat Ulang Halaman</span>
          </Button>

          <a
            href="/"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "no-underline"
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Kembali ke Beranda</span>
          </a>
        </div>
      </section>
    </main>
  )
}
