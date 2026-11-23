import { useShowroom } from "@/components/showroom-context"
import { formatRupiah, formatShortJuta } from "@/lib/domain/formatters"
import type { CarUnit, FuelType } from "@/lib/domain/types"

export interface CarAnswerSummaryProps {
  car: CarUnit
  showroomName?: string
}

const FUEL_SUMMARY_LABELS: Record<FuelType, string> = {
  bensin: "bensin",
  diesel: "diesel",
  hybrid: "hybrid",
  phev: "plug-in hybrid (PHEV)",
  ev: "listrik (EV)",
}

function buildSummaryParagraph(car: CarUnit, showroomName: string): string {
  const fuelLabel = FUEL_SUMMARY_LABELS[car.fuelType]
  const enginePhrase =
    car.engineCc !== null && car.engineCc > 0
      ? ` bermesin ${car.engineCc.toLocaleString("id-ID")} cc ${fuelLabel}`
      : car.fuelType !== "bensin"
        ? ` bertenaga ${fuelLabel}`
        : ""

  const intro = `${car.name} tahun ${car.year} warna ${car.color}${enginePhrase} bertransmisi ${car.transmission} tersedia di ${showroomName}, ${car.location}.`

  const primarySim = car.creditSimulations.at(0)
  let pricingSentence: string
  if (car.creditPrice !== null && primarySim !== undefined) {
    pricingSentence = `Unit ini ditawarkan dengan harga cash ${formatRupiah(car.cashPrice)} atau harga kredit ${formatRupiah(car.creditPrice)} (DP mulai ${formatShortJuta(primarySim.dp)}, angsuran ${primarySim.installmentLabel} x ${primarySim.tenorYears} tahun).`
  } else if (car.creditPrice !== null) {
    pricingSentence = `Unit ini ditawarkan dengan harga cash ${formatRupiah(car.cashPrice)} atau harga kredit ${formatRupiah(car.creditPrice)}.`
  } else {
    pricingSentence = `Unit koleksi ini tersedia khusus pembelian cash (Special Price) seharga ${formatRupiah(car.cashPrice)}.`
  }

  const verificationSource = car.mileageVerificationSource?.trim()
  const verificationPhrase = verificationSource
    ? ` (${verificationSource})`
    : ""

  const mileageSentence = car.mileageVerified
    ? `Jarak tempuh tercatat ${car.mileageLabel}${verificationPhrase} dengan status plat ${car.plateInfo}.`
    : `Detail kilometer dapat ditanyakan langsung ke tim sales via WhatsApp, dengan status plat ${car.plateInfo}.`

  const warrantyInfo = car.warrantyInfo?.trim()
  const warrantySentence = warrantyInfo ? `Tersedia ${warrantyInfo}. ` : ""

  const closingSentence = `${warrantySentence}${
    car.tradeInAvailable
      ? "Melayani opsi tukar tambah."
      : "Siap inspeksi langsung di showroom."
  }`

  return `${intro} ${pricingSentence} ${mileageSentence} ${closingSentence}`
}

export function CarAnswerSummary({
  car,
  showroomName,
}: CarAnswerSummaryProps) {
  const showroom = useShowroom()
  const resolvedShowroomName = showroomName?.trim() || showroom.name
  const summaryText = buildSummaryParagraph(car, resolvedShowroomName)

  const keyFacts = [
    {
      label: "Skema Bayar",
      value:
        car.paymentMode === "cash-credit" ? "Cash & Kredit" : "Khusus Cash",
    },
    {
      label: "Kilometer",
      value: car.mileageLabel,
    },
    {
      label: "Nopol",
      value: car.plateInfo,
    },
    {
      label: "Tukar Tambah",
      value: car.tradeInAvailable ? "Bisa tukar tambah" : "Konfirmasi sales",
    },
  ]

  return (
    <section
      aria-labelledby="ringkasan-cepat-heading"
      className="border border-border bg-secondary/70 p-5 sm:p-6"
    >
      <h2
        id="ringkasan-cepat-heading"
        className="text-sm font-semibold tracking-wider text-primary uppercase"
      >
        Ringkasan Unit
      </h2>

      <p className="mt-2.5 text-sm leading-relaxed text-foreground">
        {summaryText}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
        {keyFacts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-sm text-muted-foreground">{fact.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
