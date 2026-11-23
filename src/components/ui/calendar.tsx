import * as React from "react"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "cn"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("bg-background p-3", className)}
      classNames={{
        root: "w-fit",
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex w-full flex-col gap-3",
        month_caption:
          "relative flex h-8 w-full items-center justify-center px-9",
        caption_label:
          "inline-flex h-8 items-center gap-1 px-2 text-sm font-semibold whitespace-nowrap text-foreground select-none",
        dropdowns:
          "flex h-8 items-center justify-center gap-1.5 text-sm font-medium",
        dropdown_root:
          "relative inline-flex h-8 items-center border border-input bg-card shadow-none",
        dropdown: "absolute inset-0 cursor-pointer bg-popover opacity-0",
        nav: "pointer-events-none absolute inset-x-0 top-0 z-10 flex h-8 w-full items-center justify-between gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "pointer-events-auto size-8 min-h-0 rounded-none p-0 text-muted-foreground hover:text-foreground"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "pointer-events-auto size-8 min-h-0 rounded-none p-0 text-muted-foreground hover:text-foreground"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "w-9 flex-1 text-center text-sm font-medium text-muted-foreground select-none",
        week: "mt-1 flex w-full",
        day: "relative flex size-9 flex-1 items-center justify-center p-0 text-center text-sm select-none",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon-sm" }),
          "size-9 min-h-0 rounded-none font-normal aria-selected:opacity-100"
        ),
        selected:
          "[&>button]:bg-primary [&>button]:text-primary-foreground [&>button]:hover:bg-primary [&>button]:hover:text-primary-foreground",
        today: "[&>button]:bg-secondary [&>button]:text-foreground",
        outside:
          "text-muted-foreground opacity-50 aria-selected:bg-secondary/50 aria-selected:text-muted-foreground",
        disabled: "text-muted-foreground opacity-40",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...rest }) => {
          if (orientation === "left") {
            return (
              <ChevronLeft
                className={cn("size-4 shrink-0", chevronClassName)}
                {...rest}
              />
            )
          }
          if (orientation === "right") {
            return (
              <ChevronRight
                className={cn("size-4 shrink-0", chevronClassName)}
                {...rest}
              />
            )
          }
          if (orientation === "up") {
            return (
              <ChevronUp
                className={cn("size-3.5 shrink-0", chevronClassName)}
                {...rest}
              />
            )
          }
          return (
            <ChevronDown
              className={cn("size-3.5 shrink-0", chevronClassName)}
              {...rest}
            />
          )
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
