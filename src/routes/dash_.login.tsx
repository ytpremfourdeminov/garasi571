import * as React from "react"
import {
  createFileRoute,
  notFound,
  redirect,
  useRouter,
} from "@tanstack/react-router"
import {
  AlertCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getPublicSiteOrigin, isDashHostname } from "@/lib/host"
import { getCurrentStaffFn, loginWithPasswordFn } from "@/server/auth"

export const Route = createFileRoute("/dash_/login")({
  beforeLoad: async () => {
    if (
      typeof window !== "undefined" &&
      !isDashHostname(window.location.hostname)
    ) {
      throw notFound()
    }

    const staff = await getCurrentStaffFn()
    if (staff) {
      throw redirect({ href: "/" })
    }
  },
  head: () => ({
    meta: [
      {
        title: "Masuk Staf | Garasi 571 Surakarta",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
      {
        name: "description",
        content: "Portal masuk internal staf Garasi 571 Surakarta.",
      },
    ],
  }),
  component: DashLoginPage,
})

function DashLoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [publicSiteUrl, setPublicSiteUrl] = React.useState(() =>
    getPublicSiteOrigin()
  )

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setPublicSiteUrl(getPublicSiteOrigin(window.location.href))
    }
  }, [])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setErrorMessage("Email staf wajib diisi.")
      return
    }
    if (!password) {
      setErrorMessage("Kata sandi wajib diisi.")
      return
    }

    setErrorMessage(null)
    setIsSubmitting(true)

    try {
      const result = await loginWithPasswordFn({
        data: {
          email: trimmedEmail,
          password,
        },
      })

      if (!result.ok) {
        setErrorMessage(result.error)
        return
      }

      await router.invalidate()
      await router.navigate({
        href: "/",
        replace: true,
      })
    } catch {
      setErrorMessage(
        "Tidak dapat terhubung ke layanan autentikasi. Coba beberapa saat lagi."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col justify-between bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-5xl flex-1 items-center px-4 py-10 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid w-full border border-border bg-card lg:grid-cols-12">
          <aside className="flex flex-col justify-between bg-[#161514] p-7 text-[#FAF9F7] sm:p-10 lg:col-span-5">
            <div>
              <div className="inline-flex items-center gap-3 border border-[#2F2D2B] bg-[#1F1E1C] px-3 py-2">
                <img
                  src="/images/brand/garasi-571-logo.png"
                  alt="Garasi 571"
                  width={150}
                  height={150}
                  className="size-9 shrink-0 object-contain"
                />
                <div className="leading-none">
                  <p className="font-heading text-sm font-bold tracking-tight text-[#FAF9F7]">
                    GARASI 571
                  </p>
                  <p className="mt-1 text-[10px] font-medium tracking-[0.18em] text-[#C7C2BC] uppercase">
                    Surakarta
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-[#2F2D2B] pt-6">
                <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
                  Portal Operasional Internal
                </p>
                <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight text-[#FAF9F7] sm:text-3xl">
                  Kelola Stok &amp; Katalog Showroom
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-[#C7C2BC]">
                  Ruang kerja khusus tim Garasi 571 untuk memperbarui unit
                  kendaraan, galeri foto, informasi showroom, dan FAQ pelanggan.
                </p>
              </div>
            </div>

            <div className="mt-8 border-t border-[#2F2D2B] pt-5">
              <div className="flex items-start gap-2.5 text-xs leading-relaxed text-[#C7C2BC]">
                <ShieldCheck
                  className="mt-0.5 size-4 shrink-0 text-primary"
                  aria-hidden="true"
                />
                <span>
                  Akses terbatas untuk akun staf terdaftar. Tidak tersedia
                  pendaftaran mandiri pada portal ini.
                </span>
              </div>
            </div>
          </aside>

          <section
            aria-labelledby="dash-login-heading"
            className="flex flex-col justify-center p-7 sm:p-10 lg:col-span-7"
          >
            <div className="mx-auto w-full max-w-md">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                <LockKeyhole
                  className="size-3.5 text-primary"
                  aria-hidden="true"
                />
                <span>Autentikasi Staf</span>
              </div>

              <h2
                id="dash-login-heading"
                className="mt-2 font-heading text-2xl font-bold tracking-tight text-foreground"
              >
                Masuk ke Dashboard
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Masukkan email dan kata sandi akun staf Garasi 571 Anda.
              </p>

              {errorMessage ? (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="mt-6 flex items-start gap-2.5 border border-l-2 border-primary/30 border-l-primary bg-primary/5 px-3.5 py-3 text-sm text-foreground"
                >
                  <AlertCircle
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-6 space-y-5"
              >
                <div className="space-y-1.5">
                  <label
                    htmlFor="staff-email"
                    className="block text-xs font-semibold tracking-wider text-foreground uppercase"
                  >
                    Email Staf
                  </label>
                  <input
                    id="staff-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    required
                    disabled={isSubmitting}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@garasi571.id"
                    aria-invalid={errorMessage ? true : undefined}
                    className="min-h-11 w-full rounded-none border border-input bg-card px-3.5 py-2.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:bg-secondary disabled:opacity-60"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="staff-password"
                    className="block text-xs font-semibold tracking-wider text-foreground uppercase"
                  >
                    Kata Sandi
                  </label>
                  <div className="relative">
                    <input
                      id="staff-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      disabled={isSubmitting}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      aria-invalid={errorMessage ? true : undefined}
                      className="min-h-11 w-full rounded-none border border-input bg-card py-2.5 pr-12 pl-3.5 text-sm text-foreground transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:bg-secondary disabled:opacity-60"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      disabled={isSubmitting}
                      aria-label={
                        showPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                      aria-pressed={showPassword}
                      className="absolute inset-y-0 right-0 inline-flex min-h-11 min-w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      <span>Memverifikasi Akun...</span>
                    </>
                  ) : (
                    <span>Masuk ke Dashboard</span>
                  )}
                </Button>
              </form>

              <div className="mt-7 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  Lupa akses? Hubungi Admin Garasi 571.
                </p>

                <a
                  href={publicSiteUrl}
                  className="inline-flex min-h-11 items-center gap-1.5 text-xs font-semibold text-foreground no-underline transition-colors hover:text-primary"
                >
                  <ArrowLeft className="size-3.5" aria-hidden="true" />
                  <span>Website Publik</span>
                </a>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
