import {
  AlertTriangle,
  Check,
  ShieldCheck,
  Wrench,
} from "lucide-react"
import { cn } from "cn"
import type { CarUnit } from "@/lib/domain/types"

export interface CarInspectionSectionProps {
  car: CarUnit
}

export function CarInspectionSection({ car }: CarInspectionSectionProps) {
  const summary = car.inspectionSummary

  const sectorGrades: Array<{ label: string; value: string }> = [
    {
      label: "Eksterior & Bodi",
      value: summary.exteriorGrade?.trim() ?? "",
    },
    {
      label: "Interior & Kabin",
      value: summary.interiorGrade?.trim() ?? "",
    },
    {
      label: "Mesin & Transmisi",
      value: summary.engineTransmissionGrade?.trim() ?? "",
    },
    {
      label: "Kaki-kaki & Suspensi",
      value: summary.undercarriageSuspensionGrade?.trim() ?? "",
    },
    {
      label: "Kondisi Ban",
      value: summary.tireCondition?.trim() ?? "",
    },
  ].filter((item) => item.value.length > 0)

  const inspectionNotes = summary.notes?.trim() ?? ""
  const warrantyInfo = car.warrantyInfo?.trim() ?? ""
  const hasTrustFlags = Boolean(
    summary.floodFree || summary.majorAccidentFree,
  )
  const hasInspectionSummary = Boolean(
    hasTrustFlags || sectorGrades.length > 0 || inspectionNotes.length > 0,
  )
  const hasMaintenance = car.recentMaintenance.length > 0
  const hasImperfections = car.imperfections.length > 0

  if (
    !hasInspectionSummary &&
    !warrantyInfo &&
    !hasMaintenance &&
    !hasImperfections
  ) {
    return null
  }

  return (
    <section aria-labelledby="inspection-heading" className="space-y-4">
      <h2
        id="inspection-heading"
        className="font-heading text-xl font-semibold tracking-tight text-foreground"
      >
        Inspeksi Kualitas &amp; Transparansi Fisik
      </h2>

      <div className="flex flex-wrap gap-2.5">
        {summary.floodFree ? (
          <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 px-3.5 py-2 text-sm font-semibold text-foreground">
            <ShieldCheck
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>Jaminan Bebas Banjir</span>
          </div>
        ) : null}

        {summary.majorAccidentFree ? (
          <div className="inline-flex items-center gap-2 border border-primary/40 bg-primary/10 px-3.5 py-2 text-sm font-semibold text-foreground">
            <ShieldCheck
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>Jaminan Bebas Tabrak Besar</span>
          </div>
        ) : null}

        {car.mechanicCheckAllowed ? (
          <div className="inline-flex items-center gap-2 border border-border bg-secondary px-3.5 py-2 text-sm font-semibold text-foreground">
            <Wrench
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>Boleh Bawa Mekanik / Cek Bengkel Resmi</span>
          </div>
        ) : null}

        {warrantyInfo ? (
          <div className="inline-flex items-center gap-2 border border-border bg-card px-3.5 py-2 text-sm font-semibold text-foreground">
            <Check
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>{warrantyInfo}</span>
          </div>
        ) : null}
      </div>

      {sectorGrades.length > 0 || inspectionNotes ? (
        <div className="border border-border bg-card">
          {sectorGrades.length > 0 ? (
            <dl className="grid grid-cols-1 border-b border-border sm:grid-cols-2">
              {sectorGrades.map((sector) => (
                <div
                  key={sector.label}
                  className="border-r border-b border-border px-4 py-3.5 last:border-b-0"
                >
                  <dt className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
                    {sector.label}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {sector.value}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}

          {inspectionNotes ? (
            <div className="p-4 sm:p-5">
              <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                Catatan Ringkasan Inspeksi
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">
                {inspectionNotes}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {hasMaintenance ? (
        <div className="border border-border bg-card p-5">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-wider text-primary uppercase">
            <Wrench className="size-4 shrink-0" aria-hidden="true" />
            <h3>Peremajaan &amp; Servis Terakhir</h3>
          </div>

          <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {car.recentMaintenance.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm leading-relaxed text-foreground"
              >
                <Check
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasImperfections ? (
        <div className="border border-border bg-secondary/60 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold tracking-wider text-foreground uppercase">
              <AlertTriangle
                className="size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <h3>Transparansi Catatan Fisik / Minus Minor</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              Dicatat jujur agar pembeli tahu kondisi riil sebelum ke showroom
            </span>
          </div>

          <ul className="mt-3.5 space-y-2.5">
            {car.imperfections.map((item, idx) => (
              <li
                key={`${item.area}-${idx}`}
                className="flex flex-col justify-between gap-2 border border-border bg-card p-3.5 sm:flex-row sm:items-center"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-foreground">
                    {item.area}
                  </p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>

                <span
                  className={cn(
                    "inline-flex w-fit shrink-0 items-center border px-2.5 py-0.5 text-sm font-semibold uppercase",
                    item.severity === "moderate"
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border bg-secondary text-foreground",
                  )}
                >
                  {item.severity === "moderate" ? "Sedang" : "Minor"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
