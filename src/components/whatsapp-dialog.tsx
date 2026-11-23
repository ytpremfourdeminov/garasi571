import * as React from "react"
import { Check, Copy, ExternalLink, MapPin, MessageCircle } from "lucide-react"
import { buildWhatsAppUrl } from "@/lib/domain/formatters"
import { useShowroom } from "@/components/showroom-context"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "cn"

const DEFAULT_DESCRIPTION =
  "Pilih tim sales untuk langsung terhubung via WhatsApp."

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
  const showroom = useShowroom()
  const defaultTitle = `Hubungi Tim Sales ${showroom.name}`
  const defaultMessage = `Halo ${showroom.name}, saya tertarik melihat unit mobil bekas yang tersedia dan ingin konsultasi atau jadwal kunjungan showroom.`

  const [open, setOpen] = React.useState(false)
  const [dialogOptions, setDialogOptions] =
    React.useState<OpenWhatsAppDialogOptions>({
      title: defaultTitle,
      description: DEFAULT_DESCRIPTION,
      message: defaultMessage,
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
        title: opts?.title ?? defaultTitle,
        description: opts?.description ?? DEFAULT_DESCRIPTION,
        message: opts?.message || defaultMessage,
      })
      setCopiedId(null)
      setCopyStatus("")
      setOpen(true)
    },
    [defaultMessage, defaultTitle]
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
              <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                Pratinjau Pesan WhatsApp
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {dialogOptions.message}
              </p>
            </div>

            <div className="space-y-3">
              {showroom.sales.length > 0 ? (
                showroom.sales.map((person) => {
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
                        <p className="text-sm text-muted-foreground">
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
                })
              ) : (
                <div className="border border-border bg-card p-4 text-sm text-muted-foreground">
                  Kontak WhatsApp tim sales sedang diperbarui. Silakan kunjungi
                  showroom kami atau hubungi lewat Instagram{" "}
                  {showroom.instagramHandle}.
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                <span>{showroom.city}</span>
              </span>
              <span>{showroom.hours}</span>
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
