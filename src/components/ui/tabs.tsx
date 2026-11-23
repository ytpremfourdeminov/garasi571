import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cn } from "cn"

type TabsVariant = "line" | "boxed"

const TabsVariantContext = React.createContext<TabsVariant>("line")

function Tabs({ className, ...props }: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  variant = "line",
  ...props
}: TabsPrimitive.List.Props & {
  variant?: TabsVariant
}) {
  return (
    <TabsVariantContext.Provider value={variant}>
      <TabsPrimitive.List
        data-slot="tabs-list"
        data-variant={variant}
        className={cn(
          "flex w-full items-center overflow-x-auto rounded-none",
          variant === "line" && "gap-1 border-b border-border bg-transparent",
          variant === "boxed" && "gap-1 border border-border bg-secondary p-1",
          className
        )}
        {...props}
      />
    </TabsVariantContext.Provider>
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  const variant = React.useContext(TabsVariantContext)

  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex min-h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-none px-4 py-2.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors select-none hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        variant === "line" &&
          "-mb-px border-b-2 border-transparent data-active:border-primary data-active:font-semibold data-active:text-foreground aria-selected:border-primary aria-selected:font-semibold aria-selected:text-foreground",
        variant === "boxed" &&
          "border border-transparent data-active:border-border data-active:bg-card data-active:font-semibold data-active:text-foreground aria-selected:border-border aria-selected:bg-card aria-selected:font-semibold aria-selected:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn(
        "flex-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
