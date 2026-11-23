import { SHOWROOM_FAQS } from "@/data/faq"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

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
                04 / FAQ
              </span>
            </div>

            <h2
              id="faq-heading"
              className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              Pertanyaan Umum
            </h2>
          </div>

          <div className="min-w-0 lg:col-span-8">
            <Accordion className="border border-border bg-card">
              {SHOWROOM_FAQS.map((item) => (
                <AccordionItem key={item.id} value={item.id}>
                  <AccordionTrigger className="min-h-11 items-center gap-4 px-5 py-3.5 font-heading text-base font-semibold text-foreground hover:bg-secondary/60 hover:no-underline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring **:data-[slot=accordion-trigger-icon]:text-primary">
                    <span>{item.question}</span>
                  </AccordionTrigger>

                  <AccordionContent
                    keepMounted
                    className="border-t border-border/60 bg-background/60 px-5 py-4 text-sm leading-relaxed text-muted-foreground"
                  >
                    <p className="max-w-3xl">{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>
    </section>
  )
}
