import * as React from "react"
import { Check, Copy, ExternalLink, MapPin, MessageCircle } from "lucide-react"
import { SHOWROOM, buildWhatsAppUrl } from "@/data/showroom"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "cn"

const DEFAULT_TITLE = "Hubungi Tim Sales Garasi 571"
const DEFAULT_DESCRIPTION =
  "Pilih salah satu kontak sales kami di Surakarta untuk terhubung langsung lewat WhatsApp."
const DEFAULT_MESSAGE =
  "Halo Garasi 571, saya tertarik melihat stok mobil bekas dan ingin konsultasi unit atau jadwal kunjungan showroom."

export interface OpenWhatsAppDialogOptions {
  title?: string
  description?: string
  message: string
}

interface WhatsAppDialogContextValue {
  openWhatsAppDialog: (opts?: OpenWhatsAppDialogOptions) => void
}

const WhatsAppDialogContext =
  React.createContext<WhatsAppDialogContextValue | null>(null)

export function WhatsAppDialogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const [dialogOptions, setDialogOptions] =
    React.useState<OpenWhatsAppDialogOptions>({
      title: DEFAULT_TITLE,
      description: DEFAULT_DESCRIPTION,
      message: DEFAULT_MESSAGE,
    })
  const [copiedId, setCopiedId] = React.useState<string | null>(null)
  const [copyStatus, setCopyStatus] = React.useState("")
  const copyTimerRef = React.useRef<number | null>(null)

  React.useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current)
      }
    }
  }, [])

  const openWhatsAppDialog = React.useCallback(
    (opts?: OpenWhatsAppDialogOptions) => {
      setDialogOptions({
        title: opts?.title ?? DEFAULT_TITLE,
        description: opts?.description ?? DEFAULT_DESCRIPTION,
        message: opts?.message || DEFAULT_MESSAGE,
      })
      setCopiedId(null)
      setCopyStatus("")
      setOpen(true)
    },
    []
  )

  const handleCopyNumber = React.useCallback(
    async (id: string, name: string, phoneDisplay: string) => {
      try {
        await navigator.clipboard.writeText(phoneDisplay)

        setCopiedId(id)
        setCopyStatus(`Nomor ${name} (${phoneDisplay}) disalin.`)

        if (copyTimerRef.current !== null) {
          window.clearTimeout(copyTimerRef.current)
        }
        copyTimerRef.current = window.setTimeout(() => {
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

  const value = React.useMemo<WhatsAppDialogContextValue>(
    () => ({ openWhatsAppDialog }),
    [openWhatsAppDialog]
  )

  return (
    <WhatsAppDialogContext.Provider value={value}>
      {children}
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen)
          if (!nextOpen) {
            setCopiedId(null)
            setCopyStatus("")
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{dialogOptions.title}</DialogTitle>
            <DialogDescription>{dialogOptions.description}</DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="border border-border bg-secondary p-3.5">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Pratinjau Pesan WhatsApp
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {dialogOptions.message}
              </p>
            </div>

            <div className="space-y-3">
              {SHOWROOM.sales.map((person) => {
                const isCopied = copiedId === person.id
                const whatsappHref = buildWhatsAppUrl(
                  person.phoneE164,
                  dialogOptions.message
                )

                return (
                  <div
                    key={person.id}
                    className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="font-heading text-base font-semibold text-foreground">
                        {person.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {person.role}
                      </p>
                      <p className="mt-1 text-sm font-medium text-foreground tabular-nums">
                        {person.phoneDisplay}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
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

                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "default" }),
                          "no-underline"
                        )}
                      >
                        <MessageCircle
                          className="size-4"
                          aria-hidden="true"
                        />
                        <span>Chat WhatsApp</span>
                        <ExternalLink
                          className="size-3.5"
                          aria-hidden="true"
                        />
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                <span>{SHOWROOM.city}</span>
              </span>
              <span>{SHOWROOM.hours}</span>
            </div>

            <div role="status" aria-live="polite" className="sr-only">
              {copyStatus}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </WhatsAppDialogContext.Provider>
  )
}

export function useWhatsAppDialog(): WhatsAppDialogContextValue {
  const context = React.useContext(WhatsAppDialogContext)
  if (!context) {
    throw new Error(
      "useWhatsAppDialog harus digunakan di dalam WhatsAppDialogProvider."
    )
  }
  return context
}
