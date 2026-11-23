import * as React from "react"
import { createFileRoute, redirect, useRouter } from "@tanstack/react-router"
import {
  AlertCircle,
  CheckCircle2,
  Info,
  Loader2,
  Shield,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { StaffProfile, StaffRole } from "@/lib/domain/types"
import { listTeamProfilesFn, updateStaffProfileFn } from "@/server/dash-team"

const STAFF_ROLE_ITEMS: Array<{ value: StaffRole; label: string }> = [
  { value: "admin", label: "Admin" },
  { value: "sales", label: "Sales" },
]

interface FeedbackMessage {
  type: "success" | "error"
  text: string
}

type RowSaveState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string }

function formatJoinDate(isoDate: string): string {
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) {
    return "-"
  }
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parsed)
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message
  }
  return fallback
}

export const Route = createFileRoute("/dash/team")({
  beforeLoad: ({ context }) => {
    if (context.staff.role !== "admin") {
      throw redirect({ to: "/dash" })
    }
  },
  loader: async () => {
    return await listTeamProfilesFn()
  },
  head: () => ({
    meta: [
      {
        title: "Tim & Role | Garasi 571",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: DashTeamPage,
})

function DashTeamPage() {
  const { staff: currentStaff } = Route.useRouteContext()
  const initialProfiles = Route.useLoaderData()
  const router = useRouter()

  const [profiles, setProfiles] = React.useState<StaffProfile[]>(
    () => initialProfiles
  )
  const [rowStates, setRowStates] = React.useState<
    Record<string, RowSaveState>
  >({})
  const [feedback, setFeedback] = React.useState<FeedbackMessage | null>(null)
  const savedTimersRef = React.useRef<Record<string, number>>({})

  React.useEffect(() => {
    setProfiles(initialProfiles)
  }, [initialProfiles])

  React.useEffect(() => {
    const timers = savedTimersRef.current
    return () => {
      for (const timerId of Object.values(timers)) {
        window.clearTimeout(timerId)
      }
    }
  }, [])

  const activeCount = profiles.filter((profile) => profile.isActive).length
  const activeAdminCount = profiles.filter(
    (profile) => profile.role === "admin" && profile.isActive
  ).length
  const inactiveCount = profiles.length - activeCount

  const handleUpdateProfile = async (
    profile: StaffProfile,
    updates: { role: StaffRole; isActive: boolean }
  ) => {
    if (
      updates.role === profile.role &&
      updates.isActive === profile.isActive
    ) {
      return
    }

    const existingTimer = savedTimersRef.current[profile.id]
    if (existingTimer) {
      window.clearTimeout(existingTimer)
      delete savedTimersRef.current[profile.id]
    }

    setFeedback(null)
    setRowStates((prev) => ({
      ...prev,
      [profile.id]: { status: "saving" },
    }))

    try {
      const updated = await updateStaffProfileFn({
        data: {
          id: profile.id,
          role: updates.role,
          isActive: updates.isActive,
        },
      })

      setProfiles((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      )
      setRowStates((prev) => ({
        ...prev,
        [profile.id]: { status: "saved" },
      }))

      const displayName = updated.fullName || updated.email
      const roleLabel = updated.role === "admin" ? "Admin" : "Sales"
      const statusLabel = updated.isActive ? "Aktif" : "Nonaktif"

      setFeedback({
        type: "success",
        text: `Perubahan untuk ${displayName} tersimpan (${roleLabel} · ${statusLabel}).`,
      })

      savedTimersRef.current[profile.id] = window.setTimeout(() => {
        setRowStates((prev) => ({
          ...prev,
          [profile.id]: { status: "idle" },
        }))
        delete savedTimersRef.current[profile.id]
      }, 3500)

      await router.invalidate()
    } catch (err) {
      const message = extractErrorMessage(
        err,
        "Gagal memperbarui peran atau status staf."
      )
      setRowStates((prev) => ({
        ...prev,
        [profile.id]: { status: "error", message },
      }))
      setFeedback({
        type: "error",
        text: message,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Tim &amp; Hak Akses Staf
        </h1>

        <Badge variant="primary" className="self-start sm:self-auto">
          <ShieldCheck className="size-3" aria-hidden="true" />
          <span>Khusus Admin</span>
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="border border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Total Akun
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground tabular-nums">
            {profiles.length}
          </p>
        </div>
        <div className="border border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Staf Aktif
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-emerald-800 tabular-nums">
            {activeCount}
          </p>
        </div>
        <div className="border border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Admin Aktif
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-primary tabular-nums">
            {activeAdminCount}
          </p>
        </div>
        <div className="border border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Menunggu / Nonaktif
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-muted-foreground tabular-nums">
            {inactiveCount}
          </p>
        </div>
      </div>

      <section
        aria-labelledby="onboarding-guide-heading"
        className="border border-l-2 border-border border-l-foreground bg-card p-5"
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center border border-border bg-secondary text-foreground">
            <UserPlus className="size-4" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2
              id="onboarding-guide-heading"
              className="font-heading text-sm font-bold tracking-tight text-foreground"
            >
              Cara Menambahkan Anggota Tim Baru
            </h2>
            <ol className="grid gap-2 pt-1 text-sm text-foreground sm:grid-cols-3">
              <li className="border border-border bg-secondary/40 px-3 py-2.5">
                <span className="font-mono text-sm font-bold text-primary">
                  01. BUAT AKUN
                </span>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Tambahkan pengguna baru (email &amp; kata sandi) di{" "}
                  <strong className="font-semibold text-foreground">
                    panel autentikasi
                  </strong>
                  .
                </p>
              </li>
              <li className="border border-border bg-secondary/40 px-3 py-2.5">
                <span className="font-mono text-sm font-bold text-primary">
                  02. MUNCUL DI TABEL
                </span>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Akun masuk ke tabel ini sebagai{" "}
                  <strong className="font-semibold text-foreground">
                    Sales (Nonaktif)
                  </strong>{" "}
                  hingga disetujui.
                </p>
              </li>
              <li className="border border-border bg-secondary/40 px-3 py-2.5">
                <span className="font-mono text-sm font-bold text-primary">
                  03. AKTIVASI
                </span>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  Aktifkan status dan pilih peran{" "}
                  <strong className="font-semibold text-foreground">
                    Admin
                  </strong>{" "}
                  atau{" "}
                  <strong className="font-semibold text-foreground">
                    Sales
                  </strong>{" "}
                  di tabel bawah.
                </p>
              </li>
            </ol>
          </div>
        </div>
      </section>

      <div
        role="note"
        className="flex items-start gap-2.5 border border-l-2 border-amber-700/35 border-l-amber-700 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"
      >
        <Shield
          className="mt-0.5 size-4 shrink-0 text-amber-800"
          aria-hidden="true"
        />
        <p>
          Minimal harus ada{" "}
          <strong className="font-semibold">1 Admin aktif</strong>. Admin
          terakhir tidak bisa dinonaktifkan atau diubah ke Sales.
        </p>
      </div>

      {feedback ? (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live="polite"
          className={
            feedback.type === "success"
              ? "flex items-start gap-2.5 border border-l-2 border-emerald-700/30 border-l-emerald-700 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
              : "flex items-start gap-2.5 border border-l-2 border-destructive/30 border-l-destructive bg-destructive/10 px-4 py-3 text-sm text-[#991B1B]"
          }
        >
          {feedback.type === "success" ? (
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0 text-emerald-700"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
          )}
          <span>{feedback.text}</span>
        </div>
      ) : null}

      <section
        aria-labelledby="team-table-heading"
        className="border border-border bg-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-secondary/40 px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-primary" aria-hidden="true" />
            <h2
              id="team-table-heading"
              className="font-heading text-base font-bold tracking-tight text-foreground"
            >
              Daftar Akun Staf ({profiles.length})
            </h2>
          </div>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <Info className="size-3.5" aria-hidden="true" />
            <span>Perubahan tersimpan otomatis.</span>
          </p>
        </div>

        {profiles.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Users
              className="mx-auto size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 font-heading text-base font-semibold text-foreground">
              Belum Ada Profil Staf
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Tambahkan pengguna melalui panel autentikasi agar muncul di sini.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staf</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Status Akses</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Keterangan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => {
                const isSelf = profile.id === currentStaff.id
                const isLastActiveAdmin =
                  profile.role === "admin" &&
                  profile.isActive &&
                  activeAdminCount <= 1
                const rowState = rowStates[profile.id] ?? { status: "idle" }
                const isSavingRow = rowState.status === "saving"
                const disableControls = isSavingRow || isLastActiveAdmin

                return (
                  <TableRow key={profile.id}>
                    <TableCell>
                      <div className="min-w-44">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {profile.fullName || "Tanpa Nama"}
                          </span>
                          {isSelf ? (
                            <Badge variant="outline" className="text-sm">
                              Anda
                            </Badge>
                          ) : null}
                        </div>
                        <p className="mt-0.5 text-sm text-muted-foreground">
                          {profile.email}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="min-w-32">
                        <Select
                          items={STAFF_ROLE_ITEMS}
                          value={profile.role}
                          disabled={disableControls}
                          onValueChange={(value) => {
                            if (value === "admin" || value === "sales") {
                              void handleUpdateProfile(profile, {
                                role: value,
                                isActive: profile.isActive,
                              })
                            }
                          }}
                        >
                          <SelectTrigger
                            aria-label={`Peran untuk ${profile.fullName || profile.email}`}
                            className="min-h-10 w-32 bg-card px-3 text-sm font-medium text-foreground data-[size=default]:h-10"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="sales">Sales</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Switch
                          checked={profile.isActive}
                          disabled={disableControls}
                          onCheckedChange={(checked) => {
                            void handleUpdateProfile(profile, {
                              role: profile.role,
                              isActive: checked,
                            })
                          }}
                          aria-label={`Status aktif untuk ${profile.fullName || profile.email}`}
                        />
                        <Badge
                          variant={profile.isActive ? "success" : "secondary"}
                        >
                          {profile.isActive ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </div>
                    </TableCell>

                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground tabular-nums">
                      {formatJoinDate(profile.createdAt)}
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="inline-flex min-w-36 items-center justify-end gap-1.5 text-sm">
                        {rowState.status === "saving" ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-muted-foreground">
                            <Loader2
                              className="size-3.5 animate-spin"
                              aria-hidden="true"
                            />
                            <span>Menyimpan...</span>
                          </span>
                        ) : rowState.status === "saved" ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-emerald-800">
                            <CheckCircle2
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            <span>Tersimpan</span>
                          </span>
                        ) : rowState.status === "error" ? (
                          <span className="inline-flex items-center gap-1.5 font-medium text-destructive">
                            <AlertCircle
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            <span>Gagal</span>
                          </span>
                        ) : isLastActiveAdmin ? (
                          <Badge variant="amber" className="text-sm">
                            <Shield className="size-3" aria-hidden="true" />
                            <span>Admin Terakhir</span>
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            {profile.role === "admin"
                              ? "Akses penuh"
                              : "Stok & FAQ"}
                          </span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
