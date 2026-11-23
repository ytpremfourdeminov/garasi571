import * as React from "react"
import { Link, Outlet, createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import {
  AlertTriangle,
  ArrowLeft,
  MessageCircle,
  RefreshCw,
} from "lucide-react"
import { cn } from "cn"
import { buildWhatsAppUrl } from "@/lib/domain/formatters"
import { getPublicCarsFn, getPublicShowroomFn } from "@/server/public-catalog"
import {
  DEFAULT_SHOWROOM_CONFIG,
  ShowroomProvider,
  useShowroom,
} from "@/components/showroom-context"
import {
  WhatsAppDialogProvider,
  useWhatsAppDialog,
} from "@/components/whatsapp-dialog"
import { CompareProvider, useCompare } from "@/components/compare-context"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { CompareTray } from "@/components/compare-tray"
import { Button, buttonVariants } from "@/components/ui/button"

export const Route = createFileRoute("/_public")({
  loader: async () => {
    const [showroom, cars] = await Promise.all([
      getPublicShowroomFn()
        .then((data) =>
          data.sales.length > 0
            ? data
            : { ...data, sales: DEFAULT_SHOWROOM_CONFIG.sales }
        )
        .catch(() => DEFAULT_SHOWROOM_CONFIG),
      getPublicCarsFn({ data: { includeSold: false } }).catch(() => []),
    ])

    return { showroom, cars }
  },
  component: PublicLayout,
  notFoundComponent: PublicNotFound,
  errorComponent: PublicErrorBoundary,
})

function PublicLayout() {
  const { showroom, cars } = Route.useLoaderData()

  return (
    <ShowroomProvider value={showroom}>
      <WhatsAppDialogProvider>
        <CompareProvider cars={cars}>
          <AppShell>
            <Outlet />
          </AppShell>
        </CompareProvider>
      </WhatsAppDialogProvider>
    </ShowroomProvider>
  )
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { selectedCars } = useCompare()

  return (
    <div
      className={cn(
        "flex min-h-svh flex-col bg-background text-foreground",
        selectedCars.length > 0 && "pb-44 sm:pb-32 lg:pb-24"
      )}
    >
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CompareTray />
    </div>
  )
}

function PublicNotFoundContent() {
  const { openWhatsAppDialog } = useWhatsAppDialog()
  const showroom = useShowroom()

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="border border-border bg-card p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-wider text-primary uppercase">
          404
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Halaman Tidak Ditemukan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Halaman atau unit yang Anda cari tidak tersedia atau tautannya sudah
          berubah. Anda dapat kembali ke katalog stok atau langsung menanyakan
          ketersediaan unit ke tim sales kami di {showroom.city}.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className={cn(
              buttonVariants({ variant: "default" }),
              "no-underline"
            )}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            <span>Kembali ke Katalog</span>
          </Link>

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              openWhatsAppDialog({
                title: "Tanya Ketersediaan Stok",
                description: `Hubungi tim sales ${showroom.name} (${showroom.city}) untuk menanyakan unit yang Anda cari.`,
                message: `Halo ${showroom.name}, saya mencari unit mobil bekas di katalog Anda. Boleh info stok yang saat ini tersedia?`,
              })
            }
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            <span>Hubungi WhatsApp</span>
          </Button>
        </div>
      </div>
    </section>
  )
}

function PublicNotFound() {
  return (
    <ShowroomProvider>
      <WhatsAppDialogProvider>
        <CompareProvider>
          <AppShell>
            <PublicNotFoundContent />
          </AppShell>
        </CompareProvider>
      </WhatsAppDialogProvider>
    </ShowroomProvider>
  )
}

function PublicErrorBoundary({ reset }: ErrorComponentProps) {
  const showroom = useShowroom()
  const primarySales =
    showroom.sales.at(0) ?? DEFAULT_SHOWROOM_CONFIG.sales.at(0)
  const fallbackWaUrl = primarySales
    ? buildWhatsAppUrl(
        primarySales.phoneE164,
        `Halo ${showroom.name}, saya mengalami kendala saat membuka halaman katalog dan ingin menanyakan stok mobil bekas yang tersedia.`
      )
    : null

  const handleReload = () => {
    reset()
    if (typeof window !== "undefined") {
      window.location.reload()
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <main id="main-content" className="flex-1">
        <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="border border-border bg-card p-6 sm:p-8">
            <div className="inline-flex size-11 items-center justify-center border border-border bg-secondary text-primary">
              <AlertTriangle className="size-5" aria-hidden="true" />
            </div>
            <h1 className="mt-4 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Terjadi Kendala Saat Memuat Halaman
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Maaf, halaman belum dapat ditampilkan saat ini. Silakan muat ulang
              halaman, kembali ke beranda, atau hubungi tim sales{" "}
              {showroom.name} melalui WhatsApp.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button type="button" variant="default" onClick={handleReload}>
                <RefreshCw className="size-4" aria-hidden="true" />
                <span>Muat Ulang Halaman</span>
              </Button>

              <Link
                to="/"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "no-underline"
                )}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span>Kembali ke Beranda</span>
              </Link>

              {fallbackWaUrl ? (
                <a
                  href={fallbackWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "secondary" }),
                    "no-underline"
                  )}
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  <span>Hubungi WhatsApp</span>
                </a>
              ) : null}
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
