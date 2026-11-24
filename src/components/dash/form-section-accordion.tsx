import * as React from "react"
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion"
import { cn } from "cn"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion"

export interface FormSectionAccordionProps {
  defaultValue: string[]
  value?: string[]
  onValueChange?: (value: string[]) => void
  className?: string
  children: React.ReactNode
}

/**
 * Accordion container for car inventory form sections.
 * Keeps panels mounted so validation and completeness scroll targets remain reachable.
 */
export function FormSectionAccordion({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: FormSectionAccordionProps) {
  return (
    <Accordion
      multiple
      keepMounted
      defaultValue={defaultValue}
      value={value}
      onValueChange={onValueChange}
      className={cn("gap-6", className)}
    >
      {children}
    </Accordion>
  )
}

export interface FormSectionAccordionItemProps {
  value: string
  headingId?: string
  eyebrow: string
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  badge?: React.ReactNode
  actions?: React.ReactNode
  completenessId?: string
  className?: string
  headerClassName?: string
  contentClassName?: string
  children: React.ReactNode
}

/**
 * Collapsible card section for dashboard car forms.
 * Interactive controls in `actions` are rendered outside the trigger button.
 */
export function FormSectionAccordionItem({
  value,
  headingId,
  eyebrow,
  title,
  description,
  icon: Icon,
  badge,
  actions,
  completenessId,
  className,
  headerClassName,
  contentClassName,
  children,
}: FormSectionAccordionItemProps) {
  return (
    <AccordionItem
      value={value}
      data-completeness-id={completenessId}
      className={cn(
        "group/accordion-item border border-border bg-card not-last:border-b",
        className
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3 border-b border-transparent px-5 py-4 transition-colors group-data-open/accordion-item:border-border group-data-open/accordion-item:bg-secondary/25 sm:px-6",
          headerClassName
        )}
      >
        <AccordionPrimitive.Header className="flex min-w-0 flex-1">
          <AccordionPrimitive.Trigger
            data-slot="accordion-trigger"
            className={cn(
              "group/accordion-trigger flex flex-1 cursor-pointer items-center justify-between gap-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {Icon ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-primary uppercase">
                    <Icon className="size-3.5 shrink-0" aria-hidden={true} />
                    <span>{eyebrow}</span>
                  </span>
                ) : (
                  <span className="font-heading text-xs font-semibold tracking-wider text-primary uppercase tabular-nums">
                    {eyebrow}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <span
                  id={headingId}
                  className="font-heading text-base font-bold tracking-tight text-foreground sm:text-lg"
                >
                  {title}
                </span>
                {badge ? <div className="shrink-0">{badge}</div> : null}
              </div>

              {description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>

            <span
              aria-hidden="true"
              className="flex size-7 shrink-0 items-center justify-center border border-border bg-secondary/60 text-muted-foreground transition-colors group-hover/accordion-trigger:border-foreground/30 group-hover/accordion-trigger:text-foreground"
            >
              <ChevronDownIcon className="size-4 group-aria-expanded/accordion-trigger:hidden" />
              <ChevronUpIcon className="hidden size-4 group-aria-expanded/accordion-trigger:inline" />
            </span>
          </AccordionPrimitive.Trigger>
        </AccordionPrimitive.Header>

        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>

      <AccordionContent className={cn("p-5 sm:p-6", contentClassName)}>
        {children}
      </AccordionContent>
    </AccordionItem>
  )
}
