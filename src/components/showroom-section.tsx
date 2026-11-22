import * as React from "react"
import {
  AtSign,
  Check,
  Clock,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
} from "lucide-react"
import { SHOWROOM, buildWhatsAppUrl } from "@/data/showroom"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

const SHOWROOM_VISIT_MESSAGE =
  "Halo Garasi 571, saya berencana datang ke showroom Surakarta untuk cek unit langsung. Mohon informasi ketersediaan stok hari ini."

export function ShowroomSection() {
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [copyStatus, setCopyStatus] = React.useState("")
  const timerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  const handleCopyNumber = React.useCallback(
    async (id: string, name: string, phoneDisplay: string) => {
      try {
        await navigator.clipboard.writeText(phoneDisplay)
        setCopiedId(id)
        setCopyStatus(`Nomor disalin: ${name} (${phoneDisplay}).`)

        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current)
        }
        timerRef.current = window.setTimeout(() => {
          setCopiedId(null)
        }, 2500)
      } catch {
        setCopyStatus(
          `Tidak dapat menyalin otomatis. Nomor ${name}: ${phoneDisplay}.`
        )
      }
    },
    []
  )

  return (
    <section
      id="lokasi"
      aria-labelledby="showroom-heading"
      className="scroll-mt-20 bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="flex items-center gap-2.5">
          <svg
            width="20"
            height="14"
            viewBox="0 0 20 14"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <path
              d="M5 1L1 13"
              stroke="#B91C1C"
              strokeWidth="2"
              strokeLinecap="square"
            />
            <path
              d="M12 1L8 13"
              stroke="#B91C1C"
              strokeWidth="2"
              strokeLinecap="square"
            />
            <path
              d="M19 1L15 13"
              stroke="#B91C1C"
              strokeWidth="2"
              strokeLinecap="square"
            />
          </svg>
          <span className="font-heading text-xs font-bold tracking-widest text-primary uppercase tabular-nums">
            03 / Lokasi &amp; Kontak Showroom
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 border border-border lg:grid-cols-12">
          <div className="flex flex-col justify-between bg-[#161514] p-6 text-[#FAF9F7] sm:p-8 lg:col-span-6">
            <div>
              <div className="flex items-center gap-3">
                <img
                  src={SHOWROOM.logoSrc}
                  alt="Logo Garasi 571"
                  width={150}
                  height={150}
                  loading="lazy"
                  className="size-14 shrink-0 object-contain"
                />
                <div>
                  <p className="font-heading text-base font-bold tracking-tight text-[#FAF9F7]">
                    GARASI 571
                  </p>
                  <p className="text-xs tracking-wider text-[#C7C2BC] uppercase">
                    {SHOWROOM.city}
                  </p>
                </div>
              </div>

              <h2
                id="showroom-heading"
                className="mt-6 font-heading text-2xl font-bold tracking-tight text-[#FAF9F7] sm:text-3xl"
              >
                Kunjungi Showroom Garasi 571
              </h2>

              <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-[#C7C2BC]">
                Inspeksi kondisi bodi, interior, mesin, serta kelengkapan
                dokumen unit secara langsung di lokasi showroom kami di
                Surakarta.
              </p>

              <dl className="mt-6 space-y-3 border-y border-[#FAF9F7]/15 py-5 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin
                    className="mt-0.5 size-4 shrink-0 text-[#F87171]"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-xs text-[#C7C2BC]">Lokasi</dt>
                    <dd className="font-medium text-[#FAF9F7]">
                      {SHOWROOM.city}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock
                    className="mt-0.5 size-4 shrink-0 text-[#F87171]"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-xs text-[#C7C2BC]">Jam Operasional</dt>
                    <dd className="font-medium text-[#FAF9F7] tabular-nums">
                      {SHOWROOM.hours}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AtSign
                    className="mt-0.5 size-4 shrink-0 text-[#F87171]"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="text-xs text-[#C7C2BC]">Instagram Resmi</dt>
                    <dd>
                      <a
                        href={SHOWROOM.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-1.5 font-medium text-[#FAF9F7] underline-offset-4 transition-colors hover:text-[#F87171] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF9F7]"
                      >
                        <span>{SHOWROOM.instagramHandle}</span>
                        <ExternalLink className="size-3.5" aria-hidden="true" />
                      </a>
                    </dd>
                  </div>
                </div>
              </dl>
            </div>

            <div className="mt-6">
              <a
                href={SHOWROOM.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "default" }),
                  "w-full no-underline focus-visible:outline-[#FAF9F7] sm:w-auto"
                )}
              >
                <MapPin className="size-4" aria-hidden="true" />
                <span>Buka di Google Maps</span>
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-card p-6 sm:p-8 lg:col-span-6">
            <div>
              <h3 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Hubungi Langsung Tim Sales
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Pilih kontak sales untuk konfirmasi stok terbaru, jadwal cek
                unit, atau pertanyaan simulasi kredit dan tukar tambah.
              </p>

              <div className="mt-6 space-y-4">
                {SHOWROOM.sales.map((person) => {
                  const isCopied = copiedId === person.id
                  const whatsappHref = buildWhatsAppUrl(
                    person.phoneE164,
                    SHOWROOM_VISIT_MESSAGE
                  )

                  return (
                    <div
                      key={person.id}
                      className="border border-border bg-background p-5"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div>
                          <p className="font-heading text-lg font-bold text-foreground">
                            {person.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {person.role}
                          </p>
                        </div>
                        <p className="text-sm font-semibold text-foreground tabular-nums">
                          {person.phoneDisplay}
                        </p>
                      </div>

                      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            buttonVariants({ variant: "default" }),
                            "flex-1 no-underline"
                          )}
                        >
                          <MessageCircle
                            className="size-4"
                            aria-hidden="true"
                          />
                          <span>Chat {person.name} via WhatsApp</span>
                          <ExternalLink
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </a>

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            handleCopyNumber(
                              person.id,
                              person.name,
                              person.phoneDisplay
                            )
                          }
                          className="sm:shrink-0"
                        >
                          {isCopied ? (
                            <>
                              <Check
                                className="size-4 text-primary"
                                aria-hidden="true"
                              />
                              <span>Nomor disalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="size-4" aria-hidden="true" />
                              <span>Salin Nomor</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <p
              role="status"
              aria-live="polite"
              className="mt-4 min-h-5 text-xs font-medium text-primary"
            >
              {copyStatus}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
