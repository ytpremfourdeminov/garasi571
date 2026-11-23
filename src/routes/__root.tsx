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
import { ArrowLeft, RefreshCw } from "lucide-react"
import { cn } from "cn"
import { ErrorStateView } from "@/components/error-state-view"
import { Button, buttonVariants } from "@/components/ui/button"
import { Toaster } from "@/components/ui/toast"
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
      <Toaster>
        <Outlet />
      </Toaster>
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
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back()
      return
    }
    if (typeof window !== "undefined") {
      window.location.href = "/"
    }
  }

  return (
    <ErrorStateView
      variant="not-found"
      fullScreen
      title="Halaman Tidak Ditemukan"
      description="Halaman yang Anda cari tidak tersedia atau tautannya sudah berubah."
      actions={
        <>
          <Button type="button" variant="ghost" onClick={handleBack}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Kembali</span>
          </Button>
          <a
            href="/"
            className={cn(
              buttonVariants({ variant: "default" }),
              "no-underline"
            )}
          >
            <span>Ke Beranda</span>
          </a>
        </>
      }
    />
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
    <ErrorStateView
      variant="error"
      fullScreen
      title="Terjadi Kendala Saat Memuat Halaman"
      description="Maaf, halaman belum dapat ditampilkan saat ini. Silakan muat ulang halaman atau kembali ke beranda."
      actions={
        <>
          <a
            href="/"
            className={cn(buttonVariants({ variant: "ghost" }), "no-underline")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Ke Beranda</span>
          </a>
          <Button type="button" variant="default" onClick={handleReload}>
            <RefreshCw className="size-4" aria-hidden="true" />
            <span>Muat Ulang</span>
          </Button>
        </>
      }
    />
  )
}
