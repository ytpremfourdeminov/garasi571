import * as React from "react"
import { format, isValid, parseISO } from "date-fns"
import { id as idLocale } from "date-fns/locale"
import { CalendarIcon, X } from "lucide-react"
import { cn } from "cn"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  id?: string
  value: string | null | undefined
  onChange: (nextIsoDate: string | null) => void
  placeholder?: string
  disabled?: boolean
  "aria-invalid"?: boolean
  className?: string
}

function parseIsoDate(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const parsed = parseISO(value)
  return isValid(parsed) ? parsed : undefined
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Pilih tanggal",
  disabled = false,
  "aria-invalid": ariaInvalid,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const selectedDate = React.useMemo(() => parseIsoDate(value), [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("relative flex items-center", className)}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              aria-invalid={ariaInvalid}
              data-empty={!selectedDate}
              className={cn(
                "min-h-11 w-full justify-start bg-card px-3.5 text-left text-sm font-normal data-[empty=true]:text-muted-foreground",
                selectedDate && !disabled && "pr-10",
                ariaInvalid && "border-destructive"
              )}
            />
          }
        >
          <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="truncate tabular-nums">
            {selectedDate
              ? format(selectedDate, "dd MMM yyyy", { locale: idLocale })
              : placeholder}
          </span>
        </PopoverTrigger>

        {selectedDate && !disabled ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Hapus tanggal"
            className="absolute right-1 inline-flex size-9 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
      </div>

      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          locale={idLocale}
          captionLayout="dropdown"
          startMonth={new Date(2015, 0)}
          endMonth={new Date(2040, 11)}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : null)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
