import * as React from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import {
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  ShieldAlert,
  Store,
  Trash2,
  Upload,
  Users,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  useStableDialogData,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { buildWhatsAppUrl, slugifyText } from "@/lib/domain/formatters"
import {
  salesContactUpsertSchema,
  showroomUpdateSchema,
} from "@/lib/domain/schemas"
import type { SalesContact, ShowroomConfig } from "@/lib/domain/types"
import {
  deleteSalesContactFn,
  getDashShowroomFn,
  reorderSalesContactsFn,
  updateShowroomSettingsFn,
  upsertSalesContactFn,
} from "@/server/dash-showroom"

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_LOGO_TYPES = new Set(["image/webp", "image/jpeg", "image/png"])

interface ShowroomFormState {
  name: string
  city: string
  address: string
  hours: string
  mapsUrl: string
  mapsEmbedUrl: string
  instagramHandle: string
  instagramUrl: string
  logoUrl: string
}

interface SalesFormState {
  id?: string
  name: string
  slug: string
  role: string
  phoneDisplay: string
  phoneE164: string
  isActive: boolean
  sortOrder: number
}

function toShowroomFormState(config: ShowroomConfig): ShowroomFormState {
  return {
    name: config.name,
    city: config.city,
    address: config.address,
    hours: config.hours,
    mapsUrl: config.mapsUrl,
    mapsEmbedUrl: config.mapsEmbedUrl,
    instagramHandle: config.instagramHandle,
    instagramUrl: config.instagramUrl,
    logoUrl: config.logoUrl || config.logoSrc,
  }
}

function getSafeHttpUrl(rawUrl: string): string | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return null
  }
  try {
    const parsed = new URL(trimmed)
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString()
    }
    return null
  } catch {
    return null
  }
}

function normalizePhoneToE164(phoneDisplay: string): string {
  const digits = phoneDisplay.replace(/\D/g, "")
  if (!digits) {
    return ""
  }
  if (digits.startsWith("62")) {
    return digits
  }
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`
  }
  if (digits.startsWith("8")) {
    return `62${digits}`
  }
  return digits
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message
  }
  return fallback
}

export const Route = createFileRoute("/dash/showroom")({
  loader: async () => {
    return await getDashShowroomFn()
  },
  head: () => ({
    meta: [
      {
        title: "Showroom & Sales | Garasi 571",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: DashShowroomPage,
  pendingComponent: DashShowroomPending,
})

function DashShowroomPending() {
  return (
    <div aria-busy="true" aria-label="Memuat pengaturan showroom" className="space-y-8">
      <div className="border-b border-border pb-5">
        <Skeleton className="h-9 w-72 max-w-full" />
      </div>

      <section className="border border-border bg-card">
        <div className="border-b border-border bg-secondary/40 px-5 py-4 sm:px-6">
          <Skeleton className="h-6 w-44" />
        </div>
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="space-y-4 lg:col-span-5">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-56 w-full" />
          </div>
        </div>
      </section>

      <section className="border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border bg-secondary/40 px-5 py-4 sm:px-6">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="space-y-3 p-5 sm:p-6">
          {[0, 1].map((idx) => (
            <Skeleton key={idx} className="h-24 w-full" />
          ))}
        </div>
      </section>
    </div>
  )
}

function DashShowroomPage() {
  const { staff } = Route.useRouteContext()
  const initialShowroom = Route.useLoaderData()
  const router = useRouter()

  const isAdmin = staff.role === "admin"

  const [form, setForm] = React.useState<ShowroomFormState>(() =>
    toShowroomFormState(initialShowroom)
  )
  const [sales, setSales] = React.useState<SalesContact[]>(
    () => initialShowroom.sales
  )

  const [formErrors, setFormErrors] = React.useState<
    Partial<Record<keyof ShowroomFormState, string>>
  >({})
  const [isSavingProfile, setIsSavingProfile] = React.useState(false)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const [isUploadingLogo, setIsUploadingLogo] = React.useState(false)
  const [isLogoPreviewOpen, setIsLogoPreviewOpen] = React.useState(false)

  const [busySalesId, setBusySalesId] = React.useState<string | null>(null)
  const [isReorderingSales, setIsReorderingSales] = React.useState(false)

  const [salesDialogOpen, setSalesDialogOpen] = React.useState(false)
  const [salesForm, setSalesForm] = React.useState<SalesFormState>({
    name: "",
    slug: "",
    role: "Sales Consultant",
    phoneDisplay: "",
    phoneE164: "",
    isActive: true,
    sortOrder: 0,
  })
  const [salesE164Edited, setSalesE164Edited] = React.useState(false)
  const [salesFormErrors, setSalesFormErrors] = React.useState<
    Partial<Record<keyof SalesFormState, string>>
  >({})
  const [isSavingSales, setIsSavingSales] = React.useState(false)

  const [deleteTarget, setDeleteTarget] = React.useState<SalesContact | null>(
    null
  )
  const displayedDeleteTarget = useStableDialogData(deleteTarget)
  const [isDeletingSales, setIsDeletingSales] = React.useState(false)

  React.useEffect(() => {
    setForm(toShowroomFormState(initialShowroom))
    setSales(initialShowroom.sales)
  }, [initialShowroom])

  const safeMapsEmbedUrl = getSafeHttpUrl(form.mapsEmbedUrl)
  const safeMapsUrl = getSafeHttpUrl(form.mapsUrl)
  const safeInstagramUrl = getSafeHttpUrl(form.instagramUrl)
  const activeSalesCount = sales.filter((item) => item.isActive).length

  const updateFormField = <TKey extends keyof ShowroomFormState>(
    key: TKey,
    value: ShowroomFormState[TKey]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFormErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleLogoFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !isAdmin) {
      return
    }

    if (!ALLOWED_LOGO_TYPES.has(file.type.toLowerCase())) {
      toast.add({
        type: "error",
        title: "Format logo harus WebP, JPG, atau PNG.",
      })
      return
    }

    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.add({
        type: "error",
        title: "Ukuran file logo maksimal 5 MB.",
      })
      return
    }

    setIsUploadingLogo(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("scope", "brand")

      const response = await fetch("/api/dash/media/upload", {
        method: "POST",
        body: formData,
      })

      const payload = (await response.json().catch(() => null)) as {
        url?: string
        error?: string
      } | null

      if (!response.ok || !payload?.url) {
        throw new Error(
          payload?.error ?? "Gagal mengunggah logo showroom. Silakan coba lagi."
        )
      }

      updateFormField("logoUrl", payload.url)
      toast.add({
        type: "success",
        title: `Logo berhasil diunggah ke ${payload.url}. Klik "Simpan Profil Showroom" untuk menerapkan perubahan.`,
      })
    } catch (err) {
      toast.add({
        type: "error",
        title: extractErrorMessage(err, "Gagal mengunggah logo showroom."),
      })
    } finally {
      setIsUploadingLogo(false)
    }
  }

  const handleSaveProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!isAdmin) return

    const parsed = showroomUpdateSchema.safeParse(form)

    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof ShowroomFormState, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ShowroomFormState | undefined
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message
        }
      }
      setFormErrors(nextErrors)
      toast.add({
        type: "error",
        title: "Periksa kembali kolom profil showroom yang ditandai.",
      })
      return
    }

    setFormErrors({})
    setIsSavingProfile(true)

    try {
      const updated = await updateShowroomSettingsFn({ data: parsed.data })
      setForm(toShowroomFormState(updated))
      setSales(updated.sales)
      toast.add({
        type: "success",
        title: "Pengaturan profil showroom berhasil disimpan.",
      })
      await router.invalidate()
    } catch (err) {
      toast.add({
        type: "error",
        title: extractErrorMessage(
          err,
          "Gagal menyimpan pengaturan profil showroom."
        ),
      })
    } finally {
      setIsSavingProfile(false)
    }
  }

  const openCreateSalesDialog = () => {
    if (!isAdmin) return
    setSalesForm({
      name: "",
      slug: "",
      role: "Sales Consultant",
      phoneDisplay: "",
      phoneE164: "",
      isActive: true,
      sortOrder: sales.length,
    })
    setSalesE164Edited(false)
    setSalesFormErrors({})
    setSalesDialogOpen(true)
  }

  const openEditSalesDialog = (contact: SalesContact) => {
    if (!isAdmin) return
    setSalesForm({
      id: contact.id,
      name: contact.name,
      slug: contact.slug,
      role: contact.role,
      phoneDisplay: contact.phoneDisplay,
      phoneE164: contact.phoneE164,
      isActive: contact.isActive,
      sortOrder: contact.sortOrder,
    })
    setSalesE164Edited(true)
    setSalesFormErrors({})
    setSalesDialogOpen(true)
  }

  const handleSaveSalesContact = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()
    if (!isAdmin) return

    const payload = {
      ...(salesForm.id ? { id: salesForm.id } : {}),
      name: salesForm.name,
      slug: salesForm.slug,
      role: salesForm.role,
      phoneDisplay: salesForm.phoneDisplay,
      phoneE164: salesForm.phoneE164,
      isActive: salesForm.isActive,
      sortOrder: salesForm.sortOrder,
    }

    const parsed = salesContactUpsertSchema.safeParse(payload)
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof SalesFormState, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof SalesFormState | undefined
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message
        }
      }
      setSalesFormErrors(nextErrors)
      return
    }

    setSalesFormErrors({})
    setIsSavingSales(true)

    try {
      const saved = await upsertSalesContactFn({ data: parsed.data })
      setSales((prev) => {
        const exists = prev.some((item) => item.id === saved.id)
        const updatedList = exists
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [...prev, saved]
        return [...updatedList].sort((a, b) => a.sortOrder - b.sortOrder)
      })
      setSalesDialogOpen(false)
      toast.add({
        type: "success",
        title: salesForm.id
          ? `Kontak sales "${saved.name}" berhasil diperbarui.`
          : `Kontak sales "${saved.name}" berhasil ditambahkan.`,
      })
      await router.invalidate()
    } catch (err) {
      toast.add({
        type: "error",
        title: extractErrorMessage(err, "Gagal menyimpan kontak sales."),
      })
    } finally {
      setIsSavingSales(false)
    }
  }

  const handleToggleSalesActive = async (
    contact: SalesContact,
    nextActive: boolean
  ) => {
    if (!isAdmin) return

    setBusySalesId(contact.id)

    try {
      const updated = await upsertSalesContactFn({
        data: {
          id: contact.id,
          slug: contact.slug,
          name: contact.name,
          role: contact.role,
          phoneDisplay: contact.phoneDisplay,
          phoneE164: contact.phoneE164,
          isActive: nextActive,
          sortOrder: contact.sortOrder,
        },
      })
      setSales((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      )
      toast.add({
        type: "success",
        title: `Status kontak "${updated.name}" diubah menjadi ${updated.isActive ? "Aktif" : "Nonaktif"}.`,
      })
      await router.invalidate()
    } catch (err) {
      toast.add({
        type: "error",
        title: extractErrorMessage(err, "Gagal mengubah status kontak sales."),
      })
    } finally {
      setBusySalesId(null)
    }
  }

  const handleMoveSales = async (index: number, direction: "up" | "down") => {
    if (!isAdmin) return
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= sales.length) {
      return
    }

    const reordered = [...sales]
    const currentItem = reordered[index]
    const targetItem = reordered[targetIndex]
    reordered[index] = targetItem
    reordered[targetIndex] = currentItem

    const previousSales = sales
    setSales(reordered)
    setIsReorderingSales(true)

    try {
      const updated = await reorderSalesContactsFn({
        data: { orderedIds: reordered.map((item) => item.id) },
      })
      setSales(updated)
      toast.add({
        type: "success",
        title: "Urutan kontak sales berhasil diperbarui.",
      })
      await router.invalidate()
    } catch (err) {
      setSales(previousSales)
      toast.add({
        type: "error",
        title: extractErrorMessage(err, "Gagal mengubah urutan kontak sales."),
      })
    } finally {
      setIsReorderingSales(false)
    }
  }

  const handleConfirmDeleteSales = async () => {
    if (!isAdmin || !deleteTarget) return

    setIsDeletingSales(true)

    try {
      await deleteSalesContactFn({ data: { id: deleteTarget.id } })
      const deletedName = deleteTarget.name
      setSales((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.add({
        type: "success",
        title: `Kontak sales "${deletedName}" telah dihapus.`,
      })
      await router.invalidate()
    } catch (err) {
      toast.add({
        type: "error",
        title: extractErrorMessage(err, "Gagal menghapus kontak sales."),
      })
    } finally {
      setIsDeletingSales(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-border pb-5">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Showroom &amp; Kontak Sales
        </h1>
      </div>

      {!isAdmin ? (
        <div
          role="status"
          className="flex items-start gap-3 border border-l-2 border-amber-700/35 border-l-amber-700 bg-amber-50 px-4 py-3.5 text-sm text-amber-950"
        >
          <ShieldAlert
            className="mt-0.5 size-4 shrink-0 text-amber-800"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">Mode lihat saja</p>
            <p className="mt-0.5 text-sm text-amber-900">
              Hubungi Admin untuk mengubah data showroom atau kontak sales.
            </p>
          </div>
        </div>
      ) : null}

      <section
        aria-labelledby="showroom-profile-heading"
        className="border border-border bg-card"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/40 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Store className="size-4 text-primary" aria-hidden="true" />
            <h2
              id="showroom-profile-heading"
              className="font-heading text-base font-bold tracking-tight text-foreground"
            >
              Profil Showroom
            </h2>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} noValidate className="p-5 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="space-y-5 lg:col-span-7">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="showroom-name"
                    className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                  >
                    Nama Showroom
                  </label>
                  <Input
                    id="showroom-name"
                    value={form.name}
                    disabled={!isAdmin || isSavingProfile}
                    onChange={(e) => updateFormField("name", e.target.value)}
                    aria-invalid={formErrors.name ? true : undefined}
                    placeholder="Garasi 571"
                  />
                  {formErrors.name ? (
                    <p className="text-sm text-destructive">{formErrors.name}</p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="showroom-city"
                    className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                  >
                    Kota / Wilayah
                  </label>
                  <Input
                    id="showroom-city"
                    value={form.city}
                    disabled={!isAdmin || isSavingProfile}
                    onChange={(e) => updateFormField("city", e.target.value)}
                    aria-invalid={formErrors.city ? true : undefined}
                    placeholder="Surakarta, Jawa Tengah"
                  />
                  {formErrors.city ? (
                    <p className="text-sm text-destructive">{formErrors.city}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="showroom-address"
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Alamat Lengkap
                </label>
                <Textarea
                  id="showroom-address"
                  rows={3}
                  value={form.address}
                  disabled={!isAdmin || isSavingProfile}
                  onChange={(e) => updateFormField("address", e.target.value)}
                  aria-invalid={formErrors.address ? true : undefined}
                  placeholder="Jl. ... Surakarta, Jawa Tengah"
                />
                {formErrors.address ? (
                  <p className="text-sm text-destructive">
                    {formErrors.address}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="showroom-hours"
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Jam Operasional
                </label>
                <Input
                  id="showroom-hours"
                  value={form.hours}
                  disabled={!isAdmin || isSavingProfile}
                  onChange={(e) => updateFormField("hours", e.target.value)}
                  aria-invalid={formErrors.hours ? true : undefined}
                  placeholder="Setiap hari, 08:00 - 16:00 WIB"
                />
                {formErrors.hours ? (
                  <p className="text-sm text-destructive">{formErrors.hours}</p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label
                    htmlFor="showroom-instagram-handle"
                    className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                  >
                    Handle Instagram
                  </label>
                  <Input
                    id="showroom-instagram-handle"
                    value={form.instagramHandle}
                    disabled={!isAdmin || isSavingProfile}
                    onChange={(e) =>
                      updateFormField("instagramHandle", e.target.value)
                    }
                    aria-invalid={formErrors.instagramHandle ? true : undefined}
                    placeholder="@garasi.571"
                  />
                  {formErrors.instagramHandle ? (
                    <p className="text-sm text-destructive">
                      {formErrors.instagramHandle}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor="showroom-instagram-url"
                      className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                    >
                      URL Profil Instagram
                    </label>
                    {safeInstagramUrl ? (
                      <a
                        href={safeInstagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        <ExternalLink className="size-3" aria-hidden="true" />
                        <span>Buka</span>
                      </a>
                    ) : null}
                  </div>
                  <Input
                    id="showroom-instagram-url"
                    type="url"
                    value={form.instagramUrl}
                    disabled={!isAdmin || isSavingProfile}
                    onChange={(e) =>
                      updateFormField("instagramUrl", e.target.value)
                    }
                    aria-invalid={formErrors.instagramUrl ? true : undefined}
                    placeholder="https://www.instagram.com/garasi.571/"
                  />
                  {formErrors.instagramUrl ? (
                    <p className="text-sm text-destructive">
                      {formErrors.instagramUrl}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor="showroom-maps-url"
                    className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                  >
                    URL Google Maps (Tautan Arah)
                  </label>
                  {safeMapsUrl ? (
                    <a
                      href={safeMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      <ExternalLink className="size-3" aria-hidden="true" />
                      <span>Tes Tautan</span>
                    </a>
                  ) : null}
                </div>
                <Input
                  id="showroom-maps-url"
                  type="url"
                  value={form.mapsUrl}
                  disabled={!isAdmin || isSavingProfile}
                  onChange={(e) => updateFormField("mapsUrl", e.target.value)}
                  aria-invalid={formErrors.mapsUrl ? true : undefined}
                  placeholder="https://maps.app.goo.gl/..."
                />
                {formErrors.mapsUrl ? (
                  <p className="text-sm text-destructive">
                    {formErrors.mapsUrl}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="showroom-maps-embed-url"
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  URL Sematan Google Maps
                </label>
                <Input
                  id="showroom-maps-embed-url"
                  type="url"
                  value={form.mapsEmbedUrl}
                  disabled={!isAdmin || isSavingProfile}
                  onChange={(e) =>
                    updateFormField("mapsEmbedUrl", e.target.value)
                  }
                  aria-invalid={formErrors.mapsEmbedUrl ? true : undefined}
                  placeholder="https://maps.google.com/maps?q=...&output=embed"
                />
                {formErrors.mapsEmbedUrl ? (
                  <p className="text-sm text-destructive">
                    {formErrors.mapsEmbedUrl}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Salin tautan sematan (embed) dari Google Maps.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-6 lg:col-span-5">
              <div className="space-y-4 border border-border bg-secondary/30 p-5">
                <div className="flex items-center gap-2">
                  <ImageIcon
                    className="size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold tracking-wider text-foreground uppercase">
                    Logo Brand Showroom
                  </span>
                </div>

                <div className="flex items-center gap-4 border border-[#2F2D2B] bg-[#161514] px-4 py-3.5">
                  <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden">
                    {form.logoUrl.trim() ? (
                      <img
                        src={form.logoUrl}
                        alt={`Logo ${form.name || "Garasi 571"}`}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <ImageIcon
                        className="size-6 text-[#C7C2BC]"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-heading text-sm font-bold tracking-tight text-[#FAF9F7]">
                      {form.name || "Garasi 571"}
                    </p>
                    <p className="mt-0.5 text-sm text-[#C7C2BC]">
                      {form.logoUrl.trim()
                        ? "Pratinjau pada latar gelap"
                        : "Belum ada logo terpasang"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/webp,image/jpeg,image/png"
                    onChange={handleLogoFileChange}
                    disabled={!isAdmin || isUploadingLogo || isSavingProfile}
                    className="sr-only"
                    aria-label="Pilih file logo showroom"
                  />

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        disabled={!form.logoUrl.trim()}
                        onClick={() => setIsLogoPreviewOpen(true)}
                        className="shrink-0"
                      >
                        <Eye className="size-4" aria-hidden="true" />
                        <span>Preview</span>
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="default"
                        disabled={!isAdmin || isUploadingLogo || isSavingProfile}
                        onClick={() => fileInputRef.current?.click()}
                        className="min-w-0 flex-1"
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2
                              className="size-4 animate-spin"
                              aria-hidden="true"
                            />
                            <span>Mengunggah Logo...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="size-4" aria-hidden="true" />
                            <span>Unggah Logo Baru</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-center text-sm text-muted-foreground">
                      Format WebP, JPG, atau PNG · Maksimal 5 MB
                    </p>
                  </div>

                  {formErrors.logoUrl ? (
                    <p className="text-sm text-destructive">
                      {formErrors.logoUrl}
                    </p>
                  ) : null}
                </div>

                <Dialog
                  open={isLogoPreviewOpen}
                  onOpenChange={setIsLogoPreviewOpen}
                >
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Pratinjau Logo Showroom</DialogTitle>
                      <DialogDescription>
                        Tampilan logo {form.name || "Garasi 571"} pada latar
                        gelap.
                      </DialogDescription>
                    </DialogHeader>

                    <div className="flex min-h-48 items-center justify-center border border-[#2F2D2B] bg-[#161514] p-6">
                      {form.logoUrl.trim() ? (
                        <img
                          src={form.logoUrl}
                          alt={`Logo ${form.name || "Garasi 571"}`}
                          className="max-h-40 max-w-full object-contain"
                        />
                      ) : null}
                    </div>

                    <DialogFooter>
                      <DialogClose render={<Button variant="outline" />}>
                        Tutup
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="border border-border bg-secondary/30 p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold tracking-wider text-foreground uppercase">
                    <MapPin className="size-3.5 text-primary" aria-hidden="true" />
                    <span>Pratinjau Peta</span>
                  </span>
                  <Badge variant={safeMapsEmbedUrl ? "success" : "secondary"}>
                    {safeMapsEmbedUrl ? "URL Valid" : "Belum Valid"}
                  </Badge>
                </div>

                <div className="mt-3 overflow-hidden border border-border bg-card">
                  {safeMapsEmbedUrl ? (
                    <iframe
                      src={safeMapsEmbedUrl}
                      title="Pratinjau Google Maps Showroom Garasi 571"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="h-56 w-full border-0"
                    />
                  ) : (
                    <div className="flex h-56 flex-col items-center justify-center gap-2 px-4 text-center text-sm text-muted-foreground">
                      <MapPin className="size-5 opacity-60" aria-hidden="true" />
                      <p>
                        Masukkan URL Embed Google Maps yang diawali{" "}
                        <code>https://</code> untuk melihat pratinjau peta.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end border-t border-border pt-5">
            <Button
              type="submit"
              disabled={!isAdmin || isSavingProfile || isUploadingLogo}
            >
              {isSavingProfile ? (
                <>
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="size-4" aria-hidden="true" />
                  <span>Simpan Profil Showroom</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </section>

      <section
        aria-labelledby="sales-contacts-heading"
        className="border border-border bg-card"
      >
        <div className="flex flex-col gap-3 border-b border-border bg-secondary/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex items-center gap-2.5">
            <Users className="size-4 text-primary" aria-hidden="true" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="sales-contacts-heading"
                  className="font-heading text-base font-bold tracking-tight text-foreground"
                >
                  Daftar Kontak Sales WhatsApp
                </h2>
                <Badge variant="outline" className="tabular-nums">
                  {activeSalesCount} aktif / {sales.length} total
                </Badge>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="default"
            size="default"
            disabled={!isAdmin}
            onClick={openCreateSalesDialog}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>Tambah Kontak Sales</span>
          </Button>
        </div>

        <div className="p-5 sm:p-6">
          {sales.length === 0 ? (
            <div className="border border-dashed border-border bg-secondary/20 px-6 py-10 text-center">
              <Users
                className="mx-auto size-7 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-3 font-heading text-base font-semibold text-foreground">
                Belum Ada Kontak Sales
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Tambahkan minimal satu kontak sales WhatsApp agar calon pembeli
                dapat menghubungi showroom secara langsung.
              </p>
              {isAdmin ? (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={openCreateSalesDialog}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  <span>Tambah Kontak Pertama</span>
                </Button>
              ) : null}
            </div>
          ) : (
            <ul className="divide-y divide-border border border-border">
              {sales.map((contact, index) => {
                const isBusy = busySalesId === contact.id || isReorderingSales
                const waPreviewUrl = buildWhatsAppUrl(
                  contact.phoneE164,
                  `Halo ${contact.name}, saya menghubungi dari katalog Garasi 571.`
                )

                return (
                  <li
                    key={contact.id}
                    className="flex flex-col gap-4 bg-card p-4 transition-colors hover:bg-secondary/25 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3.5">
                      <span className="inline-flex size-8 shrink-0 items-center justify-center border border-border bg-secondary font-mono text-sm font-semibold text-foreground tabular-nums">
                        #{index + 1}
                      </span>

                      <div className="min-w-0 space-y-1">
                        <p className="font-heading text-base font-bold text-foreground">
                          {contact.name}
                        </p>

                        <p className="text-sm font-medium text-muted-foreground">
                          {contact.role}
                        </p>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-0.5 text-sm">
                          <span className="font-medium text-foreground tabular-nums">
                            {contact.phoneDisplay}
                          </span>
                          <span className="font-mono text-muted-foreground tabular-nums">
                            WA: {contact.phoneE164}
                          </span>
                          <a
                            href={waPreviewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                          >
                            <MessageCircle
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            <span>Tes WA</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 lg:justify-end lg:border-t-0 lg:pt-0">
                      <div className="flex items-center gap-2 pr-2">
                        <Switch
                          checked={contact.isActive}
                          disabled={!isAdmin || isBusy}
                          onCheckedChange={(checked) => {
                            void handleToggleSalesActive(contact, checked)
                          }}
                          aria-label={`Aktifkan kontak sales ${contact.name}`}
                        />
                        <span className="text-sm font-medium text-muted-foreground">
                          {contact.isActive ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Tooltip>
                          <TooltipTrigger
                            render={<span className="inline-flex" />}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              disabled={!isAdmin || isBusy || index === 0}
                              onClick={() => void handleMoveSales(index, "up")}
                              aria-label={`Naikkan urutan ${contact.name}`}
                            >
                              <ChevronUp
                                className="size-4"
                                aria-hidden="true"
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Pindah ke atas</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger
                            render={<span className="inline-flex" />}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              disabled={
                                !isAdmin || isBusy || index === sales.length - 1
                              }
                              onClick={() =>
                                void handleMoveSales(index, "down")
                              }
                              aria-label={`Turunkan urutan ${contact.name}`}
                            >
                              <ChevronDown
                                className="size-4"
                                aria-hidden="true"
                              />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Pindah ke bawah</TooltipContent>
                        </Tooltip>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!isAdmin || isBusy}
                          onClick={() => openEditSalesDialog(contact)}
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </Button>

                        <Tooltip>
                          <TooltipTrigger
                            render={<span className="inline-flex" />}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              disabled={!isAdmin || isBusy}
                              onClick={() => setDeleteTarget(contact)}
                              aria-label={`Hapus kontak sales ${contact.name}`}
                              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-[#991B1B]"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Hapus kontak sales</TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      <Dialog open={salesDialogOpen} onOpenChange={setSalesDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {salesForm.id ? "Edit Kontak Sales" : "Tambah Kontak Sales Baru"}
            </DialogTitle>
            <DialogDescription>
              Lengkapi nama, peran, dan nomor WhatsApp aktif yang akan
              ditampilkan pada halaman showroom dan detail unit.
            </DialogDescription>
          </DialogHeader>

          <form
            onSubmit={handleSaveSalesContact}
            noValidate
            className="mt-4 space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="sales-name"
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Nama Sales
                </label>
                <Input
                  id="sales-name"
                  value={salesForm.name}
                  disabled={isSavingSales}
                  onChange={(e) => {
                    const nextName = e.target.value
                    setSalesForm((prev) => ({
                      ...prev,
                      name: nextName,
                      ...(!prev.id ? { slug: slugifyText(nextName) } : {}),
                    }))
                  }}
                  aria-invalid={salesFormErrors.name ? true : undefined}
                  placeholder="Mas Budi"
                />
                {salesFormErrors.name ? (
                  <p className="text-sm text-destructive">
                    {salesFormErrors.name}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="sales-role"
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Jabatan / Peran
                </label>
                <Input
                  id="sales-role"
                  value={salesForm.role}
                  disabled={isSavingSales}
                  onChange={(e) =>
                    setSalesForm((prev) => ({ ...prev, role: e.target.value }))
                  }
                  aria-invalid={salesFormErrors.role ? true : undefined}
                  placeholder="Sales Consultant"
                />
                {salesFormErrors.role ? (
                  <p className="text-sm text-destructive">
                    {salesFormErrors.role}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  htmlFor="sales-phone-display"
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Nomor Tampilan
                </label>
                <Input
                  id="sales-phone-display"
                  type="tel"
                  value={salesForm.phoneDisplay}
                  disabled={isSavingSales}
                  onChange={(e) => {
                    const nextDisplay = e.target.value
                    setSalesForm((prev) => ({
                      ...prev,
                      phoneDisplay: nextDisplay,
                      ...(!salesE164Edited
                        ? { phoneE164: normalizePhoneToE164(nextDisplay) }
                        : {}),
                    }))
                  }}
                  aria-invalid={salesFormErrors.phoneDisplay ? true : undefined}
                  placeholder="+62 812-8641-4185"
                />
                {salesFormErrors.phoneDisplay ? (
                  <p className="text-sm text-destructive">
                    {salesFormErrors.phoneDisplay}
                  </p>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="sales-phone-e164"
                  className="block text-sm font-semibold tracking-wider text-foreground uppercase"
                >
                  Nomor WhatsApp
                </label>
                <Input
                  id="sales-phone-e164"
                  type="tel"
                  value={salesForm.phoneE164}
                  disabled={isSavingSales}
                  onChange={(e) => {
                    setSalesE164Edited(true)
                    setSalesForm((prev) => ({
                      ...prev,
                      phoneE164: e.target.value.replace(/\D/g, ""),
                    }))
                  }}
                  aria-invalid={salesFormErrors.phoneE164 ? true : undefined}
                  placeholder="6281286414185"
                  className="font-mono"
                />
                {salesFormErrors.phoneE164 ? (
                  <p className="text-sm text-destructive">
                    {salesFormErrors.phoneE164}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Diawali 62, angka saja tanpa spasi atau tanda +.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border border-border bg-secondary/40 px-3.5 py-2.5">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Tampilkan di Website Publik
                </p>
                <p className="text-sm text-muted-foreground">
                  Nonaktifkan jika sales sedang cuti atau tidak menerima lead.
                </p>
              </div>
              <Switch
                checked={salesForm.isActive}
                disabled={isSavingSales}
                onCheckedChange={(checked) =>
                  setSalesForm((prev) => ({ ...prev, isActive: checked }))
                }
                aria-label="Status aktif kontak sales"
              />
            </div>

            <DialogFooter>
              <DialogClose
                render={
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isSavingSales}
                  />
                }
              >
                Batal
              </DialogClose>
              <Button type="submit" disabled={isSavingSales}>
                {isSavingSales ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>
                    {salesForm.id ? "Simpan Perubahan" : "Tambah Kontak"}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletingSales) {
            setDeleteTarget(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus Kontak Sales?</DialogTitle>
            <DialogDescription>
              Kontak{" "}
              <strong className="font-semibold text-foreground">
                {displayedDeleteTarget?.name}
              </strong>{" "}
              ({displayedDeleteTarget?.phoneDisplay}) akan dihapus permanen dari
              daftar showroom. Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose
              render={
                <Button
                  type="button"
                  variant="outline"
                  disabled={isDeletingSales}
                />
              }
            >
              Batal
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingSales}
              onClick={() => void handleConfirmDeleteSales()}
            >
              {isDeletingSales ? (
                <>
                  <Loader2
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                  <span>Menghapus...</span>
                </>
              ) : (
                <>
                  <Trash2 className="size-4" aria-hidden="true" />
                  <span>Ya, Hapus Kontak</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
