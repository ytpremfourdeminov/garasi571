import { Link } from "@tanstack/react-router"
import { Camera, Check, Plus } from "lucide-react"
import { formatRupiah, formatShortJuta, type CarUnit } from "@/data/cars"
import { Button, buttonVariants } from "@/components/ui/button"
import { useCompare } from "@/components/compare-context"
import { cn } from "cn"

export interface CarCardProps {
  car: CarUnit
}

export function CarCard({ car }: CarCardProps) {
  const { isSelected, toggleCompare } = useCompare()
  const selected = isSelected(car.slug)
  const coverImage = car.images[0]
  const startingDp =
    car.creditSimulations.length > 0
      ? Math.min(...car.creditSimulations.map((sim) => sim.dp))
      : null

  return (
    <article className="group flex min-w-0 flex-col justify-between rounded-none border border-border bg-card transition-colors duration-150 hover:border-foreground/40">
      <div>
        <Link
          to="/mobil/$slug"
          params={{ slug: car.slug }}
          className="relative block aspect-[4/3] overflow-hidden bg-secondary no-underline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
        >
          <img
            src={coverImage.src}
            width={coverImage.width}
            height={coverImage.height}
            alt={coverImage.alt}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />

          <span className="absolute top-2.5 left-2.5 bg-[#161514] px-2.5 py-1 text-xs font-medium text-[#FAF9F7]">
            {car.categoryLabel}
          </span>

          <span className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1.5 bg-[#161514] px-2.5 py-1 text-xs font-medium text-[#FAF9F7] tabular-nums">
            <Camera className="size-3.5" aria-hidden="true" />
            <span>{car.images.length} foto</span>
          </span>
        </Link>

        <div className="p-4 sm:p-5">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span className="tabular-nums">{car.year}</span>
            <span aria-hidden="true">/</span>
            <span>{car.transmission}</span>
            <span aria-hidden="true">/</span>
            <span>Plat {car.plateInfo}</span>
          </p>

          <h3 className="mt-1.5 font-heading text-lg leading-snug font-semibold tracking-tight text-foreground">
            <Link
              to="/mobil/$slug"
              params={{ slug: car.slug }}
              className="no-underline transition-colors hover:text-primary"
            >
              {car.name}
            </Link>
          </h3>

          <div className="mt-3 border-y border-border py-3 tabular-nums">
            {car.creditPrice !== null ? (
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">Harga Cash</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatRupiah(car.cashPrice)}
                  </span>
                </div>

                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-primary">
                    Harga Kredit
                  </span>
                  <span className="font-heading text-lg font-bold text-foreground">
                    {formatRupiah(car.creditPrice)}
                  </span>
                </div>

                {(car.creditPriceNote || startingDp !== null) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5 text-xs text-muted-foreground">
                    <span>{car.creditPriceNote ?? "Tersedia opsi kredit"}</span>
                    {startingDp !== null ? (
                      <span className="font-medium text-foreground">
                        DP mulai {formatShortJuta(startingDp)}
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-primary">
                    Special Price Cash
                  </span>
                  <span className="border border-border bg-secondary px-2 py-0.5 text-[11px] font-semibold text-foreground">
                    Khusus Cash
                  </span>
                </div>
                <p className="font-heading text-lg font-bold text-foreground">
                  {formatRupiah(car.cashPrice)}
                </p>
              </div>
            )}
          </div>

          <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-muted-foreground">
            {car.highlights.slice(0, 3).map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check
                  className="mt-0.5 size-3.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border p-4 pt-3.5 sm:px-5 sm:pb-5">
        <Link
          to="/mobil/$slug"
          params={{ slug: car.slug }}
          className={cn(
            buttonVariants({ variant: "default" }),
            "flex-1 no-underline"
          )}
        >
          Lihat Detail
        </Link>

        <Button
          type="button"
          variant={selected ? "secondary" : "outline"}
          aria-pressed={selected}
          onClick={() => toggleCompare(car.slug)}
          className="shrink-0 px-3"
        >
          {selected ? (
            <>
              <Check className="size-4 text-primary" aria-hidden="true" />
              <span>Dibandingkan</span>
            </>
          ) : (
            <>
              <Plus className="size-4" aria-hidden="true" />
              <span>Bandingkan</span>
            </>
          )}
        </Button>
      </div>
    </article>
  )
}
