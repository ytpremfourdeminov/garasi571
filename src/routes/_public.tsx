import * as React from "react"
import { Link, Outlet, createFileRoute } from "@tanstack/react-router"
import type { ErrorComponentProps } from "@tanstack/react-router"
import {
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
import { ErrorStateView } from "@/components/error-state-view"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

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
  pendingComponent: PublicLayoutPending,
  notFoundComponent: PublicNotFound,
  errorComponent: PublicErrorBoundary,
})

function PublicLayoutPending() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat halaman"
      className="flex min-h-svh flex-col bg-background text-foreground"
    >
      <header className="sticky top-0 z-40 h-16 border-b border-[#2F2D2B] bg-[#161514]">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-40 bg-[#242220]" />
          <div className="hidden items-center gap-4 md:flex">
            <Skeleton className="h-5 w-20 bg-[#242220]" />
            <Skeleton className="h-5 w-20 bg-[#242220]" />
            <Skeleton className="h-5 w-20 bg-[#242220]" />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-6">
            <Skeleton className="h-10 w-4/5" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-44 w-full" />
          </div>
          <div className="lg:col-span-6">
            <Skeleton className="aspect-[4/3] w-full" />
          </div>
        </div>
      </main>
    </div>
  )
}

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
    <ErrorStateView
      variant="not-found"
      title="Halaman Tidak Ditemukan"
      description={`Halaman atau unit yang Anda cari tidak tersedia atau tautannya sudah berubah. Kembali ke katalog atau tanyakan ketersediaan unit ke tim sales kami di ${showroom.city}.`}
      actions={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={() =>
              openWhatsAppDialog({
                title: "Tanya Unit Tersedia",
                description: `Hubungi tim sales ${showroom.name} (${showroom.city}) untuk menanyakan unit yang Anda cari.`,
                message: `Halo ${showroom.name}, saya mencari unit mobil bekas di katalog Anda. Boleh info unit yang saat ini tersedia?`,
              })
            }
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            <span>Hubungi WhatsApp</span>
          </Button>

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
        </>
      }
    />
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
        `Halo ${showroom.name}, saya mengalami kendala saat membuka halaman katalog dan ingin menanyakan unit mobil bekas yang tersedia.`
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
      <main id="main-content" className="flex flex-1 items-center justify-center">
        <ErrorStateView
          variant="error"
          title="Terjadi Kendala Saat Memuat Halaman"
          description={`Maaf, halaman belum dapat ditampilkan saat ini. Silakan muat ulang halaman, kembali ke beranda, atau hubungi tim sales ${showroom.name} melalui WhatsApp.`}
          actions={
            <>
              <Link
                to="/"
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "no-underline"
                )}
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                <span>Ke Beranda</span>
              </Link>

              {fallbackWaUrl ? (
                <a
                  href={fallbackWaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "no-underline"
                  )}
                >
                  <MessageCircle className="size-4" aria-hidden="true" />
                  <span>Hubungi WhatsApp</span>
                </a>
              ) : null}

              <Button type="button" variant="default" onClick={handleReload}>
                <RefreshCw className="size-4" aria-hidden="true" />
                <span>Muat Ulang</span>
              </Button>
            </>
          }
        />
      </main>
    </div>
  )
}
