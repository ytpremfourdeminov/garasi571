import * as React from "react"
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react"
import { cn } from "cn"
import type { CarImage } from "@/lib/domain/types"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type CarGalleryImage = Pick<CarImage, "src" | "width" | "height" | "alt"> &
  Partial<Omit<CarImage, "src" | "width" | "height" | "alt">>

interface CarGalleryProps {
  images: readonly CarGalleryImage[]
  carName: string
}

export function CarGallery({ images, carName }: CarGalleryProps) {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [lightboxOpen, setLightboxOpen] = React.useState(false)
  const thumbRefs = React.useRef<Array<HTMLButtonElement | null>>([])

  const totalImages = images.length
  const safeIndex =
    totalImages > 0 ? Math.min(activeIndex, totalImages - 1) : 0
  const activeImage = totalImages > 0 ? images.at(safeIndex) : undefined

  React.useEffect(() => {
    setActiveIndex(0)
    setLightboxOpen(false)
  }, [images, carName])

  React.useEffect(() => {
    const activeThumb = thumbRefs.current[safeIndex]
    if (activeThumb) {
      activeThumb.scrollIntoView({
        block: "nearest",
        inline: "nearest",
      })
    }
  }, [safeIndex])

  const showPrev = React.useCallback(() => {
    if (totalImages <= 1) return
    setActiveIndex((prev) => (prev <= 0 ? totalImages - 1 : prev - 1))
  }, [totalImages])

  const showNext = React.useCallback(() => {
    if (totalImages <= 1) return
    setActiveIndex((prev) => (prev >= totalImages - 1 ? 0 : prev + 1))
  }, [totalImages])

  React.useEffect(() => {
    if (!lightboxOpen || totalImages <= 1) return

    const handleWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        showPrev()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        showNext()
      }
    }

    window.addEventListener("keydown", handleWindowKeyDown)
    return () => {
      window.removeEventListener("keydown", handleWindowKeyDown)
    }
  }, [lightboxOpen, totalImages, showPrev, showNext])

  const handleContainerKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    if (totalImages <= 1) return
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      showPrev()
    } else if (event.key === "ArrowRight") {
      event.preventDefault()
      showNext()
    }
  }

  if (!activeImage) {
    return (
      <div className="flex aspect-[4/3] w-full items-center justify-center border border-border bg-secondary text-sm text-muted-foreground">
        Foto unit belum tersedia.
      </div>
    )
  }

  return (
    <div
      className="min-w-0 space-y-3"
      onKeyDown={handleContainerKeyDown}
      aria-label={`Galeri foto ${carName}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden border border-border bg-secondary">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          aria-label={`Perbesar foto ${safeIndex + 1} dari ${totalImages}`}
          className="group relative block h-full w-full focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
        >
          <img
            src={activeImage.src}
            width={activeImage.width}
            height={activeImage.height}
            alt={activeImage.alt}
            fetchPriority="high"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
          />

          <span className="pointer-events-none absolute top-3 right-3 inline-flex min-h-9 items-center gap-1.5 bg-[#161514]/85 px-3 py-1.5 text-xs font-medium text-[#FAF9F7] transition-colors group-hover:bg-[#161514]">
            <Maximize2 className="size-3.5" aria-hidden="true" />
            <span>Perbesar</span>
          </span>
        </button>

        {totalImages > 1 ? (
          <>
            <button
              type="button"
              onClick={showPrev}
              aria-label="Foto sebelumnya"
              className="absolute top-1/2 left-3 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center bg-[#161514]/85 text-[#FAF9F7] transition-colors hover:bg-[#161514] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF9F7]"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={showNext}
              aria-label="Foto berikutnya"
              className="absolute top-1/2 right-3 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center bg-[#161514]/85 text-[#FAF9F7] transition-colors hover:bg-[#161514] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF9F7]"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        ) : null}

        <div
          aria-live="polite"
          className="pointer-events-none absolute right-3 bottom-3 z-10 bg-[#161514] px-3 py-1.5 text-xs font-medium text-[#FAF9F7] tabular-nums"
        >
          {safeIndex + 1} / {totalImages}
        </div>
      </div>

      {totalImages > 1 ? (
        <div
          className="flex min-w-0 gap-2 overflow-x-auto pb-2"
          role="region"
          aria-label="Daftar thumbnail foto"
        >
          {images.map((img, idx) => {
            const isActive = idx === safeIndex
            return (
              <button
                key={img.src}
                ref={(el) => {
                  thumbRefs.current[idx] = el
                }}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Lihat foto ${idx + 1}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "relative aspect-[4/3] w-20 shrink-0 overflow-hidden border-2 bg-secondary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:w-24",
                  isActive
                    ? "border-primary"
                    : "border-border opacity-80 hover:border-foreground/60 hover:opacity-100",
                )}
              >
                <img
                  src={img.src}
                  width={img.width}
                  height={img.height}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </button>
            )
          })}
        </div>
      ) : null}

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-5xl border-[#2E2B28] bg-[#161514] p-4 text-[#FAF9F7] sm:p-6"
          onKeyDown={handleContainerKeyDown}
        >
          <div className="flex items-start justify-between gap-4 border-b border-[#2E2B28] pb-3">
            <DialogHeader className="pr-0">
              <DialogTitle className="text-base text-[#FAF9F7] sm:text-lg">
                {carName}
              </DialogTitle>
              <DialogDescription className="text-xs text-[#C7C2BC] tabular-nums">
                Foto {safeIndex + 1} dari {totalImages}
              </DialogDescription>
            </DialogHeader>

            <DialogClose
              aria-label="Tutup galeri foto"
              className="inline-flex size-11 shrink-0 items-center justify-center border border-[#34302C] bg-[#211F1D] text-[#FAF9F7] transition-colors hover:bg-[#2B2825] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF9F7]"
            >
              <X className="size-5" aria-hidden="true" />
            </DialogClose>
          </div>

          <div className="relative mt-4 flex items-center justify-center bg-[#0E0D0C] px-2 py-3 sm:px-14">
            {totalImages > 1 ? (
              <button
                type="button"
                onClick={showPrev}
                aria-label="Foto sebelumnya"
                className="absolute top-1/2 left-2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center border border-[#34302C] bg-[#161514]/90 text-[#FAF9F7] transition-colors hover:bg-[#2B2825] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF9F7]"
              >
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
            ) : null}

            <img
              src={activeImage.src}
              width={activeImage.width}
              height={activeImage.height}
              alt={activeImage.alt}
              className="mx-auto max-h-[75dvh] w-auto object-contain"
            />

            {totalImages > 1 ? (
              <button
                type="button"
                onClick={showNext}
                aria-label="Foto berikutnya"
                className="absolute top-1/2 right-2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center border border-[#34302C] bg-[#161514]/90 text-[#FAF9F7] transition-colors hover:bg-[#2B2825] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF9F7]"
              >
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <div className="mt-3 flex flex-col gap-2 text-xs text-[#C7C2BC] sm:flex-row sm:items-center sm:justify-between">
            <p className="leading-relaxed text-[#FAF9F7]">{activeImage.alt}</p>
            <p className="shrink-0 font-medium text-[#C7C2BC] tabular-nums">
              {safeIndex + 1} / {totalImages}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
