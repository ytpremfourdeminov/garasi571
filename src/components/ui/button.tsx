import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding font-medium whitespace-nowrap transition-colors duration-150 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-[#991B1B] active:bg-[#7F1D1D]",
        outline:
          "border-input bg-card text-foreground hover:bg-secondary active:bg-border/60 aria-expanded:bg-secondary",
        secondary:
          "border-border bg-secondary text-secondary-foreground hover:bg-[#E7E3DC] active:bg-border aria-expanded:bg-[#E7E3DC]",
        ghost:
          "text-foreground hover:bg-secondary active:bg-border/60 aria-expanded:bg-secondary",
        destructive:
          "bg-destructive text-primary-foreground hover:bg-[#991B1B] active:bg-[#7F1D1D]",
        link: "text-primary underline-offset-4 hover:underline active:translate-y-0",
      },
      size: {
        default: "min-h-11 gap-2 px-4 py-2 text-sm",
        sm: "min-h-9 gap-1.5 px-3 py-1.5 text-xs",
        lg: "min-h-12 gap-2 px-5 py-2.5 text-sm",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
