import { Toast as ToastPrimitive } from "@base-ui/react/toast"
import { cn } from "cn"
import {
  AlertTriangleIcon,
  CheckIcon,
  Loader2Icon,
  XIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"

const toast = ToastPrimitive.createToastManager()

function ToastProvider({ ...props }: ToastPrimitive.Provider.Props) {
  return <ToastPrimitive.Provider {...props} />
}

function ToastPortal({ ...props }: ToastPrimitive.Portal.Props) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />
}

function ToastViewport({ className, ...props }: ToastPrimitive.Viewport.Props) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "pointer-events-none fixed inset-x-4 bottom-4 z-100 mx-auto w-auto max-w-105 outline-none sm:w-full",
        className
      )}
      {...props}
    />
  )
}

function getToastSurfaceClass(type: string | undefined): string {
  switch (type) {
    case "success":
      return "bg-[linear-gradient(105deg,#ECF9F2_0%,#F7FCF9_38%,#FFFFFF_72%)] border-[#DCE7E1]"
    case "info":
    case "loading":
      return "bg-[linear-gradient(105deg,#EEF4FF_0%,#F8FAFF_38%,#FFFFFF_72%)] border-[#DCE3EE]"
    case "warning":
      return "bg-[linear-gradient(105deg,#FFF8EB_0%,#FFFDF7_38%,#FFFFFF_72%)] border-[#EAE2D0]"
    case "error":
      return "bg-[linear-gradient(105deg,#FEF1F1_0%,#FFF8F8_38%,#FFFFFF_72%)] border-[#ECDCDC]"
    default:
      return "bg-white border-[#E4E1DC]"
  }
}

function Toast({
  className,
  toast: toastProp,
  ...props
}: ToastPrimitive.Root.Props) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      toast={toastProp}
      className={cn(
        "group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-[14px] border text-[#161514] shadow-[0_10px_28px_-8px_rgba(22,21,20,0.10),0_2px_8px_-2px_rgba(22,21,20,0.05)] will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        getToastSurfaceClass(toastProp.type),
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))] [--offset-y:calc(var(--toast-offset-y)*-1+calc(var(--toast-index)*var(--gap)*-1)+var(--toast-swipe-movement-y))] [--peek:0.75rem] [--scale:calc(max(0,1-(var(--toast-index)*0.1)))] [--shrink:calc(1-var(--scale))]",
        "h-(--height) transform-[translateX(var(--toast-swipe-movement-x))_translateY(calc(var(--toast-swipe-movement-y)-(var(--toast-index)*var(--peek))-(var(--shrink)*var(--height))))_scale(var(--scale))] [transition:transform_500ms_cubic-bezier(0.22,1,0.36,1),opacity_500ms,height_150ms]",
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height) data-expanded:transform-[translateX(var(--toast-swipe-movement-x))_translateY(var(--offset-y))]",
        "data-limited:opacity-0 data-starting-style:transform-[translateY(150%)]",
        "[&[data-ending-style]:not([data-limited]):not([data-swipe-direction])]:transform-[translateY(150%)]",
        "data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=down]:transform-[translateY(calc(var(--toast-swipe-movement-y)+150%))]",
        "data-expanded:data-ending-style:data-[swipe-direction=left]:transform-[translateX(calc(var(--toast-swipe-movement-x)-150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=right]:transform-[translateX(calc(var(--toast-swipe-movement-x)+150%))_translateY(var(--offset-y))]",
        "data-expanded:data-ending-style:data-[swipe-direction=up]:transform-[translateY(calc(var(--toast-swipe-movement-y)-150%))]",
        className
      )}
      {...props}
    />
  )
}

function ToastContent({ className, ...props }: ToastPrimitive.Content.Props) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex h-full gap-3 overflow-hidden px-4 py-3.5 transition-opacity duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] data-behind:opacity-0 data-expanded:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function ToastTitle({ className, ...props }: ToastPrimitive.Title.Props) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn(
        "text-sm leading-snug font-semibold tracking-[-0.01em] text-[#161514]",
        className
      )}
      {...props}
    />
  )
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.Description.Props) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("text-sm leading-relaxed text-[#544F4A]", className)}
      {...props}
    />
  )
}

function ToastAction({
  className,
  render = <Button variant="link" size="sm" />,
  ...props
}: ToastPrimitive.Action.Props) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn(
        "h-auto min-h-0 px-0 py-0 text-sm font-medium text-[#2F6FED] no-underline hover:text-[#1E56C5] hover:underline",
        className
      )}
      {...props}
    />
  )
}

function ToastClose({
  className,
  children,
  ...props
}: ToastPrimitive.Close.Props) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Tutup notifikasi"
      className={cn(
        "relative -mr-1 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[8px] text-[#766F68] transition-colors after:absolute after:-inset-2 after:content-[''] hover:bg-[#161514]/5 hover:text-[#161514] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className
      )}
      {...props}
    >
      {children ?? <XIcon className="size-4" aria-hidden="true" />}
    </ToastPrimitive.Close>
  )
}

function ToastIcon({
  type,
  className,
}: {
  type: string | undefined
  className?: string
}) {
  if (type === "success") {
    return (
      <span
        data-slot="toast-icon"
        aria-hidden="true"
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#249F6B] text-white",
          className
        )}
      >
        <CheckIcon className="size-3 stroke-[2.75]" />
      </span>
    )
  }

  if (type === "info") {
    return (
      <span
        data-slot="toast-icon"
        aria-hidden="true"
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#3B6AF5] text-xs font-bold text-white",
          className
        )}
      >
        i
      </span>
    )
  }

  if (type === "warning") {
    return (
      <span
        data-slot="toast-icon"
        aria-hidden="true"
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#D97706] text-white",
          className
        )}
      >
        <AlertTriangleIcon className="size-3 stroke-[2.5]" />
      </span>
    )
  }

  if (type === "error") {
    return (
      <span
        data-slot="toast-icon"
        aria-hidden="true"
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#DC4C46] text-white",
          className
        )}
      >
        <XIcon className="size-3 stroke-[2.75]" />
      </span>
    )
  }

  if (type === "loading") {
    return (
      <span
        data-slot="toast-icon"
        aria-hidden="true"
        className={cn(
          "inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-[#3B6AF5] text-white",
          className
        )}
      >
        <Loader2Icon className="size-3 animate-spin stroke-[2.5]" />
      </span>
    )
  }

  return null
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toastItem) => {
    const hasAction = Boolean(toastItem.actionProps)
    const isMultiline = Boolean(toastItem.description) || hasAction

    return (
      <Toast key={toastItem.id} toast={toastItem}>
        <ToastContent
          className={isMultiline ? "items-start py-4" : "items-center"}
        >
          <ToastIcon
            type={toastItem.type}
            className={isMultiline ? "mt-0.5" : undefined}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <ToastTitle />
            <ToastDescription />
            {hasAction ? (
              <div className="mt-1.5 flex items-center gap-4">
                <ToastAction />
                <ToastPrimitive.Close className="cursor-pointer text-sm font-medium text-[#766F68] transition-colors hover:text-[#161514]">
                  Tutup
                </ToastPrimitive.Close>
              </div>
            ) : null}
          </div>
          <ToastClose className={isMultiline ? "-mt-0.5" : undefined} />
        </ToastContent>
      </Toast>
    )
  })
}

function Toaster({
  children,
  toastManager = toast,
  ...props
}: ToastPrimitive.Provider.Props) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}

const createToastManager = ToastPrimitive.createToastManager
const useToastManager = ToastPrimitive.useToastManager

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
}
