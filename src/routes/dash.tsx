import * as React from "react"
import {
  Link,
  Outlet,
  createFileRoute,
  notFound,
  redirect,
  useRouter,
  useRouterState,
} from "@tanstack/react-router"
import {
  Car,
  ChevronRight,
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  LogOut,
  PanelLeft,
  Shield,
  Store,
  Users,
  X,
} from "lucide-react"
import { cn } from "cn"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { TruncatedTooltip } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"
import type { StaffProfile } from "@/lib/domain/types"
import { getPublicSiteOrigin, isDashHostname } from "@/lib/host"
import {
  checkDashHostFn,
  getCurrentStaffFn,
  logoutFn,
} from "@/server/auth"

type DashNavPath =
  | "/dash"
  | "/dash/cars"
  | "/dash/showroom"
  | "/dash/faqs"
  | "/dash/team"

interface DashNavItem {
  label: string
  to: DashNavPath
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>
  exact?: boolean
  adminOnly?: boolean
  showAdminHintForSales?: boolean
}

const DASH_NAV_ITEMS: ReadonlyArray<DashNavItem> = [
  {
    label: "Ringkasan",
    to: "/dash",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    label: "Inventaris Mobil",
    to: "/dash/cars",
    icon: Car,
  },
  {
    label: "Showroom & Sales",
    to: "/dash/showroom",
    icon: Store,
    showAdminHintForSales: true,
  },
  {
    label: "FAQ",
    to: "/dash/faqs",
    icon: HelpCircle,
  },
  {
    label: "Tim & Role",
    to: "/dash/team",
    icon: Users,
    adminOnly: true,
  },
]

function isNavItemActive(pathname: string, item: DashNavItem): boolean {
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  const target = item.to
  const stripped = target === "/dash" ? "/" : target.slice("/dash".length)

  if (item.exact) {
    return normalized === target || normalized === stripped
  }

  return (
    normalized === target ||
    normalized.startsWith(`${target}/`) ||
    normalized === stripped ||
    normalized.startsWith(`${stripped}/`)
  )
}

interface BreadcrumbItem {
  label: string
  to?: DashNavPath
}

function getBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const normalized =
    pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
  const subPath = normalized.startsWith("/dash")
    ? normalized.slice("/dash".length) || "/"
    : normalized || "/"

  if (subPath === "/") {
    return [{ label: "Dashboard", to: "/dash" }, { label: "Ringkasan" }]
  }

  if (subPath === "/cars") {
    return [{ label: "Dashboard", to: "/dash" }, { label: "Inventaris Mobil" }]
  }

  if (subPath === "/cars/new") {
    return [
      { label: "Dashboard", to: "/dash" },
      { label: "Inventaris Mobil", to: "/dash/cars" },
      { label: "Tambah Unit" },
    ]
  }

  if (subPath.startsWith("/cars/")) {
    return [
      { label: "Dashboard", to: "/dash" },
      { label: "Inventaris Mobil", to: "/dash/cars" },
      { label: "Edit Unit" },
    ]
  }

  const activeItem = DASH_NAV_ITEMS.find((item) =>
    isNavItemActive(pathname, item)
  )
  return [
    { label: "Dashboard", to: "/dash" },
    { label: activeItem?.label ?? "Dashboard" },
  ]
}

function getStaffInitials(staff: StaffProfile): string {
  const source = (staff.fullName || staff.email || "ST").trim()
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

function getRoleLabel(role: StaffProfile["role"]): string {
  return role === "admin" ? "Admin" : "Sales"
}

export const Route = createFileRoute("/dash")({
  beforeLoad: async () => {
    if (
      typeof window !== "undefined" &&
      !isDashHostname(window.location.hostname)
    ) {
      throw notFound()
    }

    await checkDashHostFn()

    const staff = await getCurrentStaffFn()
    if (!staff) {
      throw redirect({ to: "/dash/login" })
    }

    return { staff }
  },
  head: () => ({
    meta: [
      {
        title: "Dashboard | Garasi 571",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: DashLayout,
  pendingComponent: DashLayoutPending,
})

function DashLayoutPending() {
  return (
    <div
      aria-busy="true"
      aria-label="Memuat dashboard"
      className="flex min-h-svh w-full bg-background text-foreground"
    >
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-card">
        <div className="flex h-[72px] shrink-0 items-center border-b border-[#2F2D2B] bg-[#161514] px-4">
          <Skeleton className="h-9 w-36 bg-[#242220]" />
        </div>
        <div className="space-y-2 border-b border-border bg-secondary/50 px-4 py-3.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-44" />
        </div>
        <div className="space-y-2 px-3 py-4">
          {[0, 1, 2, 3, 4].map((idx) => (
            <Skeleton key={idx} className="h-11 w-full" />
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center gap-3 border-b border-border bg-card px-4 sm:px-6 lg:px-8">
          <Skeleton className="size-9" />
          <span aria-hidden="true" className="h-4 w-px shrink-0 bg-border" />
          <Skeleton className="h-5 w-44" />
        </header>

        <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-5 w-80 max-w-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((idx) => (
              <Skeleton key={idx} className="h-36 w-full border border-border" />
            ))}
          </div>
          <Skeleton className="h-72 w-full border border-border" />
        </div>
      </div>
    </div>
  )
}

interface SidebarContentProps {
  staff: StaffProfile
  pathname: string
  publicSiteUrl: string
  isLoggingOut: boolean
  logoutError: string | null
  onLogout: () => void
  onNavigate?: () => void
  showDrawerClose?: boolean
  collapsed?: boolean
}

function SidebarContent({
  staff,
  pathname,
  publicSiteUrl,
  isLoggingOut,
  logoutError,
  onLogout,
  onNavigate,
  showDrawerClose = false,
  collapsed = false,
}: SidebarContentProps) {
  const isAdmin = staff.role === "admin"
  const visibleItems = DASH_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  )
  const displayName = staff.fullName || staff.email
  const initials = getStaffInitials(staff)

  return (
    <div className="flex h-full flex-col">
      <div
        className={cn(
          "flex h-[72px] shrink-0 items-center border-b border-[#2F2D2B] bg-[#161514] text-[#FAF9F7]",
          collapsed ? "justify-center px-2" : "justify-between gap-2 px-4"
        )}
      >
        <Link
          to="/dash"
          onClick={onNavigate}
          title={collapsed ? "Garasi 571 Dashboard" : undefined}
          aria-label={collapsed ? "Garasi 571 Dashboard" : undefined}
          className={cn(
            "inline-flex min-h-11 items-center text-[#FAF9F7] no-underline transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF9F7]",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <img
            src="/images/brand/garasi-571-logo.png"
            alt="Garasi 571"
            width={150}
            height={150}
            className="size-9 shrink-0 object-contain"
          />
          {!collapsed ? (
            <span className="flex flex-col leading-none">
              <span className="font-heading text-sm font-bold tracking-tight text-[#FAF9F7]">
                GARASI 571
              </span>
              <span className="mt-1 text-sm font-semibold tracking-[0.2em] text-[#C7C2BC] uppercase">
                Dashboard
              </span>
            </span>
          ) : null}
        </Link>

        {showDrawerClose && !collapsed ? (
          <SheetClose
            aria-label="Tutup menu navigasi dashboard"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-none border border-[#2F2D2B] bg-[#1F1E1C] text-[#FAF9F7] transition-colors hover:border-[#544F4A] hover:bg-[#2A2826] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF9F7]"
          >
            <X className="size-5" aria-hidden="true" />
          </SheetClose>
        ) : null}
      </div>

      <div className="border-b border-border bg-secondary/50">
        {collapsed ? (
          <div
            title={`${displayName} (${getRoleLabel(staff.role)})`}
            className="flex flex-col items-center"
          >
            <div className="py-2.5">
              <div className="flex size-9 items-center justify-center border border-border bg-card font-heading text-sm font-bold text-foreground">
                {initials}
              </div>
            </div>
            <Badge
              variant={isAdmin ? "primary" : "outline"}
              className="w-full justify-center rounded-none border-x-0 border-b-0 px-0 py-0.5 tracking-normal"
            >
              {getRoleLabel(staff.role)}
            </Badge>
          </div>
        ) : (
          <div>
            <div className="min-w-0 px-4 py-3">
              <TruncatedTooltip
                content={displayName}
                render={
                  <p className="truncate text-sm font-semibold text-foreground" />
                }
              >
                {displayName}
              </TruncatedTooltip>
              <TruncatedTooltip
                content={staff.email}
                render={
                  <p className="mt-0.5 truncate text-sm text-muted-foreground" />
                }
              >
                {staff.email}
              </TruncatedTooltip>
            </div>
            <Badge
              variant={isAdmin ? "primary" : "outline"}
              className="w-full justify-center rounded-none border-x-0 border-b-0 py-1"
            >
              {getRoleLabel(staff.role)}
            </Badge>
          </div>
        )}
      </div>

      <nav
        aria-label="Navigasi Dashboard"
        className={cn(
          "flex-1 overflow-y-auto py-4",
          collapsed ? "px-2" : "px-3"
        )}
      >
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const active = isNavItemActive(pathname, item)

            return (
              <li key={item.to}>
                <Link
                  to={item.to}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  aria-label={collapsed ? item.label : undefined}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-11 items-center border-l-2 py-2.5 text-sm no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    collapsed ? "justify-center px-0" : "justify-between gap-2 px-3",
                    active
                      ? "border-primary bg-secondary font-semibold text-foreground"
                      : "border-transparent font-medium text-muted-foreground hover:border-border hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex min-w-0 items-center",
                      collapsed ? "justify-center" : "gap-2.5"
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                      aria-hidden={true}
                    />
                    {!collapsed ? (
                      <TruncatedTooltip
                        content={item.label}
                        render={<span className="truncate" />}
                      >
                        {item.label}
                      </TruncatedTooltip>
                    ) : null}
                  </span>

                  {!collapsed && item.showAdminHintForSales && !isAdmin ? (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-sm tracking-wider text-muted-foreground"
                    >
                      <Shield className="size-2.5" aria-hidden="true" />
                      <span>Admin</span>
                    </Badge>
                  ) : null}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div
        className={cn(
          "mt-auto space-y-2 border-t border-border bg-card",
          collapsed ? "p-2" : "p-3"
        )}
      >
        {!collapsed && logoutError ? (
          <p
            role="alert"
            className="border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-sm text-[#991B1B]"
          >
            {logoutError}
          </p>
        ) : null}

        <a
          href={publicSiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={collapsed ? "Lihat Website Publik" : undefined}
          aria-label={collapsed ? "Lihat Website Publik" : undefined}
          className={cn(
            buttonVariants({
              variant: "outline",
              size: collapsed ? "icon" : "default",
            }),
            collapsed ? "w-full justify-center" : "w-full justify-between text-sm",
            "no-underline"
          )}
        >
          {!collapsed ? <span>Lihat Website Publik</span> : null}
          <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
        </a>

        <Button
          type="button"
          variant="secondary"
          size={collapsed ? "icon" : "default"}
          disabled={isLoggingOut}
          onClick={onLogout}
          title={collapsed ? "Keluar" : undefined}
          aria-label={collapsed ? "Keluar" : undefined}
          className={cn(
            collapsed ? "w-full justify-center" : "w-full justify-between text-sm"
          )}
        >
          {!collapsed ? (
            <span>{isLoggingOut ? "Mengakhiri Sesi..." : "Keluar"}</span>
          ) : null}
          {isLoggingOut ? (
            <Loader2 className="size-3.5 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="size-3.5 shrink-0" aria-hidden="true" />
          )}
        </Button>
      </div>
    </div>
  )
}

function DashLayout() {
  const { staff } = Route.useRouteContext()
  const router = useRouter()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  const [mobileNavOpen, setMobileNavOpen] = React.useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false)
  const [isLoggingOut, setIsLoggingOut] = React.useState(false)
  const [logoutError, setLogoutError] = React.useState<string | null>(null)
  const [publicSiteUrl, setPublicSiteUrl] = React.useState(() =>
    getPublicSiteOrigin()
  )

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setPublicSiteUrl(getPublicSiteOrigin(window.location.href))
    }
  }, [])

  const handleLogout = async () => {
    setLogoutError(null)
    setIsLoggingOut(true)

    try {
      await logoutFn()
      setMobileNavOpen(false)
      await router.invalidate()
      await router.navigate({
        to: "/dash/login",
        replace: true,
      })
    } catch {
      setLogoutError("Gagal keluar dari sesi. Silakan coba lagi.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <div className="flex min-h-svh w-full bg-background text-foreground">
      <aside
        className={cn(
          "hidden lg:sticky lg:top-0 lg:flex lg:h-svh lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-card lg:transition-[width] lg:duration-200 lg:ease-linear",
          sidebarCollapsed ? "lg:w-[4.25rem]" : "lg:w-64"
        )}
      >
        <SidebarContent
          staff={staff}
          pathname={pathname}
          publicSiteUrl={publicSiteUrl}
          isLoggingOut={isLoggingOut}
          logoutError={logoutError}
          onLogout={handleLogout}
          collapsed={sidebarCollapsed}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger
                type="button"
                aria-label="Buka menu navigasi dashboard"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "shrink-0 lg:hidden"
                )}
              >
                <PanelLeft className="size-4" aria-hidden="true" />
              </SheetTrigger>

              <SheetContent
                side="left"
                showCloseButton={false}
                className="w-[min(100vw,18.5rem)] p-0"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Dashboard Garasi 571</SheetTitle>
                  <SheetDescription>
                    Menu navigasi dashboard staf Garasi 571.
                  </SheetDescription>
                </SheetHeader>

                <SidebarContent
                  staff={staff}
                  pathname={pathname}
                  publicSiteUrl={publicSiteUrl}
                  isLoggingOut={isLoggingOut}
                  logoutError={logoutError}
                  onLogout={handleLogout}
                  onNavigate={() => setMobileNavOpen(false)}
                  showDrawerClose={true}
                />
              </SheetContent>
            </Sheet>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              aria-label={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
              aria-expanded={!sidebarCollapsed}
              title={sidebarCollapsed ? "Buka sidebar" : "Tutup sidebar"}
              className="hidden shrink-0 lg:inline-flex"
            >
              <PanelLeft className="size-4" aria-hidden="true" />
            </Button>

            <span
              aria-hidden="true"
              className="h-4 w-px shrink-0 bg-border"
            />

            <nav aria-label="Breadcrumb" className="min-w-0">
              <ol className="flex items-center gap-1.5 text-sm">
                {breadcrumbs.map((crumb, index) => {
                  const isLast = index === breadcrumbs.length - 1
                  return (
                    <li
                      key={`${crumb.label}-${index}`}
                      className="flex min-w-0 items-center gap-1.5"
                    >
                      {index > 0 ? (
                        <ChevronRight
                          className="size-3.5 shrink-0 text-muted-foreground"
                          aria-hidden="true"
                        />
                      ) : null}
                      {crumb.to && !isLast ? (
                        <TruncatedTooltip
                          content={crumb.label}
                          render={
                            <Link
                              to={crumb.to}
                              className="truncate text-muted-foreground no-underline transition-colors hover:text-foreground"
                            />
                          }
                        >
                          {crumb.label}
                        </TruncatedTooltip>
                      ) : (
                        <TruncatedTooltip
                          content={crumb.label}
                          render={
                            <span
                              aria-current={isLast ? "page" : undefined}
                              className="truncate font-semibold text-foreground"
                            />
                          }
                        >
                          {crumb.label}
                        </TruncatedTooltip>
                      )}
                    </li>
                  )
                })}
              </ol>
            </nav>
          </div>
        </header>

        <div className="flex-1 bg-background">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
