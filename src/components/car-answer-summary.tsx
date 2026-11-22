import { formatRupiah, formatShortJuta, type CarUnit } from "@/data/cars"
import { SHOWROOM } from "@/data/showroom"

export interface CarAnswerSummaryProps {
  car: CarUnit
}

function buildSummaryParagraph(car: CarUnit): string {
  const intro = `${car.name} tahun ${car.year} warna ${car.color} bertransmisi ${car.transmission} tersedia di ${SHOWROOM.name}, ${car.location}.`

  const primarySim = car.creditSimulations.at(0)
  let pricingSentence: string
  if (car.creditPrice !== null && primarySim !== undefined) {
    pricingSentence = `Unit ini ditawarkan dengan harga cash ${formatRupiah(car.cashPrice)} atau harga kredit ${formatRupiah(car.creditPrice)} (DP mulai ${formatShortJuta(primarySim.dp)}, angsuran ${primarySim.installmentLabel} x ${primarySim.tenorYears} tahun).`
  } else if (car.creditPrice !== null) {
    pricingSentence = `Unit ini ditawarkan dengan harga cash ${formatRupiah(car.cashPrice)} atau harga kredit ${formatRupiah(car.creditPrice)}.`
  } else {
    pricingSentence = `Unit koleksi ini tersedia khusus pembelian cash (Special Price) seharga ${formatRupiah(car.cashPrice)}.`
  }

  const mileageSentence = car.mileageVerified
    ? `Jarak tempuh tercatat ${car.mileageLabel} dengan status plat ${car.plateInfo}.`
    : `Detail kilometer dapat ditanyakan langsung ke tim sales via WhatsApp, dengan status plat ${car.plateInfo}.`

  const closingSentence = car.tradeInAvailable
    ? "Melayani opsi tukar tambah."
    : "Siap inspeksi langsung di showroom."

  return `${intro} ${pricingSentence} ${mileageSentence} ${closingSentence}`
}

export function CarAnswerSummary({ car }: CarAnswerSummaryProps) {
  const summaryText = buildSummaryParagraph(car)

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
        className="text-xs font-semibold tracking-wider text-primary uppercase"
      >
        Ringkasan Cepat Unit
      </h2>

      <p className="mt-2.5 text-sm leading-relaxed text-foreground">
        {summaryText}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
        {keyFacts.map((fact) => (
          <div key={fact.label} className="min-w-0">
            <dt className="text-xs text-muted-foreground">{fact.label}</dt>
            <dd className="mt-0.5 text-sm font-semibold text-foreground tabular-nums">
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
