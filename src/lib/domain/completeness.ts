import type {
  CarImage,
  CarUnit,
  CompletenessDimension,
  CompletenessResult,
  CompletenessTabKey,
  CreditSimulation,
  DocumentChecklist,
  ImageAngleTag,
  InspectionSummary,
} from "@/lib/domain/types"

export interface CompletenessInput {
  brand?: string | null
  name?: string | null
  shortName?: string | null
  year?: string | null
  category?: string | null
  bodyType?: string | null
  seatCapacity?: number | null
  color?: string | null
  transmission?: string | null
  fuelType?: string | null
  engineCc?: number | null
  cashPrice?: number | null
  creditPrice?: number | null
  creditPriceNote?: string | null
  paymentMode?: "cash-credit" | "cash-only" | string | null
  creditSimulations?: CreditSimulation[] | null
  mileageKm?: number | null
  mileageLabel?: string | null
  mileageVerified?: boolean | null
  mileageVerificationSource?: string | null
  highlights?: string[] | null
  conditions?: string[] | null
  plateInfo?: string | null
  plateAreaCode?: string | null
  taxStatus?: string | null
  taxExpiryDate?: string | null
  stnk5yrExpiryDate?: string | null
  estimatedAnnualTax?: number | null
  ownershipType?: string | null
  ownershipHand?: number | null
  documentChecklist?: DocumentChecklist | null
  inspectionSummary?: InspectionSummary | null
  warrantyInfo?: string | null
  recentMaintenance?: string[] | null
  images?: Array<Pick<CarImage, "angleTag"> & Partial<CarImage>> | null
}

function hasText(val: string | null | undefined): boolean {
  return typeof val === "string" && val.trim().length > 0
}

function hasPositiveNumber(val: number | null | undefined): boolean {
  return typeof val === "number" && Number.isFinite(val) && val > 0
}

interface CheckItem {
  label: string
  passed: boolean
  targetId?: string
}

function buildDimension(
  key: CompletenessDimension["key"],
  label: string,
  weight: number,
  targetTab: CompletenessTabKey,
  checks: CheckItem[],
): CompletenessDimension {
  const totalCount = checks.length
  const completedCount = checks.filter((c) => c.passed).length
  const ratio = totalCount > 0 ? completedCount / totalCount : 1
  const earnedWeight = Math.round(weight * ratio * 10) / 10
  const percentage = Math.round(ratio * 100)
  const failedChecks = checks.filter((c) => !c.passed)
  const missingItems = failedChecks.map((c) => c.label)
  const missingItemTargets = failedChecks.map((c) => ({
    label: c.label,
    targetId: c.targetId,
  }))

  return {
    key,
    label,
    weight,
    earnedWeight,
    percentage,
    completedCount,
    totalCount,
    missingItems,
    missingItemTargets,
    targetTab,
  }
}

export const REQUIRED_VISUAL_ANGLE_TAGS: Array<{
  tag: ImageAngleTag
  label: string
}> = [
  { tag: "hero", label: "Foto Utama (Hero serong depan)" },
  { tag: "eksterior", label: "Foto Eksterior 4 sisi" },
  { tag: "interior", label: "Foto Interior & kabin" },
  { tag: "odometer", label: "Foto Panel Instrumen & Odometer" },
  { tag: "mesin", label: "Foto Ruang Mesin" },
  { tag: "dokumen", label: "Foto Kelengkapan Dokumen / Kunci Serep" },
]

export function computeCarCompleteness(
  car: CompletenessInput | CarUnit,
): CompletenessResult {
  const isEv = car.fuelType === "ev"

  // 1. Identitas & Spek (20%) -> tab "identity"
  const identityChecks: CheckItem[] = [
    {
      label: "Merek, nama lengkap, dan nama singkat unit",
      passed:
        hasText(car.brand) && hasText(car.name) && hasText(car.shortName),
      targetId: !hasText(car.brand)
        ? "car-brand"
        : !hasText(car.name)
          ? "car-name"
          : "car-short-name",
    },
    {
      label: "Tahun perakitan & kategori katalog",
      passed: hasText(car.year) && hasText(car.category),
      targetId: !hasText(car.year) ? "car-year" : "car-category",
    },
    {
      label: "Warna eksterior & detail transmisi",
      passed: hasText(car.color) && hasText(car.transmission),
      targetId: !hasText(car.color) ? "car-color" : "car-transmission",
    },
    {
      label: "Tipe bodi & kapasitas kursi penumpang",
      passed: hasText(car.bodyType) && hasPositiveNumber(car.seatCapacity),
      targetId: !hasText(car.bodyType)
        ? "car-body-type"
        : "car-seat-capacity",
    },
    {
      label: isEv
        ? "Jenis penggerak listrik (EV)"
        : "Jenis BBM & kapasitas mesin (CC)",
      passed: isEv
        ? hasText(car.fuelType)
        : hasText(car.fuelType) && hasPositiveNumber(car.engineCc),
      targetId: !hasText(car.fuelType) ? "car-fuel-type" : "car-engine-cc",
    },
  ]

  // 2. Harga & Skema (15%) -> tab "pricing"
  const isCashCredit = car.paymentMode === "cash-credit"
  const pricingChecks: CheckItem[] = [
    {
      label: "Harga cash utama (> Rp0)",
      passed: hasPositiveNumber(car.cashPrice),
      targetId: "pricing-cash-price",
    },
    {
      label: "Mode pembayaran (Cash & Kredit / Cash Only)",
      passed:
        car.paymentMode === "cash-credit" || car.paymentMode === "cash-only",
      targetId: "pricing-payment-mode",
    },
    ...(isCashCredit
      ? [
          {
            label: "Harga khusus kredit",
            passed: hasPositiveNumber(car.creditPrice),
            targetId: "pricing-credit-price",
          },
          {
            label: "Minimal 1 paket simulasi kredit (DP, angsuran, tenor)",
            passed:
              Array.isArray(car.creditSimulations) &&
              car.creditSimulations.length > 0,
            targetId: "pricing-simulations",
          },
        ]
      : [
          {
            label: "Catatan harga khusus tunai (opsional/terkonfirmasi)",
            passed:
              hasPositiveNumber(car.cashPrice) &&
              (hasText(car.creditPriceNote) || car.paymentMode === "cash-only"),
            targetId: "pricing-cash-note",
          },
        ]),
  ]

  // 3. Odometer & Kondisi (15%) -> tab "identity"
  const odometerChecks: CheckItem[] = [
    {
      label: "Angka odometer (KM) & label tampilan KM",
      passed: hasPositiveNumber(car.mileageKm) && hasText(car.mileageLabel),
      targetId: !hasPositiveNumber(car.mileageKm)
        ? "car-mileage-km"
        : "car-mileage-label",
    },
    {
      label: "Status verifikasi odometer & sumber verifikasi",
      passed:
        Boolean(car.mileageVerified) ||
        hasText(car.mileageVerificationSource),
      targetId: "car-mileage-verified",
    },
    {
      label: "Daftar highlight keunggulan utama (minimal 3 poin)",
      passed: Array.isArray(car.highlights) && car.highlights.length >= 3,
      targetId: "car-highlights-new",
    },
    {
      label: "Daftar detail kondisi fisik & fitur (minimal 4 poin)",
      passed: Array.isArray(car.conditions) && car.conditions.length >= 4,
      targetId: "car-conditions-new",
    },
  ]

  // 4. Legalitas & Pajak (20%) -> tab "legality"
  const docs = car.documentChecklist ?? {}
  const coreDocsComplete = Boolean(docs.stnk && docs.bpkb && docs.faktur)
  const extraDocsCount = [
    docs.nik,
    docs.manualBook,
    docs.serviceBook,
    docs.spareKey,
  ].filter(Boolean).length

  const legalityChecks: CheckItem[] = [
    {
      label: "Ringkasan plat & kode wilayah plat",
      passed: hasText(car.plateInfo) && hasText(car.plateAreaCode),
      targetId: !hasText(car.plateInfo)
        ? "legality-plate-info"
        : "legality-plate-area",
    },
    {
      label: "Status pajak & jatuh tempo pajak/STNK",
      passed:
        hasText(car.taxStatus) &&
        (hasText(car.taxExpiryDate) || hasText(car.stnk5yrExpiryDate)),
      targetId: !hasText(car.taxStatus)
        ? "legality-tax-status"
        : "legality-tax-expiry",
    },
    {
      label: "Estimasi pajak tahunan (PKB)",
      passed: hasPositiveNumber(car.estimatedAnnualTax),
      targetId: "legality-annual-tax",
    },
    {
      label: "Status kepemilikan (Perorangan/PT & tangan ke-berapa)",
      passed:
        hasText(car.ownershipType) && hasPositiveNumber(car.ownershipHand),
      targetId: !hasText(car.ownershipType)
        ? "legality-ownership-type"
        : "legality-ownership-hand",
    },
    {
      label: "Checklist dokumen utama (STNK, BPKB, Faktur + kelengkapan)",
      passed: coreDocsComplete && extraDocsCount >= 1,
      targetId: "legality-documents",
    },
  ]

  // 5. Inspeksi & Transparansi (15%) -> tab "legality"
  const inspection = car.inspectionSummary ?? {}
  const hasSectorGrades =
    hasText(inspection.exteriorGrade) &&
    hasText(inspection.interiorGrade) &&
    hasText(inspection.engineTransmissionGrade)

  const inspectionChecks: CheckItem[] = [
    {
      label: "Jaminan tegas Bebas Banjir & Bebas Tabrak Besar",
      passed:
        inspection.floodFree === true &&
        inspection.majorAccidentFree === true,
      targetId: "legality-trust-switches",
    },
    {
      label: "Penilaian kondisi Eksterior, Interior & Mesin/Transmisi",
      passed: hasSectorGrades,
      targetId: "legality-grades",
    },
    {
      label: "Kondisi kaki-kaki/kolong & ketebalan ban",
      passed:
        hasText(inspection.undercarriageSuspensionGrade) ||
        hasText(inspection.tireCondition),
      targetId: !hasText(inspection.undercarriageSuspensionGrade)
        ? "legality-undercarriage-grade"
        : "legality-tire-condition",
    },
    {
      label: "Informasi garansi showroom / riwayat peremajaan part",
      passed:
        hasText(car.warrantyInfo) ||
        (Array.isArray(car.recentMaintenance) &&
          car.recentMaintenance.length > 0),
      targetId: "legality-warranty",
    },
  ]

  // 6. Visual Sudut Wajib (15%) -> tab "media"
  const presentAngles = new Set<ImageAngleTag>()
  for (const img of car.images ?? []) {
    presentAngles.add(img.angleTag)
  }

  const visualChecks: CheckItem[] = REQUIRED_VISUAL_ANGLE_TAGS.map(
    ({ tag, label }) => ({
      label,
      passed: presentAngles.has(tag),
      targetId: "media-gallery",
    }),
  )

  const dimensions: CompletenessDimension[] = [
    buildDimension(
      "identity_specs",
      "Identitas & Spek",
      20,
      "identity",
      identityChecks,
    ),
    buildDimension(
      "pricing_credit",
      "Harga & Skema",
      15,
      "pricing",
      pricingChecks,
    ),
    buildDimension(
      "odometer_condition",
      "Odometer & Kondisi",
      15,
      "identity",
      odometerChecks,
    ),
    buildDimension(
      "legality_tax",
      "Legalitas & Pajak",
      20,
      "legality",
      legalityChecks,
    ),
    buildDimension(
      "inspection_transparency",
      "Inspeksi & Transparansi",
      15,
      "legality",
      inspectionChecks,
    ),
    buildDimension(
      "visual_angles",
      "Visual Sudut Wajib",
      15,
      "media",
      visualChecks,
    ),
  ]

  const rawScore = dimensions.reduce((sum, dim) => sum + dim.earnedWeight, 0)
  const score = Math.min(100, Math.max(0, Math.round(rawScore)))

  const missingItems = dimensions.flatMap((dim) =>
    (dim.missingItemTargets ??
      dim.missingItems.map((label) => ({ label, targetId: undefined }))).map(
      (item) => ({
        label: item.label,
        targetId: item.targetId,
        dimensionKey: dim.key,
        targetTab: dim.targetTab,
      }),
    ),
  )

  const firstIncompleteDimension = dimensions.find(
    (dim) => dim.missingItems.length > 0,
  )
  const suggestedTab: CompletenessTabKey =
    firstIncompleteDimension?.targetTab ?? "identity"

  return {
    score,
    dimensions,
    missingItems,
    suggestedTab,
  }
}
