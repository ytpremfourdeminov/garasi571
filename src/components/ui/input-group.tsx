import * as React from "react"
import { cn } from "cn"

function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-group"
      role="group"
      className={cn(
        "group/input-group relative flex min-h-11 w-full items-center rounded-none border border-input bg-card transition-colors outline-none",
        "has-[[data-slot=input-group-control]:focus-visible]:border-foreground has-[[data-slot=input-group-control]:focus-visible]:outline-2 has-[[data-slot=input-group-control]:focus-visible]:outline-offset-2 has-[[data-slot=input-group-control]:focus-visible]:outline-ring",
        "has-[[data-slot][aria-invalid=true]]:border-destructive has-[[data-slot][aria-invalid=true]:focus-visible]:outline-destructive",
        "has-[[data-slot=input-group-control]:disabled]:cursor-not-allowed has-[[data-slot=input-group-control]:disabled]:bg-secondary has-[[data-slot=input-group-control]:disabled]:opacity-60",
        "has-[>[data-align=inline-start]]:[&>input]:pl-2",
        "has-[>[data-align=inline-end]]:[&>input]:pr-2",
        className
      )}
      {...props}
    />
  )
}

type InputGroupAddonAlign =
  | "inline-start"
  | "inline-end"
  | "block-start"
  | "block-end"

function InputGroupAddon({
  className,
  align = "inline-start",
  ...props
}: React.ComponentProps<"div"> & {
  align?: InputGroupAddonAlign
}) {
  return (
    <div
      role="group"
      data-slot="input-group-addon"
      data-align={align}
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("button")) {
          return
        }
        e.currentTarget.parentElement
          ?.querySelector<HTMLElement>("[data-slot=input-group-control]")
          ?.focus()
      }}
      className={cn(
        "flex h-auto shrink-0 cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground select-none [&>svg:not([class*='size-'])]:size-4",
        align === "inline-start" && "order-first pl-3.5",
        align === "inline-end" && "order-last pr-3.5",
        align === "block-start" && "order-first w-full justify-start px-3.5 pt-2.5",
        align === "block-end" && "order-last w-full justify-start px-3.5 pb-2.5",
        className
      )}
      {...props}
    />
  )
}

function InputGroupText({
  className,
  ...props
}: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap text-sm font-medium text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function InputGroupInput({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  const isNumericType = type === "number" || type === "tel"

  return (
    <input
      type={type}
      data-slot="input-group-control"
      className={cn(
        "min-w-0 w-full flex-1 rounded-none border-0 bg-transparent px-3.5 py-2.5 text-sm text-foreground shadow-none outline-none placeholder:text-muted-foreground/75 focus-visible:outline-none disabled:cursor-not-allowed",
        isNumericType && "tabular-nums",
        className
      )}
      {...props}
    />
  )
}

export {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
}
