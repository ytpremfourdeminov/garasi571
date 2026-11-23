export interface CompressImageOptions {
  maxDimension?: number
  quality?: number
}

export interface CompressedImageResult {
  blob: Blob
  width: number
  height: number
  fileName: string
}

const DEFAULT_MAX_DIMENSION = 1600
const DEFAULT_QUALITY = 0.82

interface DecodedImage {
  source: CanvasImageSource
  width: number
  height: number
  cleanup: () => void
}

function replaceExtensionWithWebp(fileName: string): string {
  const trimmed = fileName.trim()
  if (!trimmed) {
    return "image.webp"
  }

  const lastDotIndex = trimmed.lastIndexOf(".")
  if (lastDotIndex <= 0) {
    return `${trimmed}.webp`
  }

  return `${trimmed.slice(0, lastDotIndex)}.webp`
}

function normalizeMaxDimension(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 1) {
    return DEFAULT_MAX_DIMENSION
  }
  return Math.floor(value)
}

function normalizeQuality(value: number | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return DEFAULT_QUALITY
  }
  return Math.min(1, Math.max(0.1, value))
}

function calculateScaledDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } {
  const largestEdge = Math.max(width, height)
  if (largestEdge <= maxDimension) {
    return { width, height }
  }

  const scale = maxDimension / largestEdge
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  }
}

function loadWithHtmlImage(file: File): Promise<DecodedImage> {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined" || typeof URL === "undefined") {
      reject(new Error("Browser tidak mendukung pemrosesan gambar."))
      return
    }

    const objectUrl = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      const width = img.naturalWidth || img.width
      const height = img.naturalHeight || img.height
      if (width <= 0 || height <= 0) {
        URL.revokeObjectURL(objectUrl)
        reject(new Error("Dimensi gambar tidak valid."))
        return
      }

      resolve({
        source: img,
        width,
        height,
        cleanup: () => {
          URL.revokeObjectURL(objectUrl)
        },
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Gagal membaca file gambar. Pastikan file tidak rusak."))
    }

    img.src = objectUrl
  })
}

async function decodeImageFile(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file)
      if (bitmap.width > 0 && bitmap.height > 0) {
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          cleanup: () => {
            bitmap.close()
          },
        }
      }
      bitmap.close()
    } catch {
      // Fallback to HTMLImageElement decoding below.
    }
  }

  return loadWithHtmlImage(file)
}

function encodeCanvasToWebp(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob(
        (blob) => {
          resolve(blob)
        },
        "image/webp",
        quality
      )
    } catch {
      resolve(null)
    }
  })
}

/**
 * Scales an image file so its longest side fits within `maxDimension` while preserving
 * aspect ratio, and encodes it to WebP on a Canvas. If the browser cannot encode WebP,
 * returns the original file along with its measured dimensions.
 */
export async function compressImageToWebP(
  file: File,
  options?: CompressImageOptions
): Promise<CompressedImageResult> {
  const maxDimension = normalizeMaxDimension(options?.maxDimension)
  const quality = normalizeQuality(options?.quality)
  const fallbackFileName = file.name.trim() || "image"

  const decoded = await decodeImageFile(file)

  try {
    const target = calculateScaledDimensions(
      decoded.width,
      decoded.height,
      maxDimension
    )

    if (typeof document === "undefined") {
      return {
        blob: file,
        width: decoded.width,
        height: decoded.height,
        fileName: fallbackFileName,
      }
    }

    const canvas = document.createElement("canvas")
    canvas.width = target.width
    canvas.height = target.height

    const ctx = canvas.getContext("2d")
    if (!ctx) {
      return {
        blob: file,
        width: decoded.width,
        height: decoded.height,
        fileName: fallbackFileName,
      }
    }

    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = "high"
    ctx.drawImage(decoded.source, 0, 0, target.width, target.height)

    const encodedBlob = await encodeCanvasToWebp(canvas, quality)
    const isValidWebp =
      encodedBlob !== null &&
      encodedBlob.size > 0 &&
      encodedBlob.type.toLowerCase() === "image/webp"

    if (!isValidWebp) {
      return {
        blob: file,
        width: decoded.width,
        height: decoded.height,
        fileName: fallbackFileName,
      }
    }

    const wasAlreadyUnresizedWebp =
      file.type.toLowerCase() === "image/webp" &&
      target.width === decoded.width &&
      target.height === decoded.height

    if (wasAlreadyUnresizedWebp && encodedBlob.size >= file.size) {
      return {
        blob: file,
        width: decoded.width,
        height: decoded.height,
        fileName: replaceExtensionWithWebp(fallbackFileName),
      }
    }

    return {
      blob: encodedBlob,
      width: target.width,
      height: target.height,
      fileName: replaceExtensionWithWebp(fallbackFileName),
    }
  } finally {
    decoded.cleanup()
  }
}
