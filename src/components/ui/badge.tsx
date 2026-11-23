import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const badgeVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1 rounded-none border px-2 py-0.5 text-[11px] font-semibold tracking-wider whitespace-nowrap uppercase transition-colors [&_svg]:pointer-events-none [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-foreground bg-foreground text-background",
        primary: "border-primary bg-primary text-primary-foreground",
        secondary: "border-border bg-secondary text-secondary-foreground",
        outline: "border-input bg-card text-foreground",
        destructive:
          "border-destructive/30 bg-destructive/10 text-[#991B1B]",
        success: "border-emerald-700/30 bg-emerald-50 text-emerald-900",
        warning: "border-amber-700/35 bg-amber-50 text-amber-950",
        amber: "border-amber-700/35 bg-amber-50 text-amber-950",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
