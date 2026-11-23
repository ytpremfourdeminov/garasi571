import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { X } from "lucide-react"
import { cn } from "cn"

const Sheet = SheetPrimitive.Root
const SheetTrigger = SheetPrimitive.Trigger
const SheetClose = SheetPrimitive.Close
const SheetPortal = SheetPrimitive.Portal

function SheetBackdrop({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Backdrop>) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-backdrop"
      className={cn(
        "fixed inset-0 z-50 bg-[#161514]/55 transition-opacity duration-150 data-starting-style:opacity-0 data-ending-style:opacity-0",
        className
      )}
      {...props}
    />
  )
}

type SheetSide = "right" | "left" | "bottom"

const sheetSideClasses: Record<SheetSide, string> = {
  right:
    "inset-y-0 right-0 h-dvh w-[min(100vw,24rem)] border-l data-starting-style:translate-x-full data-ending-style:translate-x-full",
  left: "inset-y-0 left-0 h-dvh w-[min(100vw,24rem)] border-r data-starting-style:-translate-x-full data-ending-style:-translate-x-full",
  bottom:
    "inset-x-0 bottom-0 max-h-[85dvh] w-full border-t data-starting-style:translate-y-full data-ending-style:translate-y-full",
}

interface SheetContentProps
  extends React.ComponentProps<typeof SheetPrimitive.Popup> {
  side?: SheetSide
  showCloseButton?: boolean
  closeLabel?: string
}

function SheetContent({
  side = "right",
  className,
  children,
  showCloseButton = true,
  closeLabel = "Tutup panel",
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetBackdrop />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        className={cn(
          "fixed z-50 flex flex-col overflow-y-auto rounded-none border-foreground/20 bg-card p-5 text-card-foreground shadow-xl transition-transform duration-200 sm:p-6",
          sheetSideClasses[side],
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton ? (
          <SheetPrimitive.Close
            aria-label={closeLabel}
            className="absolute top-2.5 right-2.5 inline-flex size-11 items-center justify-center rounded-none border border-transparent text-muted-foreground transition-colors hover:border-border hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <X className="size-5" aria-hidden="true" />
          </SheetPrimitive.Close>
        ) : null}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 pr-12 text-left", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 pt-5", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-lg font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm leading-relaxed text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetBackdrop,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}
