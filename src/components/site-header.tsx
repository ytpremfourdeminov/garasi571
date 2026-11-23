import * as React from "react"
import { Link } from "@tanstack/react-router"
import {
  AtSign,
  Clock,
  ExternalLink,
  MapPin,
  Menu,
  MessageCircle,
} from "lucide-react"
import { buildWhatsAppUrl } from "@/lib/domain/formatters"
import { useShowroom } from "@/components/showroom-context"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useWhatsAppDialog } from "@/components/whatsapp-dialog"

const NAV_ITEMS = [
  { label: "Unit Tersedia", hash: "stok" },
  { label: "Simulasi Kredit", hash: "simulasi" },
  { label: "Lokasi Showroom", hash: "lokasi" },
] as const

export function SiteHeader() {
  const showroom = useShowroom()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const { openWhatsAppDialog } = useWhatsAppDialog()
  const defaultInquiryMessage = `Halo ${showroom.name}, saya ingin menanyakan ketersediaan stok mobil bekas dan jadwal kunjungan showroom.`

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:bg-[#161514] focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-[#FAF9F7]"
      >
        Lewati ke konten utama
      </a>

      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label={`Beranda ${showroom.name} ${showroom.city}`}
            className="inline-flex shrink-0 items-center gap-2.5 bg-[#161514] px-2.5 py-1.5 text-[#FAF9F7] no-underline transition-opacity hover:opacity-95"
          >
            <img
              src={showroom.logoSrc}
              alt={showroom.name}
              width={150}
              height={150}
              className="size-8 shrink-0 object-contain sm:size-9"
            />
            <span className="flex flex-col leading-none">
              <span className="font-heading text-xs font-bold tracking-tight text-[#FAF9F7] uppercase sm:text-sm">
                {showroom.name}
              </span>
              <span className="hidden text-[10px] font-medium tracking-widest text-[#C7C2BC] uppercase sm:block">
                {showroom.city}
              </span>
            </span>
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-1 md:flex"
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.hash}
                to="/"
                hash={item.hash}
                className="inline-flex min-h-11 items-center px-3.5 text-sm font-medium text-foreground no-underline transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center md:flex">
            <Button
              type="button"
              onClick={() =>
                openWhatsAppDialog({ message: defaultInquiryMessage })
              }
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              <span>Chat WhatsApp</span>
            </Button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              type="button"
              size="default"
              className="px-3 text-xs sm:text-sm"
              onClick={() =>
                openWhatsAppDialog({ message: defaultInquiryMessage })
              }
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              <span>WhatsApp</span>
            </Button>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger
                type="button"
                aria-label="Buka menu navigasi"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "px-3 text-xs sm:text-sm"
                )}
              >
                <Menu className="size-4" aria-hidden="true" />
                <span>Menu</span>
              </SheetTrigger>

              <SheetContent side="right" closeLabel="Tutup menu navigasi">
                <SheetHeader>
                  <SheetTitle>{showroom.name}</SheetTitle>
                  <SheetDescription>{showroom.city}</SheetDescription>
                </SheetHeader>

                <nav
                  aria-label="Navigasi mobile"
                  className="mt-5 flex flex-col border-t border-border"
                >
                  {NAV_ITEMS.map((item) => (
                    <Link
                      key={item.hash}
                      to="/"
                      hash={item.hash}
                      onClick={() => setMenuOpen(false)}
                      className="inline-flex min-h-12 items-center border-b border-border px-1 text-base font-medium text-foreground no-underline transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>

                <div className="mt-6 space-y-4">
                  <div className="border border-border bg-secondary p-3.5 text-sm">
                    <p className="inline-flex items-center gap-2 font-medium text-foreground">
                      <Clock
                        className="size-4 text-primary"
                        aria-hidden="true"
                      />
                      <span>Jam Operasional</span>
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      {showroom.hours}
                    </p>
                  </div>

                  {showroom.sales.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                        Kontak WhatsApp Sales
                      </p>
                      {showroom.sales.map((person) => (
                        <a
                          key={person.id}
                          href={buildWhatsAppUrl(
                            person.phoneE164,
                            defaultInquiryMessage
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setMenuOpen(false)}
                          className="flex min-h-12 items-center justify-between border border-input bg-card px-3.5 py-2.5 text-sm text-foreground no-underline transition-colors hover:bg-secondary"
                        >
                          <span>
                            <span className="font-semibold">{person.name}</span>
                            <span className="block text-xs text-muted-foreground tabular-nums">
                              {person.phoneDisplay}
                            </span>
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                            <span>WhatsApp</span>
                            <ExternalLink
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-col gap-2 pt-2">
                    <a
                      href={showroom.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-between border border-border px-3.5 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary"
                    >
                      <span className="inline-flex items-center gap-2">
                        <MapPin
                          className="size-4 text-primary"
                          aria-hidden="true"
                        />
                        <span>Buka Google Maps</span>
                      </span>
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>

                    <a
                      href={showroom.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center justify-between border border-border px-3.5 py-2 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary"
                    >
                      <span className="inline-flex items-center gap-2">
                        <AtSign
                          className="size-4 text-primary"
                          aria-hidden="true"
                        />
                        <span>Instagram {showroom.instagramHandle}</span>
                      </span>
                      <ExternalLink className="size-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  )
}
