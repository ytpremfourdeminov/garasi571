import * as React from "react"
import { cn } from "cn"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  CircleDashed,
  ImagePlus,
  Loader2,
  RotateCcw,
  Save,
  Sparkles,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TruncatedTooltip } from "@/components/ui/tooltip"
import type { CarImage, ImageAngleTag } from "@/lib/domain/types"
import { compressImageToWebP } from "@/lib/image-compress"
import {
  deleteCarImageFn,
  updateCarImagesOrderAndMetaFn,
} from "@/server/dash-cars"

export interface CarMediaManagerProps {
  carId: string
  carName: string
  images: CarImage[]
  onImagesChange: (next: CarImage[]) => void
  disabled?: boolean
}

interface AngleOptionMeta {
  tag: ImageAngleTag
  label: string
  checklistLabel: string
  checklistHint: string
  altPhrase: string
  mandatory: boolean
}

const ANGLE_OPTIONS: ReadonlyArray<AngleOptionMeta> = [
  {
    tag: "hero",
    label: "Hero (Serong Depan Utama)",
    checklistLabel: "Hero",
    checklistHint: "Serong depan 3/4 utama",
    altPhrase: "tampak serong depan utama",
    mandatory: true,
  },
  {
    tag: "eksterior",
    label: "Eksterior",
    checklistLabel: "Eksterior",
    checklistHint: "Sisi samping & belakang",
    altPhrase: "eksterior bodi",
    mandatory: true,
  },
  {
    tag: "interior",
    label: "Interior & Kabin",
    checklistLabel: "Interior",
    checklistHint: "Dasbor, jok & kabin",
    altPhrase: "interior dan kabin",
    mandatory: true,
  },
  {
    tag: "odometer",
    label: "Panel Instrumen & Odometer",
    checklistLabel: "Odometer",
    checklistHint: "Angka KM & indikator",
    altPhrase: "panel instrumen dan odometer",
    mandatory: true,
  },
  {
    tag: "mesin",
    label: "Ruang Mesin",
    checklistLabel: "Mesin",
    checklistHint: "Kondisi ruang mesin",
    altPhrase: "ruang mesin",
    mandatory: true,
  },
  {
    tag: "dokumen",
    label: "Dokumen & Kunci Serep",
    checklistLabel: "Dokumen",
    checklistHint: "STNK, BPKB, buku servis",
    altPhrase: "kelengkapan dokumen dan kunci",
    mandatory: true,
  },
  {
    tag: "minus",
    label: "Minus / Cacat (Opsional)",
    checklistLabel: "Minus",
    checklistHint: "Opsional transparansi",
    altPhrase: "detail kondisi minus",
    mandatory: false,
  },
  {
    tag: "lainnya",
    label: "Lainnya",
    checklistLabel: "Lainnya",
    checklistHint: "Detail tambahan",
    altPhrase: "detail galeri unit",
    mandatory: false,
  },
]

const MANDATORY_ANGLE_OPTIONS = ANGLE_OPTIONS.filter((item) => item.mandatory)
const OPTIONAL_MINUS_OPTION = ANGLE_OPTIONS.find((item) => item.tag === "minus")

const ANGLE_SELECT_ITEMS: Record<ImageAngleTag, string> = {
  hero: "Hero (Serong Depan Utama)",
  eksterior: "Eksterior",
  interior: "Interior & Kabin",
  odometer: "Panel Instrumen & Odometer",
  mesin: "Ruang Mesin",
  dokumen: "Dokumen & Kunci Serep",
  minus: "Minus / Cacat (Opsional)",
  lainnya: "Lainnya",
}

const ANGLE_ALT_PHRASE: Record<ImageAngleTag, string> = {
  hero: "tampak serong depan utama",
  eksterior: "eksterior bodi",
  interior: "interior dan kabin",
  odometer: "panel instrumen dan odometer",
  mesin: "ruang mesin",
  dokumen: "kelengkapan dokumen dan kunci",
  minus: "detail kondisi minus",
  lainnya: "detail galeri unit",
}

const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
])

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

interface PersistedImageMeta {
  sortOrder: number
  isCover: boolean
  alt: string
  angleTag: ImageAngleTag
}

type UploadItemStatus =
  "queued" | "compressing" | "uploading" | "done" | "error"

interface UploadQueueItem {
  id: string
  fileName: string
  originalSizeBytes: number
  compressedSizeBytes?: number
  dimensionsLabel?: string
  progress: number
  status: UploadItemStatus
  angleTag: ImageAngleTag
  error?: string
}

interface MediaUploadResponse {
  r2Key: string
  url: string
  width: number
  height: number
  fileSizeBytes: number
  mimeType: string
  imageId?: string
}

function buildSuggestedAlt(carName: string, angleTag: ImageAngleTag): string {
  const cleanName = carName.trim() || "Unit Garasi 571"
  return `Foto ${cleanName} - ${ANGLE_ALT_PHRASE[angleTag]}`
}

function formatByteSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const kb = bytes / 1024
  if (kb < 1024) {
    return `${Math.round(kb)} KB`
  }
  return `${(kb / 1024).toFixed(2)} MB`
}

function buildPersistedMetaMap(
  list: CarImage[]
): Partial<Record<string, PersistedImageMeta>> {
  const map: Partial<Record<string, PersistedImageMeta>> = {}
  for (const img of list) {
    if (!img.id) continue
    map[img.id] = {
      sortOrder: img.sortOrder,
      isCover: img.isCover,
      alt: img.alt,
      angleTag: img.angleTag,
    }
  }
  return map
}

function getImageKey(img: CarImage, index: number): string {
  return img.id ?? img.r2Key ?? `${img.src}-${index}`
}

function isSupportedImageFile(file: File): boolean {
  const mime = file.type.toLowerCase()
  if (ALLOWED_UPLOAD_MIME_TYPES.has(mime)) {
    return true
  }
  if (!mime) {
    const lowerName = file.name.toLowerCase()
    return (
      lowerName.endsWith(".jpg") ||
      lowerName.endsWith(".jpeg") ||
      lowerName.endsWith(".png") ||
      lowerName.endsWith(".webp")
    )
  }
  return false
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message.trim().length > 0) {
    return err.message
  }
  return fallback
}

function uploadCarImageWithProgress(
  formData: FormData,
  onProgress: (percent: number) => void
): Promise<MediaUploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", "/api/dash/media/upload")
    xhr.withCredentials = true

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const ratio = Math.min(1, Math.max(0, event.loaded / event.total))
        onProgress(Math.round(ratio * 100))
      }
    }

    xhr.onload = () => {
      let parsed: Partial<MediaUploadResponse> & { error?: string } = {}
      try {
        parsed = JSON.parse(
          xhr.responseText
        ) as Partial<MediaUploadResponse> & {
          error?: string
        }
      } catch {
        // Non-JSON response body handled below.
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        if (
          typeof parsed.url === "string" &&
          typeof parsed.r2Key === "string" &&
          typeof parsed.width === "number" &&
          typeof parsed.height === "number"
        ) {
          resolve({
            r2Key: parsed.r2Key,
            url: parsed.url,
            width: parsed.width,
            height: parsed.height,
            fileSizeBytes: parsed.fileSizeBytes ?? 0,
            mimeType: parsed.mimeType ?? "image/webp",
            imageId: parsed.imageId,
          })
          return
        }

        reject(new Error("Respons server unggah foto tidak lengkap."))
        return
      }

      reject(
        new Error(parsed.error || `Gagal mengunggah foto (kode ${xhr.status}).`)
      )
    }

    xhr.onerror = () => {
      reject(
        new Error(
          "Koneksi terputus saat mengunggah foto. Periksa jaringan lalu coba lagi."
        )
      )
    }

    xhr.onabort = () => {
      reject(new Error("Proses unggah foto dibatalkan."))
    }

    xhr.send(formData)
  })
}

export function CarMediaManager({
  carId,
  carName,
  images,
  onImagesChange,
  disabled = false,
}: CarMediaManagerProps) {
  const [draftImages, setDraftImages] = React.useState<CarImage[]>(images)
  const [persistedMetaById, setPersistedMetaById] = React.useState<
    Partial<Record<string, PersistedImageMeta>>
  >(() => buildPersistedMetaMap(images))

  const [uploadAngleTag, setUploadAngleTag] =
    React.useState<ImageAngleTag>("lainnya")
  const [isDragOver, setIsDragOver] = React.useState(false)
  const [isUploading, setIsUploading] = React.useState(false)
  const [uploadQueue, setUploadQueue] = React.useState<UploadQueueItem[]>([])

  const [isSaving, setIsSaving] = React.useState(false)
  const [deletingImageId, setDeletingImageId] = React.useState<string | null>(
    null
  )
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(
    null
  )

  const [errorBanner, setErrorBanner] = React.useState<string | null>(null)
  const [statusNotice, setStatusNotice] = React.useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement | null>(null)
  const lastEmittedRef = React.useRef<CarImage[] | null>(null)
  const draftImagesRef = React.useRef<CarImage[]>(draftImages)
  draftImagesRef.current = draftImages

  const prevCarIdRef = React.useRef(carId)

  React.useEffect(() => {
    const carChanged = prevCarIdRef.current !== carId
    if (carChanged) {
      prevCarIdRef.current = carId
      lastEmittedRef.current = null
      setDraftImages(images)
      setPersistedMetaById(buildPersistedMetaMap(images))
      setUploadQueue([])
      setConfirmDeleteId(null)
      setDeletingImageId(null)
      setErrorBanner(null)
      setStatusNotice(null)
      return
    }

    if (images !== lastEmittedRef.current) {
      setDraftImages(images)
      setPersistedMetaById(buildPersistedMetaMap(images))
    }
  }, [carId, images])

  const emitImages = React.useCallback(
    (next: CarImage[]) => {
      draftImagesRef.current = next
      lastEmittedRef.current = next
      setDraftImages(next)
      onImagesChange(next)
    },
    [onImagesChange]
  )

  const angleCounts = React.useMemo(() => {
    const counts: Record<ImageAngleTag, number> = {
      hero: 0,
      eksterior: 0,
      interior: 0,
      odometer: 0,
      mesin: 0,
      dokumen: 0,
      minus: 0,
      lainnya: 0,
    }
    for (const img of draftImages) {
      counts[img.angleTag] += 1
    }
    return counts
  }, [draftImages])

  const completedMandatoryCount = React.useMemo(
    () =>
      MANDATORY_ANGLE_OPTIONS.filter((item) => angleCounts[item.tag] > 0)
        .length,
    [angleCounts]
  )

  const hasInvalidAlt = React.useMemo(
    () => draftImages.some((img) => img.alt.trim().length === 0),
    [draftImages]
  )

  const isDirty = React.useMemo(() => {
    for (const img of draftImages) {
      if (!img.id) continue
      const saved = persistedMetaById[img.id]
      if (!saved) return true
      if (
        saved.sortOrder !== img.sortOrder ||
        saved.isCover !== img.isCover ||
        saved.alt !== img.alt ||
        saved.angleTag !== img.angleTag
      ) {
        return true
      }
    }
    return false
  }, [draftImages, persistedMetaById])

  const isBusy = disabled || isSaving || isUploading || deletingImageId !== null

  const updateQueueItem = React.useCallback(
    (itemId: string, patch: Partial<UploadQueueItem>) => {
      setUploadQueue((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
      )
    },
    []
  )

  const handleFilesSelected = React.useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList)
      if (files.length === 0 || disabled || isUploading) {
        return
      }

      setErrorBanner(null)
      setStatusNotice(null)
      setIsUploading(true)

      const chosenTag = uploadAngleTag
      const queuedItems: UploadQueueItem[] = files.map((file, idx) => ({
        id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
        fileName: file.name || `foto-${idx + 1}`,
        originalSizeBytes: file.size,
        progress: 0,
        status: "queued",
        angleTag: chosenTag,
      }))

      setUploadQueue((prev) => [...queuedItems, ...prev].slice(0, 20))

      let uploadedCount = 0
      let failedCount = 0

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i]
        const queueItem = queuedItems[i]

        if (!isSupportedImageFile(file)) {
          failedCount += 1
          updateQueueItem(queueItem.id, {
            status: "error",
            progress: 0,
            error: "Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.",
          })
          continue
        }

        try {
          updateQueueItem(queueItem.id, {
            status: "compressing",
            progress: 15,
          })

          const compressed = await compressImageToWebP(file, {
            maxDimension: 1600,
            quality: 0.82,
          })

          if (compressed.blob.size > MAX_UPLOAD_BYTES) {
            throw new Error(
              `Ukuran foto (${formatByteSize(compressed.blob.size)}) masih melebihi batas 5 MB.`
            )
          }

          updateQueueItem(queueItem.id, {
            status: "uploading",
            progress: 25,
            compressedSizeBytes: compressed.blob.size,
            dimensionsLabel: `${compressed.width}×${compressed.height}`,
          })

          const currentImages = draftImagesRef.current
          const nextSortOrder =
            currentImages.reduce(
              (max, item) => Math.max(max, item.sortOrder),
              -1
            ) + 1
          const shouldBeCover =
            currentImages.length === 0 ||
            !currentImages.some((item) => item.isCover)
          const effectiveTag: ImageAngleTag =
            chosenTag === "lainnya" && currentImages.length === 0
              ? "hero"
              : chosenTag
          const defaultAlt = buildSuggestedAlt(carName, effectiveTag)

          const formData = new FormData()
          formData.append("file", compressed.blob, compressed.fileName)
          formData.append("scope", "cars")
          formData.append("carId", carId)
          formData.append("alt", defaultAlt)
          formData.append("angleTag", effectiveTag)
          formData.append("width", String(compressed.width))
          formData.append("height", String(compressed.height))
          formData.append("sortOrder", String(nextSortOrder))
          formData.append("isCover", String(shouldBeCover))

          const response = await uploadCarImageWithProgress(
            formData,
            (uploadPercent) => {
              const mappedProgress = 25 + Math.round(uploadPercent * 0.72)
              updateQueueItem(queueItem.id, {
                progress: Math.min(97, mappedProgress),
              })
            }
          )

          const newCarImage: CarImage = {
            id: response.imageId,
            carId,
            r2Key: response.r2Key,
            src: response.url,
            width: response.width,
            height: response.height,
            alt: defaultAlt,
            angleTag: effectiveTag,
            sortOrder: nextSortOrder,
            isCover: shouldBeCover,
          }

          const updatedList = [...draftImagesRef.current, newCarImage]
          if (newCarImage.id) {
            const newId = newCarImage.id
            setPersistedMetaById((prev) => ({
              ...prev,
              [newId]: {
                sortOrder: newCarImage.sortOrder,
                isCover: newCarImage.isCover,
                alt: newCarImage.alt,
                angleTag: newCarImage.angleTag,
              },
            }))
          }

          emitImages(updatedList)
          uploadedCount += 1

          updateQueueItem(queueItem.id, {
            status: "done",
            progress: 100,
            angleTag: effectiveTag,
            compressedSizeBytes: compressed.blob.size,
            dimensionsLabel: `${response.width}×${response.height}`,
          })
        } catch (err) {
          failedCount += 1
          updateQueueItem(queueItem.id, {
            status: "error",
            progress: 0,
            error: extractErrorMessage(err, "Gagal mengunggah foto."),
          })
        }
      }

      setIsUploading(false)

      if (uploadedCount > 0 && failedCount === 0) {
        setStatusNotice(
          `${uploadedCount} foto berhasil dikompresi WebP dan diunggah.`
        )
      } else if (uploadedCount > 0 && failedCount > 0) {
        setStatusNotice(`${uploadedCount} foto berhasil diunggah.`)
        setErrorBanner(
          `${failedCount} foto gagal diunggah. Lihat detail di antrean unggahan.`
        )
      } else if (failedCount > 0) {
        setErrorBanner(
          `${failedCount} foto gagal diunggah. Periksa format dan ukuran file lalu coba lagi.`
        )
      }
    },
    [
      carId,
      carName,
      disabled,
      emitImages,
      isUploading,
      updateQueueItem,
      uploadAngleTag,
    ]
  )

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selected = event.target.files
    if (selected && selected.length > 0) {
      void handleFilesSelected(selected)
    }
    event.target.value = ""
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!disabled && !isUploading) {
      setIsDragOver(true)
    }
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragOver(false)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
    if (disabled || isUploading) return
    const droppedFiles = event.dataTransfer.files
    if (droppedFiles.length > 0) {
      void handleFilesSelected(droppedFiles)
    }
  }

  const handleSetCover = (targetIndex: number) => {
    setErrorBanner(null)
    setStatusNotice(null)
    const next = draftImages.map((img, idx) => ({
      ...img,
      isCover: idx === targetIndex,
    }))
    emitImages(next)
  }

  const handleChangeAngleTag = (
    targetIndex: number,
    nextTag: ImageAngleTag
  ) => {
    setErrorBanner(null)
    setStatusNotice(null)
    const next = draftImages.map((img, idx) =>
      idx === targetIndex ? { ...img, angleTag: nextTag } : img
    )
    emitImages(next)
  }

  const handleChangeAlt = (targetIndex: number, nextAlt: string) => {
    setErrorBanner(null)
    setStatusNotice(null)
    const next = draftImages.map((img, idx) =>
      idx === targetIndex ? { ...img, alt: nextAlt } : img
    )
    emitImages(next)
  }

  const handleAutoFillAlt = (targetIndex: number) => {
    const target = draftImages[targetIndex]
    const suggested = buildSuggestedAlt(carName, target.angleTag)
    handleChangeAlt(targetIndex, suggested)
  }

  const handleMoveImage = (targetIndex: number, direction: -1 | 1) => {
    const swapIndex = targetIndex + direction
    if (swapIndex < 0 || swapIndex >= draftImages.length) {
      return
    }

    setErrorBanner(null)
    setStatusNotice(null)

    const reordered = [...draftImages]
    const temp = reordered[targetIndex]
    reordered[targetIndex] = reordered[swapIndex]
    reordered[swapIndex] = temp

    const normalized = reordered.map((img, idx) => ({
      ...img,
      sortOrder: idx,
    }))
    emitImages(normalized)
  }

  const handleResetChanges = () => {
    setErrorBanner(null)
    setStatusNotice(null)

    const restored = draftImages
      .map((img) => {
        if (!img.id) return img
        const saved = persistedMetaById[img.id]
        if (!saved) return img
        return {
          ...img,
          sortOrder: saved.sortOrder,
          isCover: saved.isCover,
          alt: saved.alt,
          angleTag: saved.angleTag,
        }
      })
      .sort((a, b) => {
        if (a.isCover !== b.isCover) {
          return a.isCover ? -1 : 1
        }
        return a.sortOrder - b.sortOrder
      })

    emitImages(restored)
  }

  const handleSaveMetadata = async () => {
    if (disabled || isSaving || isUploading || draftImages.length === 0) {
      return
    }

    setErrorBanner(null)
    setStatusNotice(null)

    if (hasInvalidAlt) {
      setErrorBanner(
        "Deskripsi foto wajib diisi pada semua foto sebelum menyimpan."
      )
      return
    }

    const persistedImages = draftImages.filter(
      (img): img is CarImage & { id: string } => Boolean(img.id)
    )
    if (persistedImages.length !== draftImages.length) {
      setErrorBanner(
        "Sebagian foto belum memiliki ID tersimpan. Muat ulang halaman lalu coba lagi."
      )
      return
    }

    setIsSaving(true)
    try {
      const savedImages = await updateCarImagesOrderAndMetaFn({
        data: {
          carId,
          images: persistedImages.map((img, idx) => ({
            id: img.id,
            sortOrder: idx,
            isCover: img.isCover,
            alt: img.alt.trim(),
            angleTag: img.angleTag,
          })),
        },
      })

      setPersistedMetaById(buildPersistedMetaMap(savedImages))
      emitImages(savedImages)
      setStatusNotice("Urutan, cover, dan metadata foto berhasil disimpan.")
    } catch (err) {
      setErrorBanner(
        extractErrorMessage(err, "Gagal menyimpan urutan dan metadata foto.")
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleConfirmDelete = async (target: CarImage) => {
    if (!target.id || disabled || deletingImageId !== null) {
      return
    }

    setErrorBanner(null)
    setStatusNotice(null)
    setDeletingImageId(target.id)

    try {
      await deleteCarImageFn({
        data: {
          id: target.id,
          carId,
        },
      })

      const remaining = draftImagesRef.current.filter(
        (img) => img.id !== target.id
      )

      let promotedId: string | null = null
      if (target.isCover && remaining.length > 0) {
        let lowest = remaining[0]
        for (const candidate of remaining) {
          if (candidate.sortOrder < lowest.sortOrder) {
            lowest = candidate
          }
        }
        promotedId = lowest.id ?? null
      }

      const nextList = promotedId
        ? remaining.map((img) => ({
            ...img,
            isCover: img.id === promotedId,
          }))
        : remaining

      setPersistedMetaById((prev) => {
        const nextMeta: Partial<Record<string, PersistedImageMeta>> = {}
        for (const [id, meta] of Object.entries(prev)) {
          if (id === target.id || !meta) continue
          nextMeta[id] =
            promotedId && id === promotedId ? { ...meta, isCover: true } : meta
        }
        return nextMeta
      })

      emitImages(nextList)
      setConfirmDeleteId(null)
      setStatusNotice("Foto berhasil dihapus dari galeri dan penyimpanan.")
    } catch (err) {
      setErrorBanner(
        extractErrorMessage(err, "Gagal menghapus foto unit mobil.")
      )
    } finally {
      setDeletingImageId(null)
    }
  }

  const handleSelectChecklistAngle = (tag: ImageAngleTag) => {
    if (disabled || isUploading) return
    setUploadAngleTag(tag)
  }

  const hasFinishedQueueItems = uploadQueue.some(
    (item) => item.status === "done" || item.status === "error"
  )

  return (
    <section aria-label="Manajemen Galeri Foto Unit" className="space-y-6">
      {/* Research Mandatory Angle Checklist */}
      <div className="border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              6 Sudut Wajib
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Pilih sudut di bawah sebelum mengunggah foto.
            </p>
          </div>
          <Badge
            variant={
              completedMandatoryCount === MANDATORY_ANGLE_OPTIONS.length
                ? "success"
                : "warning"
            }
            className="tabular-nums"
          >
            {completedMandatoryCount}/{MANDATORY_ANGLE_OPTIONS.length} Sudut
            Wajib
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {MANDATORY_ANGLE_OPTIONS.map((item) => {
            const count = angleCounts[item.tag]
            const isComplete = count > 0
            const isSelectedForUpload = uploadAngleTag === item.tag

            return (
              <button
                key={item.tag}
                type="button"
                disabled={disabled || isUploading}
                onClick={() => handleSelectChecklistAngle(item.tag)}
                aria-pressed={isSelectedForUpload}
                className={cn(
                  "flex min-h-14 flex-col justify-between border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60",
                  isComplete
                    ? "border-emerald-700/35 bg-emerald-50 text-emerald-950 hover:bg-emerald-100/70"
                    : "border-amber-700/30 bg-amber-50/60 text-amber-950 hover:bg-amber-50",
                  isSelectedForUpload && "ring-2 ring-foreground ring-offset-1"
                )}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-sm font-semibold">
                    {item.checklistLabel}
                  </span>
                  {isComplete ? (
                    <CheckCircle2
                      className="size-4 shrink-0 text-emerald-700"
                      aria-hidden
                    />
                  ) : (
                    <CircleDashed
                      className="size-4 shrink-0 text-amber-700"
                      aria-hidden
                    />
                  )}
                </div>
                <span className="mt-1 text-sm leading-tight tabular-nums opacity-85">
                  {isComplete ? `${count} foto terpasang` : "Belum ada"}
                </span>
              </button>
            )
          })}

          {OPTIONAL_MINUS_OPTION ? (
            <button
              type="button"
              disabled={disabled || isUploading}
              onClick={() => handleSelectChecklistAngle("minus")}
              aria-pressed={uploadAngleTag === "minus"}
              className={cn(
                "flex min-h-14 flex-col justify-between border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60",
                angleCounts.minus > 0
                  ? "border-emerald-700/35 bg-emerald-50 text-emerald-950 hover:bg-emerald-100/70"
                  : "border-dashed border-border bg-secondary/50 text-muted-foreground hover:bg-secondary",
                uploadAngleTag === "minus" &&
                  "ring-2 ring-foreground ring-offset-1"
              )}
            >
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  {OPTIONAL_MINUS_OPTION.checklistLabel}
                </span>
                {angleCounts.minus > 0 ? (
                  <CheckCircle2
                    className="size-4 shrink-0 text-emerald-700"
                    aria-hidden
                  />
                ) : (
                  <CircleDashed
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                )}
              </div>
              <span className="mt-1 text-sm leading-tight tabular-nums">
                {angleCounts.minus > 0
                  ? `${angleCounts.minus} foto minus`
                  : "Opsional"}
              </span>
            </button>
          ) : null}
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-foreground">
              Unggah Foto Unit
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Mendukung JPG, PNG, atau WebP, maksimal 5 MB per foto.
            </p>
          </div>

          <div className="w-full sm:w-64">
            <label
              htmlFor={`upload-angle-${carId}`}
              className="block text-sm font-semibold text-foreground"
            >
              Tag sudut untuk unggahan baru
            </label>
            <Select
              items={ANGLE_SELECT_ITEMS}
              value={uploadAngleTag}
              disabled={disabled || isUploading}
              onValueChange={(value) => {
                if (!value) return
                setUploadAngleTag(value)
              }}
            >
              <SelectTrigger
                id={`upload-angle-${carId}`}
                className="mt-1.5 min-h-11 w-full bg-card px-3 text-sm text-foreground data-[size=default]:h-11"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ANGLE_OPTIONS.map((option) => (
                  <SelectItem key={option.tag} value={option.tag}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "mt-4 flex flex-col items-center justify-center border-2 border-dashed px-4 py-8 text-center transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-input/60 bg-background hover:border-foreground/70",
            (disabled || isUploading) && "opacity-65"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            disabled={disabled || isUploading}
            onChange={handleFileInputChange}
            className="sr-only"
            aria-label="Pilih satu atau lebih foto mobil untuk diunggah"
          />

          <div className="flex size-11 items-center justify-center border border-border bg-card text-foreground">
            {isUploading ? (
              <Loader2 className="size-5 animate-spin" aria-hidden />
            ) : (
              <Upload className="size-5" aria-hidden />
            )}
          </div>

          <p className="mt-3 text-sm font-semibold text-foreground">
            {isDragOver
              ? "Lepaskan foto di sini untuk mulai kompresi & unggah"
              : "Tarik dan lepas foto di sini, atau pilih dari perangkat"}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Mendukung banyak file sekaligus · JPG, PNG, WebP · Maks 5 MB per
            foto setelah kompresi
          </p>

          <Button
            type="button"
            variant="outline"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="mt-4"
          >
            <ImagePlus className="size-4" aria-hidden />
            {isUploading ? "Sedang Mengunggah..." : "Pilih Foto Mobil"}
          </Button>
        </div>

        {/* Per-file upload progress queue */}
        {uploadQueue.length > 0 ? (
          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">
                Antrean Unggahan ({uploadQueue.length})
              </p>
              {hasFinishedQueueItems && !isUploading ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadQueue([])}
                  className="min-h-9"
                >
                  <X className="size-3.5" aria-hidden />
                  Bersihkan Riwayat
                </Button>
              ) : null}
            </div>

            <ul className="space-y-2" aria-label="Status unggah per file">
              {uploadQueue.map((item) => (
                <li
                  key={item.id}
                  className={cn(
                    "border px-3 py-2.5 text-sm",
                    item.status === "error"
                      ? "border-destructive/40 bg-destructive/5"
                      : item.status === "done"
                        ? "border-emerald-700/30 bg-emerald-50/50"
                        : "border-border bg-background"
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <TruncatedTooltip
                      content={item.fileName}
                      render={
                        <span className="truncate font-semibold text-foreground" />
                      }
                    >
                      {item.fileName}
                    </TruncatedTooltip>
                    <span className="shrink-0 text-muted-foreground tabular-nums">
                      {item.status === "queued" && "Menunggu..."}
                      {item.status === "compressing" && "Memproses..."}
                      {item.status === "uploading" &&
                        `Mengunggah (${item.progress}%)...`}
                      {item.status === "done" &&
                        `Selesai · ${formatByteSize(item.originalSizeBytes)} → ${formatByteSize(item.compressedSizeBytes ?? item.originalSizeBytes)}${item.dimensionsLabel ? ` · ${item.dimensionsLabel}` : ""}`}
                      {item.status === "error" && "Gagal"}
                    </span>
                  </div>

                  {item.status !== "error" ? (
                    <div
                      role="progressbar"
                      aria-label={`Progres unggah ${item.fileName}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={item.progress}
                      className="mt-2 h-1.5 w-full overflow-hidden bg-secondary"
                    >
                      <div
                        className={cn(
                          "h-full transition-[width] duration-150",
                          item.status === "done"
                            ? "bg-emerald-700"
                            : "bg-primary"
                        )}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  ) : (
                    <p
                      role="alert"
                      className="mt-1.5 flex items-start gap-1.5 text-[#991B1B]"
                    >
                      <AlertCircle
                        className="mt-0.5 size-3.5 shrink-0"
                        aria-hidden
                      />
                      <span>{item.error}</span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      {/* Global Alerts & Live Status */}
      {errorBanner ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-[#991B1B]"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p className="flex-1">{errorBanner}</p>
        </div>
      ) : null}

      {statusNotice ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-start gap-2.5 border border-emerald-700/35 bg-emerald-50 px-4 py-3 text-sm text-emerald-950"
        >
          <CheckCircle2
            className="mt-0.5 size-4 shrink-0 text-emerald-700"
            aria-hidden
          />
          <p className="flex-1">{statusNotice}</p>
        </div>
      ) : null}

      {/* Gallery Header & Save Controls */}
      <div className="border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="text-base font-semibold text-foreground">
              Galeri Foto ({draftImages.length})
            </h3>
            {isDirty ? (
              <Badge variant="warning">Perubahan belum disimpan</Badge>
            ) : draftImages.length > 0 ? (
              <Badge variant="secondary">Tersinkron</Badge>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isDirty ? (
              <Button
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={handleResetChanges}
              >
                <RotateCcw className="size-4" aria-hidden />
                Batalkan Perubahan
              </Button>
            ) : null}

            <Button
              type="button"
              variant="default"
              disabled={
                isBusy || !isDirty || draftImages.length === 0 || hasInvalidAlt
              }
              onClick={() => void handleSaveMetadata()}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Save className="size-4" aria-hidden />
              )}
              {isSaving ? "Menyimpan..." : "Simpan Urutan & Metadata Foto"}
            </Button>
          </div>
        </div>

        {/* Gallery Grid or Empty State */}
        {draftImages.length === 0 ? (
          <div className="mt-5 border border-dashed border-border bg-background px-6 py-10 text-center">
            <p className="text-sm font-semibold text-foreground">
              Belum ada foto untuk unit ini
            </p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
              Unggah minimal 6 sudut wajib (Hero, Eksterior, Interior, Odometer,
              Mesin, Dokumen) agar listing tampil meyakinkan di katalog publik.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {draftImages.map((img, index) => {
              const cardKey = getImageKey(img, index)
              const isDeletingThis =
                Boolean(img.id) && deletingImageId === img.id
              const isConfirmingDelete = confirmDeleteId === cardKey
              const isAltMissing = img.alt.trim().length === 0
              const angleFieldId = `car-img-angle-${cardKey}`
              const altFieldId = `car-img-alt-${cardKey}`

              return (
                <article
                  key={cardKey}
                  className={cn(
                    "flex flex-col border bg-background transition-colors",
                    img.isCover ? "border-foreground" : "border-border"
                  )}
                >
                  {/* Image Preview */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden border-b border-border bg-secondary">
                    <img
                      src={img.src}
                      alt={img.alt || `Foto unit #${index + 1}`}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute top-2 left-2 flex flex-wrap items-center gap-1.5">
                      <Badge variant="default" className="tabular-nums">
                        #{index + 1}
                      </Badge>
                      {img.isCover ? (
                        <Badge variant="primary">
                          <Star className="size-3 fill-current" aria-hidden />
                          Cover
                        </Badge>
                      ) : null}
                    </div>

                    {img.width > 0 && img.height > 0 ? (
                      <span className="absolute right-2 bottom-2 bg-foreground/85 px-2 py-0.5 text-sm font-medium text-background tabular-nums">
                        {img.width}×{img.height}
                      </span>
                    ) : null}
                  </div>

                  {/* Metadata Controls */}
                  <div className="flex flex-1 flex-col gap-3 p-3.5">
                    <div>
                      <label
                        htmlFor={angleFieldId}
                        className="block text-sm font-semibold text-foreground"
                      >
                        Sudut Foto
                      </label>
                      <Select
                        items={ANGLE_SELECT_ITEMS}
                        value={img.angleTag}
                        disabled={isBusy || isDeletingThis}
                        onValueChange={(value) => {
                          if (!value) return
                          handleChangeAngleTag(index, value)
                        }}
                      >
                        <SelectTrigger
                          id={angleFieldId}
                          className="mt-1.5 min-h-11 w-full bg-card px-3 text-sm text-foreground data-[size=default]:h-11"
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ANGLE_OPTIONS.map((option) => (
                            <SelectItem key={option.tag} value={option.tag}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label
                        htmlFor={altFieldId}
                        className="block text-sm font-semibold text-foreground"
                      >
                        Deskripsi Foto
                      </label>
                      <div className="mt-1.5 flex items-stretch gap-1.5">
                        <Input
                          id={altFieldId}
                          type="text"
                          value={img.alt}
                          disabled={isBusy || isDeletingThis}
                          aria-invalid={isAltMissing}
                          placeholder={buildSuggestedAlt(carName, img.angleTag)}
                          onChange={(event) =>
                            handleChangeAlt(index, event.target.value)
                          }
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isBusy || isDeletingThis}
                          onClick={() => handleAutoFillAlt(index)}
                          title="Isi otomatis dari nama mobil dan sudut foto"
                          aria-label={`Isi otomatis teks alternatif foto #${index + 1}`}
                        >
                          <Sparkles className="size-4" aria-hidden />
                        </Button>
                      </div>
                      {isAltMissing ? (
                        <p className="mt-1 text-sm text-[#991B1B]">
                          Deskripsi foto wajib diisi sebelum menyimpan.
                        </p>
                      ) : null}
                    </div>

                    {/* Action Row */}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
                      <Button
                        type="button"
                        variant={img.isCover ? "secondary" : "outline"}
                        disabled={isBusy || isDeletingThis || img.isCover}
                        onClick={() => handleSetCover(index)}
                        className="flex-1"
                      >
                        <Star
                          className={cn(
                            "size-4",
                            img.isCover && "fill-current text-primary"
                          )}
                          aria-hidden
                        />
                        {img.isCover ? "Cover Utama" : "Jadikan Cover"}
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isBusy || isDeletingThis || index === 0}
                          onClick={() => handleMoveImage(index, -1)}
                          title="Geser naik"
                          aria-label={`Geser naik foto #${index + 1}`}
                        >
                          <ArrowUp className="size-4" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={
                            isBusy ||
                            isDeletingThis ||
                            index === draftImages.length - 1
                          }
                          onClick={() => handleMoveImage(index, 1)}
                          title="Geser turun"
                          aria-label={`Geser turun foto #${index + 1}`}
                        >
                          <ArrowDown className="size-4" aria-hidden />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          disabled={isBusy || isDeletingThis || !img.id}
                          onClick={() =>
                            setConfirmDeleteId(
                              isConfirmingDelete ? null : cardKey
                            )
                          }
                          title="Hapus foto"
                          aria-label={`Hapus foto #${index + 1}`}
                          className="text-destructive hover:border-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      </div>
                    </div>

                    {/* Inline Delete Confirmation */}
                    {isConfirmingDelete ? (
                      <div
                        role="alertdialog"
                        aria-label={`Konfirmasi hapus foto #${index + 1}`}
                        className="border border-destructive/40 bg-destructive/5 p-3"
                      >
                        <p className="text-sm font-medium text-[#991B1B]">
                          Hapus foto ini secara permanen?
                        </p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            disabled={isDeletingThis}
                            onClick={() => void handleConfirmDelete(img)}
                            className="flex-1"
                          >
                            {isDeletingThis ? (
                              <Loader2
                                className="size-4 animate-spin"
                                aria-hidden
                              />
                            ) : (
                              <Trash2 className="size-4" aria-hidden />
                            )}
                            {isDeletingThis ? "Menghapus..." : "Ya, Hapus"}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isDeletingThis}
                            onClick={() => setConfirmDeleteId(null)}
                          >
                            Batal
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* Bottom Sticky-Friendly Save Hint when gallery has multiple rows */}
        {draftImages.length > 3 && isDirty ? (
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-sm font-medium text-amber-950">
              Ada perubahan urutan, cover, atau metadata foto yang belum
              disimpan.
            </p>
            <Button
              type="button"
              variant="default"
              disabled={isBusy || hasInvalidAlt}
              onClick={() => void handleSaveMetadata()}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Save className="size-4" aria-hidden />
              )}
              {isSaving ? "Menyimpan..." : "Simpan Urutan & Metadata Foto"}
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}
