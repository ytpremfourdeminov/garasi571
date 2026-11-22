import { Link } from "@tanstack/react-router"
import { AtSign, Clock, ExternalLink, MapPin, MessageCircle } from "lucide-react"
import { SHOWROOM } from "@/data/showroom"
import { Button } from "@/components/ui/button"
import { useWhatsAppDialog } from "@/components/whatsapp-dialog"

const DEFAULT_FOOTER_WA_MESSAGE =
  "Halo Garasi 571, saya ingin menanyakan stok unit atau membuat janji kunjungan showroom."

export function SiteFooter() {
  const { openWhatsAppDialog } = useWhatsAppDialog()

  return (
    <footer className="border-t border-border bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <Link
              to="/"
              aria-label="Beranda Garasi 571 Surakarta"
              className="inline-flex items-center gap-2.5 bg-[#161514] px-3 py-2 text-[#FAF9F7] no-underline"
            >
              <img
                src={SHOWROOM.logoSrc}
                alt="Garasi 571"
                width={150}
                height={150}
                className="size-9 shrink-0 object-contain"
              />
              <span className="flex flex-col leading-none">
                <span className="font-heading text-sm font-bold tracking-tight text-[#FAF9F7]">
                  GARASI 571
                </span>
                <span className="text-[10px] font-medium tracking-widest text-[#C7C2BC] uppercase">
                  Surakarta
                </span>
              </span>
            </Link>

            <div className="space-y-1 text-sm text-muted-foreground">
              <p className="inline-flex items-center gap-2 text-foreground">
                <MapPin className="size-4 text-primary" aria-hidden="true" />
                <span>{SHOWROOM.city}</span>
              </p>
              <p className="flex items-center gap-2">
                <Clock className="size-4 text-primary" aria-hidden="true" />
                <span>{SHOWROOM.hours}</span>
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
                    Stok Unit
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
                    href={SHOWROOM.mapsUrl}
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
                    href={SHOWROOM.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-foreground no-underline transition-colors hover:text-primary"
                  >
                    <AtSign
                      className="size-4 text-primary"
                      aria-hidden="true"
                    />
                    <span>Instagram {SHOWROOM.instagramHandle}</span>
                    <ExternalLink className="size-3.5" aria-hidden="true" />
                  </a>
                </li>
                <li className="pt-1">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() =>
                      openWhatsAppDialog({ message: DEFAULT_FOOTER_WA_MESSAGE })
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
            Garasi 571 Surakarta. Showroom mobil bekas pilihan, inspeksi langsung di tempat.
          </p>
          <p>Cash, Kredit, dan Tukar Tambah.</p>
        </div>
      </div>
    </footer>
  )
}
