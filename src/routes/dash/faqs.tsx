import * as React from "react"
import { createFileRoute, useRouter } from "@tanstack/react-router"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { slugifyText } from "@/lib/domain/formatters"
import { faqUpsertSchema } from "@/lib/domain/schemas"
import type { ShowroomFaqItem } from "@/lib/domain/types"
import {
  deleteFaqFn,
  listDashFaqsFn,
  reorderFaqsFn,
  upsertFaqFn,
} from "@/server/dash-faqs"

type FaqStatusFilter = "all" | "published" | "draft"

interface FaqFormState {
  id?: string
  question: string
  slug: string
  answer: string
  isPublished: boolean
  sortOrder: number
}

interface FeedbackMessage {
  type: "success" | "error"
  text: string
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message
  }
  return fallback
}

export const Route = createFileRoute("/dash/faqs")({
  loader: async () => {
    return await listDashFaqsFn()
  },
  head: () => ({
    meta: [
      {
        title: "FAQ | Garasi 571",
      },
      {
        name: "robots",
        content: "noindex, nofollow",
      },
    ],
  }),
  component: DashFaqsPage,
  pendingComponent: DashFaqsPending,
})

function DashFaqsPending() {
  return (
    <div aria-busy="true" aria-label="Memuat daftar FAQ" className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-10 w-36" />
      </div>

      <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
        {[0, 1, 2].map((idx) => (
          <Skeleton key={idx} className="h-20 w-full border border-border" />
        ))}
      </div>

      <Skeleton className="h-18 w-full border border-border" />

      <div className="space-y-3">
        {[0, 1, 2, 3].map((idx) => (
          <Skeleton key={idx} className="h-32 w-full border border-border" />
        ))}
      </div>
    </div>
  )
}

function DashFaqsPage() {
  const initialFaqs = Route.useLoaderData()
  const router = useRouter()

  const [faqs, setFaqs] = React.useState<ShowroomFaqItem[]>(() => initialFaqs)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<FaqStatusFilter>("all")

  const [feedback, setFeedback] = React.useState<FeedbackMessage | null>(null)
  const [busyFaqId, setBusyFaqId] = React.useState<string | null>(null)
  const [isReordering, setIsReordering] = React.useState(false)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [faqForm, setFaqForm] = React.useState<FaqFormState>({
    question: "",
    slug: "",
    answer: "",
    isPublished: true,
    sortOrder: 0,
  })
  const [slugEdited, setSlugEdited] = React.useState(false)
  const [formErrors, setFormErrors] = React.useState<
    Partial<Record<keyof FaqFormState, string>>
  >({})
  const [dialogError, setDialogError] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  const [deleteTarget, setDeleteTarget] =
    React.useState<ShowroomFaqItem | null>(null)
  const displayedDeleteTarget = useStableDialogData(deleteTarget)
  const [isDeleting, setIsDeleting] = React.useState(false)

  React.useEffect(() => {
    setFaqs(initialFaqs)
  }, [initialFaqs])

  const publishedCount = faqs.filter((item) => item.isPublished).length
  const draftCount = faqs.length - publishedCount

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const isFiltered = normalizedQuery.length > 0 || statusFilter !== "all"

  const visibleFaqs = React.useMemo(() => {
    return faqs.filter((item) => {
      if (statusFilter === "published" && !item.isPublished) return false
      if (statusFilter === "draft" && item.isPublished) return false
      if (normalizedQuery) {
        const haystack =
          `${item.question} ${item.answer} ${item.slug}`.toLowerCase()
        if (!haystack.includes(normalizedQuery)) return false
      }
      return true
    })
  }, [faqs, statusFilter, normalizedQuery])

  const openCreateDialog = () => {
    setFaqForm({
      question: "",
      slug: "",
      answer: "",
      isPublished: true,
      sortOrder: faqs.length,
    })
    setSlugEdited(false)
    setFormErrors({})
    setDialogError(null)
    setDialogOpen(true)
  }

  const openEditDialog = (faq: ShowroomFaqItem) => {
    setFaqForm({
      id: faq.id,
      question: faq.question,
      slug: faq.slug,
      answer: faq.answer,
      isPublished: faq.isPublished,
      sortOrder: faq.sortOrder,
    })
    setSlugEdited(true)
    setFormErrors({})
    setDialogError(null)
    setDialogOpen(true)
  }

  const handleSaveFaq = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setDialogError(null)

    const payload = {
      ...(faqForm.id ? { id: faqForm.id } : {}),
      question: faqForm.question,
      slug: faqForm.slug,
      answer: faqForm.answer,
      isPublished: faqForm.isPublished,
      sortOrder: faqForm.sortOrder,
    }

    const parsed = faqUpsertSchema.safeParse(payload)
    if (!parsed.success) {
      const nextErrors: Partial<Record<keyof FaqFormState, string>> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FaqFormState | undefined
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message
        }
      }
      setFormErrors(nextErrors)
      return
    }

    setFormErrors({})
    setIsSaving(true)

    try {
      const saved = await upsertFaqFn({ data: parsed.data })
      setFaqs((prev) => {
        const exists = prev.some((item) => item.id === saved.id)
        const nextList = exists
          ? prev.map((item) => (item.id === saved.id ? saved : item))
          : [...prev, saved]
        return [...nextList].sort((a, b) => a.sortOrder - b.sortOrder)
      })
      setDialogOpen(false)
      setFeedback({
        type: "success",
        text: faqForm.id
          ? "FAQ berhasil diperbarui."
          : "FAQ baru berhasil ditambahkan.",
      })
      await router.invalidate()
    } catch (err) {
      setDialogError(extractErrorMessage(err, "Gagal menyimpan FAQ."))
    } finally {
      setIsSaving(false)
    }
  }

  const handleTogglePublished = async (
    faq: ShowroomFaqItem,
    nextPublished: boolean
  ) => {
    setFeedback(null)
    setBusyFaqId(faq.id)

    try {
      const updated = await upsertFaqFn({
        data: {
          id: faq.id,
          slug: faq.slug,
          question: faq.question,
          answer: faq.answer,
          isPublished: nextPublished,
          sortOrder: faq.sortOrder,
        },
      })
      setFaqs((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      )
      setFeedback({
        type: "success",
        text: `Status FAQ diubah menjadi ${updated.isPublished ? "Dipublikasikan" : "Draft"}.`,
      })
      await router.invalidate()
    } catch (err) {
      setFeedback({
        type: "error",
        text: extractErrorMessage(err, "Gagal mengubah status publikasi FAQ."),
      })
    } finally {
      setBusyFaqId(null)
    }
  }

  const handleMoveFaq = async (index: number, direction: "up" | "down") => {
    if (isFiltered) return
    const targetIndex = direction === "up" ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= faqs.length) {
      return
    }

    const reordered = [...faqs]
    const currentItem = reordered[index]
    const targetItem = reordered[targetIndex]
    reordered[index] = targetItem
    reordered[targetIndex] = currentItem

    const previousFaqs = faqs
    setFaqs(reordered)
    setFeedback(null)
    setIsReordering(true)

    try {
      const updated = await reorderFaqsFn({
        data: { orderedIds: reordered.map((item) => item.id) },
      })
      setFaqs(updated)
      setFeedback({
        type: "success",
        text: "Urutan FAQ berhasil diperbarui.",
      })
      await router.invalidate()
    } catch (err) {
      setFaqs(previousFaqs)
      setFeedback({
        type: "error",
        text: extractErrorMessage(err, "Gagal memperbarui urutan FAQ."),
      })
    } finally {
      setIsReordering(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return

    setFeedback(null)
    setIsDeleting(true)

    try {
      await deleteFaqFn({ data: { id: deleteTarget.id } })
      setFaqs((prev) => prev.filter((item) => item.id !== deleteTarget.id))
      setDeleteTarget(null)
      setFeedback({
        type: "success",
        text: "FAQ berhasil dihapus.",
      })
      await router.invalidate()
    } catch (err) {
      setFeedback({
        type: "error",
        text: extractErrorMessage(err, "Gagal menghapus FAQ."),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          FAQ Showroom
        </h1>

        <Button
          type="button"
          variant="default"
          onClick={openCreateDialog}
          className="self-start sm:self-auto"
        >
          <Plus className="size-4" aria-hidden="true" />
          <span>Tambah FAQ</span>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:max-w-lg">
        <div className="border border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Total FAQ
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-foreground tabular-nums">
            {faqs.length}
          </p>
        </div>
        <div className="border border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Publik
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-emerald-800 tabular-nums">
            {publishedCount}
          </p>
        </div>
        <div className="border border-border bg-card px-4 py-3">
          <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
            Draft
          </p>
          <p className="mt-1 font-heading text-2xl font-bold text-muted-foreground tabular-nums">
            {draftCount}
          </p>
        </div>
      </div>

      {feedback ? (
        <div
          role={feedback.type === "error" ? "alert" : "status"}
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

      <div className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari pertanyaan atau jawaban..."
            aria-label="Cari FAQ"
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              { value: "all", label: `Semua (${faqs.length})` },
              { value: "published", label: `Publik (${publishedCount})` },
              { value: "draft", label: `Draft (${draftCount})` },
            ] as const
          ).map((tab) => (
            <Button
              key={tab.value}
              type="button"
              size="sm"
              variant={statusFilter === tab.value ? "default" : "outline"}
              onClick={() => setStatusFilter(tab.value)}
              className="tabular-nums"
            >
              {tab.label}
            </Button>
          ))}

          {isFiltered ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearchQuery("")
                setStatusFilter("all")
              }}
            >
              <X className="size-3.5" aria-hidden="true" />
              <span>Reset</span>
            </Button>
          ) : null}
        </div>
      </div>

      {isFiltered && faqs.length > 1 ? (
        <p className="text-sm text-muted-foreground">
          Reset filter untuk mengubah urutan FAQ.
        </p>
      ) : null}

      {faqs.length === 0 ? (
        <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
          <HelpCircle
            className="mx-auto size-8 text-muted-foreground"
            aria-hidden="true"
          />
          <h2 className="mt-3 font-heading text-lg font-bold text-foreground">
            Belum Ada Daftar FAQ
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
            Tambahkan pertanyaan yang sering diajukan calon pembeli agar
            informasi penting selalu tersedia di beranda Garasi 571.
          </p>
          <Button
            type="button"
            variant="default"
            className="mt-5"
            onClick={openCreateDialog}
          >
            <Plus className="size-4" aria-hidden="true" />
            <span>Tambah FAQ Pertama</span>
          </Button>
        </div>
      ) : visibleFaqs.length === 0 ? (
        <div className="border border-border bg-card px-6 py-10 text-center">
          <p className="font-heading text-base font-semibold text-foreground">
            Tidak ada FAQ yang cocok dengan filter saat ini
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Ubah kata kunci pencarian atau pilih tab status lainnya.
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => {
              setSearchQuery("")
              setStatusFilter("all")
            }}
          >
            Tampilkan Semua FAQ
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {visibleFaqs.map((faq, index) => {
            const isBusy = busyFaqId === faq.id || isReordering
            const globalIndex = faqs.findIndex((item) => item.id === faq.id)
            const displayNumber =
              globalIndex >= 0 ? globalIndex + 1 : index + 1

            return (
              <li
                key={faq.id}
                className="border border-border bg-card transition-colors hover:border-foreground/30"
              >
                <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex min-w-0 flex-1 items-start gap-3.5">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center border border-border bg-secondary font-mono text-sm font-semibold text-foreground tabular-nums">
                      #{displayNumber}
                    </span>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={faq.isPublished ? "success" : "secondary"}
                        >
                          {faq.isPublished ? "Publik" : "Draft"}
                        </Badge>
                      </div>

                      <h2 className="font-heading text-base font-bold tracking-tight text-foreground sm:text-lg">
                        {faq.question}
                      </h2>

                      <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                        {faq.answer}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 lg:shrink-0 lg:flex-col lg:items-end lg:border-t-0 lg:pt-0">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={faq.isPublished}
                        disabled={isBusy}
                        onCheckedChange={(checked) => {
                          void handleTogglePublished(faq, checked)
                        }}
                        aria-label={`Publikasikan FAQ: ${faq.question}`}
                      />
                      <span className="text-sm font-medium text-muted-foreground">
                        {faq.isPublished ? "Dipublikasikan" : "Draft"}
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
                            disabled={isBusy || isFiltered || index === 0}
                            onClick={() => void handleMoveFaq(index, "up")}
                            aria-label={`Naikkan urutan FAQ: ${faq.question}`}
                          >
                            <ChevronUp className="size-4" aria-hidden="true" />
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
                              isBusy || isFiltered || index === faqs.length - 1
                            }
                            onClick={() => void handleMoveFaq(index, "down")}
                            aria-label={`Turunkan urutan FAQ: ${faq.question}`}
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
                        disabled={isBusy}
                        onClick={() => openEditDialog(faq)}
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
                            disabled={isBusy}
                            onClick={() => setDeleteTarget(faq)}
                            aria-label={`Hapus FAQ: ${faq.question}`}
                            className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-[#991B1B]"
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Hapus FAQ</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {faqForm.id ? "Edit FAQ Showroom" : "Tambah FAQ Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveFaq} noValidate className="mt-4 space-y-4">
            {dialogError ? (
              <div
                role="alert"
                className="flex items-start gap-2 border border-l-2 border-destructive/30 border-l-destructive bg-destructive/10 px-3 py-2.5 text-sm text-[#991B1B]"
              >
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0 text-destructive"
                  aria-hidden="true"
                />
                <span>{dialogError}</span>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <label
                htmlFor="faq-question"
                className="block text-sm font-semibold tracking-wider text-foreground uppercase"
              >
                Pertanyaan
              </label>
              <Input
                id="faq-question"
                value={faqForm.question}
                disabled={isSaving}
                onChange={(e) => {
                  const nextQuestion = e.target.value
                  setFaqForm((prev) => ({
                    ...prev,
                    question: nextQuestion,
                    ...(!slugEdited
                      ? { slug: slugifyText(nextQuestion).slice(0, 80) }
                      : {}),
                  }))
                }}
                aria-invalid={formErrors.question ? true : undefined}
                placeholder="Apakah bisa tukar tambah dengan mobil lama saya?"
              />
              {formErrors.question ? (
                <p className="text-sm text-destructive">
                  {formErrors.question}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="faq-slug"
                className="block text-sm font-semibold tracking-wider text-foreground uppercase"
              >
                Slug Unik
              </label>
              <Input
                id="faq-slug"
                value={faqForm.slug}
                disabled={isSaving}
                onChange={(e) => {
                  setSlugEdited(true)
                  setFaqForm((prev) => ({ ...prev, slug: e.target.value }))
                }}
                aria-invalid={formErrors.slug ? true : undefined}
                placeholder="tukar-tambah-mobil-lama"
                className="font-mono"
              />
              {formErrors.slug ? (
                <p className="text-sm text-destructive">{formErrors.slug}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Huruf kecil, angka, dan tanda hubung (-). Otomatis terisi dari
                  pertanyaan saat menambah FAQ baru.
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="faq-answer"
                className="block text-sm font-semibold tracking-wider text-foreground uppercase"
              >
                Jawaban
              </label>
              <Textarea
                id="faq-answer"
                rows={5}
                value={faqForm.answer}
                disabled={isSaving}
                onChange={(e) =>
                  setFaqForm((prev) => ({ ...prev, answer: e.target.value }))
                }
                aria-invalid={formErrors.answer ? true : undefined}
                placeholder="Ya, kami melayani tukar tambah untuk berbagai merek mobil bekas dengan proses cek kondisi transparan di showroom Surakarta..."
              />
              {formErrors.answer ? (
                <p className="text-sm text-destructive">{formErrors.answer}</p>
              ) : null}
            </div>

            <div className="flex items-center justify-between border border-border bg-secondary/40 px-3.5 py-2.5">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Tampilkan di Halaman Publik
                </p>
              </div>
              <Switch
                checked={faqForm.isPublished}
                disabled={isSaving}
                onCheckedChange={(checked) =>
                  setFaqForm((prev) => ({ ...prev, isPublished: checked }))
                }
                aria-label="Publikasikan FAQ"
              />
            </div>

            <DialogFooter>
              <DialogClose
                render={
                  <Button type="button" variant="outline" disabled={isSaving} />
                }
              >
                Batal
              </DialogClose>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <span>{faqForm.id ? "Simpan Perubahan" : "Tambah FAQ"}</span>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDeleteTarget(null)
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Hapus FAQ Ini?</DialogTitle>
            <DialogDescription>
              FAQ{" "}
              <strong className="font-semibold text-foreground">
                &ldquo;{displayedDeleteTarget?.question}&rdquo;
              </strong>{" "}
              akan dihapus permanen dari daftar showroom. Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <DialogClose
              render={
                <Button type="button" variant="outline" disabled={isDeleting} />
              }
            >
              Batal
            </DialogClose>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void handleConfirmDelete()}
            >
              {isDeleting ? (
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
                  <span>Ya, Hapus FAQ</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
