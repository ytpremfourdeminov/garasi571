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
import { buildWhatsAppUrl } from "@/lib/domain/formatters"
import { useShowroom } from "@/components/showroom-context"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "cn"

export function ShowroomSection() {
  const showroom = useShowroom()
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [copyStatus, setCopyStatus] = React.useState("")
  const timerRef = React.useRef<number | null>(null)
  const showroomVisitMessage = `Halo ${showroom.name}, saya berencana datang ke showroom ${showroom.city} untuk cek unit langsung. Mohon informasi ketersediaan stok hari ini.`

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
            03 / Showroom
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 border border-border lg:grid-cols-12">
          <div className="flex flex-col bg-[#161514] p-6 text-[#FAF9F7] sm:p-8 lg:col-span-6">
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-3">
                <img
                  src={showroom.logoSrc}
                  alt={`Logo ${showroom.name}`}
                  width={150}
                  height={150}
                  loading="lazy"
                  className="size-14 shrink-0 object-contain"
                />
                <div>
                  <p className="font-heading text-base font-bold tracking-tight text-[#FAF9F7] uppercase">
                    {showroom.name}
                  </p>
                  <p className="text-xs tracking-wider text-[#C7C2BC] uppercase">
                    {showroom.city}
                  </p>
                </div>
              </div>

              <h2
                id="showroom-heading"
                className="mt-6 font-heading text-2xl font-bold tracking-tight text-[#FAF9F7] sm:text-3xl"
              >
                Kunjungi {showroom.name}
              </h2>

              <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-[#C7C2BC]">
                Cek langsung kondisi bodi, interior, mesin, dan dokumen unit di
                showroom kami.
              </p>

              <div className="mt-6 grid flex-1 grid-cols-1 gap-5 border-t border-[#FAF9F7]/15 pt-5 sm:grid-cols-12 sm:items-stretch">
                <dl className="space-y-4 text-sm sm:col-span-6">
                  <div className="flex items-start gap-3">
                    <MapPin
                      className="mt-0.5 size-4 shrink-0 text-[#F87171]"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="text-xs text-[#C7C2BC]">Lokasi</dt>
                      <dd className="font-medium text-[#FAF9F7]">
                        {showroom.address || showroom.city}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock
                      className="mt-0.5 size-4 shrink-0 text-[#F87171]"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="text-xs text-[#C7C2BC]">
                        Jam Operasional
                      </dt>
                      <dd className="font-medium text-[#FAF9F7] tabular-nums">
                        {showroom.hours}
                      </dd>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <AtSign
                      className="mt-0.5 size-4 shrink-0 text-[#F87171]"
                      aria-hidden="true"
                    />
                    <div>
                      <dt className="text-xs text-[#C7C2BC]">Instagram</dt>
                      <dd>
                        <a
                          href={showroom.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="-my-2.5 inline-flex items-center gap-1.5 py-2.5 font-medium text-[#FAF9F7] underline-offset-4 transition-colors hover:text-[#F87171] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF9F7]"
                        >
                          <span>{showroom.instagramHandle}</span>
                          <ExternalLink
                            className="size-3.5"
                            aria-hidden="true"
                          />
                        </a>
                      </dd>
                    </div>
                  </div>
                </dl>

                <div className="flex flex-col overflow-hidden border border-[#FAF9F7]/20 bg-[#211F1D] sm:col-span-6">
                  <div className="relative aspect-[4/3] w-full flex-1 bg-[#211F1D] sm:aspect-auto sm:min-h-40">
                    <iframe
                      title={`Peta Lokasi ${showroom.name} ${showroom.city}`}
                      src={showroom.mapsEmbedUrl}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-full w-full border-0"
                    />
                  </div>
                  <a
                    href={showroom.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "default" }),
                      "w-full justify-between rounded-none border-t border-[#FAF9F7]/15 no-underline focus-visible:outline-[#FAF9F7]"
                    )}
                  >
                    <span className="inline-flex items-center gap-2">
                      <MapPin className="size-4" aria-hidden="true" />
                      <span>Buka di Google Maps</span>
                    </span>
                    <ExternalLink className="size-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-card p-6 sm:p-8 lg:col-span-6">
            <div>
              <h3 className="font-heading text-2xl font-bold tracking-tight text-foreground">
                Hubungi Langsung Tim Sales
              </h3>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Konfirmasi ketersediaan unit, jadwal inspeksi, atau simulasi
                kredit langsung lewat WhatsApp.
              </p>

              <div className="mt-5 space-y-3">
                {showroom.sales.length > 0 ? (
                  showroom.sales.map((person) => {
                    const isCopied = copiedId === person.id
                    const whatsappHref = buildWhatsAppUrl(
                      person.phoneE164,
                      showroomVisitMessage
                    )

                    return (
                      <article
                        key={person.id}
                        className="flex flex-col justify-between border border-foreground/20 bg-background p-4 shadow-[0_2px_0_0_rgba(22,21,20,0.06)] transition-colors hover:border-foreground/35"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-1.5">
                            <svg
                              width="12"
                              height="9"
                              viewBox="0 0 20 14"
                              fill="none"
                              aria-hidden="true"
                              className="shrink-0"
                            >
                              <path
                                d="M5 1L1 13"
                                stroke="#B91C1C"
                                strokeWidth="2.2"
                                strokeLinecap="square"
                              />
                              <path
                                d="M12 1L8 13"
                                stroke="#B91C1C"
                                strokeWidth="2.2"
                                strokeLinecap="square"
                              />
                              <path
                                d="M19 1L15 13"
                                stroke="#B91C1C"
                                strokeWidth="2.2"
                                strokeLinecap="square"
                              />
                            </svg>
                            <span className="font-heading text-[10px] font-bold tracking-[0.14em] text-foreground uppercase">
                              {showroom.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-medium tracking-[0.12em] text-muted-foreground uppercase">
                            {showroom.city}
                          </span>
                        </div>

                        <div className="my-3">
                          <p className="font-heading text-lg font-bold tracking-tight text-foreground">
                            {person.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {person.role}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2.5 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                              WhatsApp
                            </p>
                            <p className="font-heading text-xs font-semibold text-foreground tabular-nums sm:text-sm">
                              {person.phoneDisplay}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 sm:shrink-0">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopyNumber(
                                  person.id,
                                  person.name,
                                  person.phoneDisplay
                                )
                              }
                              aria-label={`Salin nomor ${person.name}`}
                              className="min-h-11 flex-1 sm:min-h-9 sm:flex-none"
                            >
                              {isCopied ? (
                                <>
                                  <Check
                                    className="size-3.5 text-primary"
                                    aria-hidden="true"
                                  />
                                  <span>Disalin</span>
                                </>
                              ) : (
                                <>
                                  <Copy
                                    className="size-3.5"
                                    aria-hidden="true"
                                  />
                                  <span>Salin</span>
                                </>
                              )}
                            </Button>

                            <a
                              href={whatsappHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Chat ${person.name} via WhatsApp`}
                              className={cn(
                                buttonVariants({
                                  variant: "default",
                                  size: "sm",
                                }),
                                "min-h-11 flex-1 no-underline sm:min-h-9 sm:flex-none"
                              )}
                            >
                              <MessageCircle
                                className="size-3.5"
                                aria-hidden="true"
                              />
                              <span>Chat</span>
                              <ExternalLink
                                className="size-3"
                                aria-hidden="true"
                              />
                            </a>
                          </div>
                        </div>
                      </article>
                    )
                  })
                ) : (
                  <div className="border border-border bg-background p-4 text-sm text-muted-foreground">
                    Kontak tim sales belum tersedia saat ini. Kunjungi showroom
                    kami atau hubungi lewat Instagram {showroom.instagramHandle}
                    .
                  </div>
                )}
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
