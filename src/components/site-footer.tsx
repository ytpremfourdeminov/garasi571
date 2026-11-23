import { Link } from "@tanstack/react-router"
import { AtSign, Clock, ExternalLink, MapPin, MessageCircle } from "lucide-react"
import { useShowroom } from "@/components/showroom-context"
import { Button } from "@/components/ui/button"
import { useWhatsAppDialog } from "@/components/whatsapp-dialog"

export function SiteFooter() {
  const showroom = useShowroom()
  const { openWhatsAppDialog } = useWhatsAppDialog()
  const defaultFooterWaMessage = `Halo ${showroom.name}, saya ingin menanyakan stok unit atau membuat janji kunjungan showroom.`

  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link
              to="/"
              aria-label={`Beranda ${showroom.name} ${showroom.city}`}
              className="inline-flex items-center gap-2.5 bg-[#161514] px-3 py-2 text-[#FAF9F7] no-underline"
            >
              <img
                src={showroom.logoSrc}
                alt={showroom.name}
                width={150}
                height={150}
                className="size-9 shrink-0 object-contain"
              />
              <span className="flex flex-col leading-none">
                <span className="font-heading text-sm font-bold tracking-tight text-[#FAF9F7] uppercase">
                  {showroom.name}
                </span>
                <span className="text-[10px] font-medium tracking-widest text-[#C7C2BC] uppercase">
                  {showroom.city}
                </span>
              </span>
            </Link>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2 text-foreground">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                <span>{showroom.city}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-primary" aria-hidden="true" />
                <span>{showroom.hours}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:gap-12">
            <div>
              <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Navigasi
              </h2>
              <ul className="mt-2 flex flex-col">
                <li>
                  <Link
                    to="/"
                    hash="stok"
                    className="inline-flex min-h-11 items-center text-sm font-medium text-foreground no-underline transition-colors hover:text-primary"
                  >
                    Unit Tersedia
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    hash="simulasi"
                    className="inline-flex min-h-11 items-center text-sm font-medium text-foreground no-underline transition-colors hover:text-primary"
                  >
                    Simulasi Kredit
                  </Link>
                </li>
                <li>
                  <Link
                    to="/"
                    hash="lokasi"
                    className="inline-flex min-h-11 items-center text-sm font-medium text-foreground no-underline transition-colors hover:text-primary"
                  >
                    Lokasi Showroom
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Showroom & Kontak
              </h2>
              <ul className="mt-2 flex flex-col gap-1">
                <li>
                  <a
                    href={showroom.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground no-underline transition-colors hover:text-primary"
                  >
                    <MapPin className="size-4 text-primary" aria-hidden="true" />
                    <span>Google Maps</span>
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </li>
                <li>
                  <a
                    href={showroom.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground no-underline transition-colors hover:text-primary"
                  >
                    <AtSign
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />
                    <span>Instagram {showroom.instagramHandle}</span>
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </li>
                <li className="pt-1">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() =>
                      openWhatsAppDialog({ message: defaultFooterWaMessage })
                    }
                  >
                    <MessageCircle className="size-4" aria-hidden="true" />
                    <span>Chat WhatsApp Sales</span>
                  </Button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            {showroom.name} ({showroom.city}). Inspeksi unit langsung di
            showroom.
          </p>
          <p>Cash, Kredit, dan Tukar Tambah.</p>
        </div>
      </div>
    </footer>
  )
}
