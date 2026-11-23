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
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
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

function getSectionTitle(pathname: string): string {
  const activeItem = DASH_NAV_ITEMS.find((item) =>
    isNavItemActive(pathname, item)
  )
  return activeItem?.label ?? "Dashboard"
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
})

interface SidebarContentProps {
  staff: StaffProfile
  pathname: string
  publicSiteUrl: string
  isLoggingOut: boolean
  logoutError: string | null
  onLogout: () => void
  onNavigate?: () => void
  showDrawerClose?: boolean
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
}: SidebarContentProps) {
  const isAdmin = staff.role === "admin"
  const visibleItems = DASH_NAV_ITEMS.filter(
    (item) => !item.adminOnly || isAdmin
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[#2F2D2B] bg-[#161514] px-4 py-4 text-[#FAF9F7]">
        <Link
          to="/dash"
          onClick={onNavigate}
          className="inline-flex min-h-11 items-center gap-3 text-[#FAF9F7] no-underline transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF9F7]"
        >
          <img
            src="/images/brand/garasi-571-logo.png"
            alt="Garasi 571"
            width={150}
            height={150}
            className="size-9 shrink-0 object-contain"
          />
          <span className="flex flex-col leading-none">
            <span className="font-heading text-sm font-bold tracking-tight text-[#FAF9F7]">
              GARASI 571
            </span>
            <span className="mt-1 text-[10px] font-semibold tracking-[0.2em] text-[#C7C2BC] uppercase">
              Dashboard
            </span>
          </span>
        </Link>

        {showDrawerClose ? (
          <SheetClose
            aria-label="Tutup menu navigasi dashboard"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-none border border-[#2F2D2B] bg-[#1F1E1C] text-[#FAF9F7] transition-colors hover:border-[#544F4A] hover:bg-[#2A2826] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF9F7]"
          >
            <X className="size-5" aria-hidden="true" />
          </SheetClose>
        ) : null}
      </div>

      <div className="border-b border-border bg-secondary/50 px-4 py-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {staff.fullName || staff.email}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {staff.email}
            </p>
          </div>
          <Badge variant={isAdmin ? "primary" : "outline"} className="shrink-0">
            {getRoleLabel(staff.role)}
          </Badge>
        </div>
      </div>

      <nav
        aria-label="Navigasi Dashboard"
        className="flex-1 overflow-y-auto px-3 py-4"
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
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex min-h-11 items-center justify-between gap-2 border-l-2 px-3 py-2.5 text-sm no-underline transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    active
                      ? "border-primary bg-secondary font-semibold text-foreground"
                      : "border-transparent font-medium text-muted-foreground hover:border-border hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <span className="inline-flex min-w-0 items-center gap-2.5">
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-colors",
                        active
                          ? "text-primary"
                          : "text-muted-foreground group-hover:text-foreground"
                      )}
                      aria-hidden={true}
                    />
                    <span className="truncate">{item.label}</span>
                  </span>

                  {item.showAdminHintForSales && !isAdmin ? (
                    <Badge
                      variant="secondary"
                      className="px-1.5 py-0 text-[10px] tracking-wider text-muted-foreground"
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

      <div className="mt-auto space-y-2 border-t border-border bg-card p-3">
        {logoutError ? (
          <p
            role="alert"
            className="border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-xs text-[#991B1B]"
          >
            {logoutError}
          </p>
        ) : null}

        <a
          href={publicSiteUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "w-full justify-between text-xs no-underline"
          )}
        >
          <span>Lihat Website Publik</span>
          <ExternalLink className="size-3.5" aria-hidden="true" />
        </a>

        <Button
          type="button"
          variant="secondary"
          size="default"
          disabled={isLoggingOut}
          onClick={onLogout}
          className="w-full justify-between text-xs"
        >
          <span>{isLoggingOut ? "Mengakhiri Sesi..." : "Keluar"}</span>
          {isLoggingOut ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="size-3.5" aria-hidden="true" />
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

  const isAdmin = staff.role === "admin"
  const sectionTitle = getSectionTitle(pathname)

  return (
    <div className="flex min-h-svh w-full bg-background text-foreground">
      <aside className="hidden lg:sticky lg:top-0 lg:flex lg:h-svh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-border lg:bg-card">
        <SidebarContent
          staff={staff}
          pathname={pathname}
          publicSiteUrl={publicSiteUrl}
          isLoggingOut={isLoggingOut}
          logoutError={logoutError}
          onLogout={handleLogout}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-border bg-card px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger
                type="button"
                aria-label="Buka menu navigasi dashboard"
                className={cn(
                  buttonVariants({ variant: "outline", size: "icon" }),
                  "lg:hidden"
                )}
              >
                <Menu className="size-5" aria-hidden="true" />
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

            <Link
              to="/dash"
              className="inline-flex min-h-11 items-center gap-2.5 bg-[#161514] px-2.5 py-1.5 text-[#FAF9F7] no-underline lg:hidden"
            >
              <img
                src="/images/brand/garasi-571-logo.png"
                alt="Garasi 571"
                width={150}
                height={150}
                className="size-7 shrink-0 object-contain"
              />
              <span className="flex flex-col leading-none">
                <span className="font-heading text-xs font-bold tracking-tight text-[#FAF9F7]">
                  GARASI 571
                </span>
                <span className="mt-0.5 text-[9px] font-semibold tracking-[0.18em] text-[#C7C2BC] uppercase">
                  Dashboard
                </span>
              </span>
            </Link>

            <div className="hidden min-w-0 lg:block">
              <p className="truncate font-heading text-base font-bold tracking-tight text-foreground">
                {sectionTitle}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="max-w-48 truncate text-sm font-semibold text-foreground">
                {staff.fullName || staff.email}
              </p>
              <p className="max-w-48 truncate text-xs text-muted-foreground">
                {staff.email}
              </p>
            </div>
            <Badge variant={isAdmin ? "primary" : "outline"}>
              {getRoleLabel(staff.role)}
            </Badge>
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
