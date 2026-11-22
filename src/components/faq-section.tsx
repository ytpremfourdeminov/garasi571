import { ChevronDown } from "lucide-react"
import { SHOWROOM_FAQS } from "@/data/faq"

export function FaqSection() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="scroll-mt-20 border-t border-border bg-background"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start lg:gap-10">
          <div className="min-w-0 lg:col-span-4">
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
                04 / Pertanyaan Umum
              </span>
            </div>

            <h2
              id="faq-heading"
              className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Pertanyaan Umum Pembeli di Surakarta
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Rangkuman ketentuan showroom Garasi 571 mengenai lokasi, jam buka,
              skema pembayaran cash dan kredit, tukar tambah, serta prosedur cek
              unit langsung.
            </p>
          </div>

          <div className="min-w-0 lg:col-span-8">
            <div className="divide-y divide-border border border-border bg-card">
              {SHOWROOM_FAQS.map((item) => (
                <details key={item.id} className="group">
                  <summary className="flex min-h-11 list-none items-center justify-between gap-4 px-5 py-3.5 text-left font-heading text-base font-semibold text-foreground transition-colors hover:bg-secondary/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <ChevronDown
                      className="size-4 shrink-0 text-primary transition-transform duration-200 group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>

                  <div className="border-t border-border/60 bg-background/60 px-5 py-4">
                    <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
