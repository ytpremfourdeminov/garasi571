import { Check, FileCheck2, ShieldCheck } from "lucide-react"
import { cn } from "cn"
import { formatRupiah } from "@/lib/domain/formatters"
import type { CarUnit, DocumentChecklist } from "@/lib/domain/types"

export interface CarLegalitySectionProps {
  car: CarUnit
}

const DOCUMENT_ITEMS: Array<{
  key: keyof DocumentChecklist
  label: string
}> = [
  { key: "stnk", label: "STNK" },
  { key: "bpkb", label: "BPKB" },
  { key: "faktur", label: "Faktur" },
  { key: "nik", label: "NIK" },
  { key: "manualBook", label: "Buku Manual" },
  { key: "serviceBook", label: "Buku Servis" },
  { key: "spareKey", label: "Kunci Serep" },
]

export function CarLegalitySection({ car }: CarLegalitySectionProps) {
  const hasAnyCheckedDoc = DOCUMENT_ITEMS.some(
    (doc) => car.documentChecklist[doc.key] === true,
  )

  const hasStructuredLegality = Boolean(
    car.plateAreaCode?.trim() ||
      car.plateOddEven?.trim() ||
      car.taxStatus?.trim() ||
      car.taxExpiryDate?.trim() ||
      car.stnk5yrExpiryDate?.trim() ||
      (car.estimatedAnnualTax !== null && car.estimatedAnnualTax > 0) ||
      car.ownershipType?.trim() ||
      (car.ownershipHand !== null && car.ownershipHand > 0) ||
      car.usageHistory?.trim() ||
      hasAnyCheckedDoc,
  )

  if (!hasStructuredLegality) {
    return null
  }

  const plateDetail = [
    car.plateAreaCode?.trim() ? `Kode ${car.plateAreaCode.trim()}` : null,
    car.plateOddEven?.trim() || null,
  ]
    .filter(Boolean)
    .join(" • ")

  const ownershipDetail = [
    car.ownershipType?.trim() || null,
    car.ownershipHand !== null && car.ownershipHand > 0
      ? `Tangan ke-${car.ownershipHand}`
      : null,
  ]
    .filter(Boolean)
    .join(" • ")

  const identityStatus = [
    car.stnkBlockFree ? "Bebas Blokir STNK" : "Konfirmasi Status STNK",
    car.vinEngineMatched
      ? "No. Rangka & Mesin Sesuai"
      : "Cek Fisik No. Rangka/Mesin",
  ].join(" • ")

  const legalityItems: Array<{ label: string; value: string }> = []

  if (car.taxStatus?.trim()) {
    legalityItems.push({
      label: "Status Pajak",
      value: car.taxStatus.trim(),
    })
  }

  if (car.taxExpiryDate?.trim()) {
    legalityItems.push({
      label: "Jatuh Tempo Tahunan",
      value: car.taxExpiryDate.trim(),
    })
  }

  if (car.stnk5yrExpiryDate?.trim()) {
    legalityItems.push({
      label: "Masa Berlaku Kaleng 5 Tahunan",
      value: car.stnk5yrExpiryDate.trim(),
    })
  }

  if (car.estimatedAnnualTax !== null && car.estimatedAnnualTax > 0) {
    legalityItems.push({
      label: "Estimasi PKB Tahunan",
      value: `${formatRupiah(car.estimatedAnnualTax)} / tahun`,
    })
  }

  if (ownershipDetail) {
    legalityItems.push({
      label: "Kepemilikan",
      value: ownershipDetail,
    })
  }

  if (car.usageHistory?.trim()) {
    legalityItems.push({
      label: "Riwayat Pemakaian",
      value: car.usageHistory.trim(),
    })
  }

  if (plateDetail) {
    legalityItems.push({
      label: "Identitas Plat",
      value: plateDetail,
    })
  }

  legalityItems.push({
    label: "Status Blokir STNK & Kecocokan No. Rangka/Mesin",
    value: identityStatus,
  })

  return (
    <section aria-labelledby="legality-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2
          id="legality-heading"
          className="font-heading text-xl font-semibold tracking-tight text-foreground"
        >
          Legalitas, Pajak &amp; Kelengkapan Dokumen
        </h2>
        <span className="inline-flex items-center gap-1.5 border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          <span>Dokumen Terverifikasi Showroom</span>
        </span>
      </div>

      <dl className="grid grid-cols-1 border-t border-l border-border bg-card sm:grid-cols-2">
        {legalityItems.map((item) => (
          <div
            key={item.label}
            className="border-r border-b border-border px-4 py-3.5"
          >
            <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm font-semibold text-foreground tabular-nums">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="border border-border bg-card p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          <FileCheck2 className="size-4 text-primary" aria-hidden="true" />
          <span>Checklist 7 Dokumen &amp; Kelengkapan</span>
        </div>

        <ul className="mt-3 flex flex-wrap gap-2">
          {DOCUMENT_ITEMS.map((doc) => {
            const isAvailable = car.documentChecklist[doc.key] === true
            return (
              <li
                key={doc.key}
                className={cn(
                  "inline-flex items-center gap-1.5 border px-3 py-1.5 text-xs font-semibold",
                  isAvailable
                    ? "border-primary/40 bg-primary/10 text-foreground"
                    : "border-border bg-secondary/50 text-muted-foreground",
                )}
              >
                {isAvailable ? (
                  <Check
                    className="size-3.5 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50"
                    aria-hidden="true"
                  />
                )}
                <span>{doc.label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
