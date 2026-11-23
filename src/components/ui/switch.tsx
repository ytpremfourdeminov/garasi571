import { Switch as SwitchPrimitive } from "@base-ui/react/switch"
import { cn } from "cn"

function Switch({ className, ...props }: SwitchPrimitive.Root.Props) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "group/switch inline-flex min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring data-disabled:cursor-not-allowed data-disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span
        data-slot="switch-track"
        aria-hidden="true"
        className="flex h-6 w-11 items-center rounded-none border border-input bg-secondary p-0.5 transition-colors duration-150 group-data-checked/switch:border-primary group-data-checked/switch:bg-primary"
      >
        <SwitchPrimitive.Thumb
          data-slot="switch-thumb"
          className="pointer-events-none block size-4.5 rounded-none bg-foreground transition-transform duration-150 data-checked:translate-x-5 data-checked:bg-primary-foreground"
        />
      </span>
    </SwitchPrimitive.Root>
  )
}

export { Switch }
