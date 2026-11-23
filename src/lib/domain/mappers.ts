import { getCategoryLabel } from "@/lib/domain/formatters"
import type { CarUpsertInput } from "@/lib/domain/schemas"
import type {
  CarCategory,
  CarImage,
  CarImperfection,
  CarStatus,
  CarUnit,
  CreatorInsights,
  CreditSimulation,
  DocumentChecklist,
  EvSpecs,
  FuelType,
  ImageAngleTag,
  InspectionSummary,
  PaymentMode,
  SalesContact,
  ShowroomConfig,
  ShowroomFaqItem,
  StaffProfile,
  StaffRole,
  TransmissionGroup,
} from "@/lib/domain/types"
import type { Database, Json } from "@/types/database"

type DbCarRow = Database["public"]["Tables"]["cars"]["Row"]
type DbCarInsert = Database["public"]["Tables"]["cars"]["Insert"]
type DbCarUpdate = Database["public"]["Tables"]["cars"]["Update"]
type DbCarImageRow = Database["public"]["Tables"]["car_images"]["Row"]
type DbCarCreditRow =
  Database["public"]["Tables"]["car_credit_simulations"]["Row"]
type DbShowroomSettingsRow =
  Database["public"]["Tables"]["showroom_settings"]["Row"]
type DbSalesContactRow = Database["public"]["Tables"]["sales_contacts"]["Row"]
type DbFaqRow = Database["public"]["Tables"]["showroom_faqs"]["Row"]
type DbProfileRow = Database["public"]["Tables"]["profiles"]["Row"]

const VALID_CATEGORIES = new Set<CarCategory>([
  "keluarga",
  "harian",
  "hobi-eropa",
])
const VALID_TRANSMISSION_GROUPS = new Set<TransmissionGroup>([
  "manual",
  "automatic",
])
const VALID_PAYMENT_MODES = new Set<PaymentMode>(["cash-credit", "cash-only"])
const VALID_CAR_STATUSES = new Set<CarStatus>([
  "draft",
  "ready",
  "booked",
  "sold",
  "archived",
])
const VALID_FUEL_TYPES = new Set<FuelType>([
  "bensin",
  "diesel",
  "hybrid",
  "phev",
  "ev",
])
const VALID_ANGLE_TAGS = new Set<ImageAngleTag>([
  "hero",
  "eksterior",
  "interior",
  "odometer",
  "mesin",
  "dokumen",
  "minus",
  "lainnya",
])

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function asOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined
}

function asOptionalString(value: unknown): string | null | undefined {
  if (typeof value === "string") return value
  if (value === null) return null
  return undefined
}

function asOptionalNumber(value: unknown): number | null | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (value === null) return null
  return undefined
}

function parseDocumentChecklist(raw: Json | null | undefined): DocumentChecklist {
  if (!isPlainObject(raw)) return {}
  return {
    stnk: asOptionalBoolean(raw.stnk),
    bpkb: asOptionalBoolean(raw.bpkb),
    faktur: asOptionalBoolean(raw.faktur),
    nik: asOptionalBoolean(raw.nik),
    manualBook: asOptionalBoolean(raw.manualBook),
    serviceBook: asOptionalBoolean(raw.serviceBook),
    spareKey: asOptionalBoolean(raw.spareKey),
  }
}

function parseInspectionSummary(raw: Json | null | undefined): InspectionSummary {
  if (!isPlainObject(raw)) return {}
  return {
    floodFree: asOptionalBoolean(raw.floodFree),
    majorAccidentFree: asOptionalBoolean(raw.majorAccidentFree),
    exteriorGrade: asOptionalString(raw.exteriorGrade),
    interiorGrade: asOptionalString(raw.interiorGrade),
    engineTransmissionGrade: asOptionalString(raw.engineTransmissionGrade),
    undercarriageSuspensionGrade: asOptionalString(
      raw.undercarriageSuspensionGrade,
    ),
    tireCondition: asOptionalString(raw.tireCondition),
    notes: asOptionalString(raw.notes),
  }
}

function parseImperfections(raw: Json | null | undefined): CarImperfection[] {
  if (!Array.isArray(raw)) return []
  const items: CarImperfection[] = []
  for (const entry of raw) {
    if (!isPlainObject(entry)) continue
    const area = typeof entry.area === "string" ? entry.area.trim() : ""
    const description =
      typeof entry.description === "string" ? entry.description.trim() : ""
    const severity =
      entry.severity === "moderate" ? "moderate" : ("minor" as const)
    if (area && description) {
      items.push({ area, description, severity })
    }
  }
  return items
}

function parseEvSpecs(raw: Json | null | undefined): EvSpecs | null {
  if (!isPlainObject(raw)) return null
  const specs: EvSpecs = {
    batterySohPercent: asOptionalNumber(raw.batterySohPercent),
    batteryCapacityKwh: asOptionalNumber(raw.batteryCapacityKwh),
    claimedRangeKm: asOptionalNumber(raw.claimedRangeKm),
    realRangeKm: asOptionalNumber(raw.realRangeKm),
    chargingPortType: asOptionalString(raw.chargingPortType),
    fastChargingInfo: asOptionalString(raw.fastChargingInfo),
    portableChargerIncluded: asOptionalBoolean(raw.portableChargerIncluded),
    wallChargerIncluded: asOptionalBoolean(raw.wallChargerIncluded),
    batteryWarrantyInfo: asOptionalString(raw.batteryWarrantyInfo),
    batteryWarrantyTransferable: asOptionalBoolean(
      raw.batteryWarrantyTransferable,
    ),
  }
  const hasAnyValue = Object.values(specs).some(
    (v) => v !== undefined && v !== null && v !== "",
  )
  return hasAnyValue ? specs : null
}

function parseCreatorInsights(
  raw: Json | null | undefined,
): CreatorInsights | null {
  if (!isPlainObject(raw)) return null
  const insights: CreatorInsights = {
    realWorldFuelConsumption: asOptionalString(raw.realWorldFuelConsumption),
    estimatedMaintenanceCost: asOptionalString(raw.estimatedMaintenanceCost),
    commonIssuesChecked: asOptionalString(raw.commonIssuesChecked),
    expertNotes: asOptionalString(raw.expertNotes),
  }
  const hasAnyValue = Object.values(insights).some(
    (v) => v !== undefined && v !== null && v !== "",
  )
  return hasAnyValue ? insights : null
}

export function mapDbCarImageToDomain(row: DbCarImageRow): CarImage {
  const angleTag = VALID_ANGLE_TAGS.has(row.angle_tag as ImageAngleTag)
    ? (row.angle_tag as ImageAngleTag)
    : "lainnya"
  return {
    id: row.id,
    carId: row.car_id,
    r2Key: row.r2_key,
    src: row.url,
    width: row.width,
    height: row.height,
    alt: row.alt,
    angleTag,
    sortOrder: row.sort_order,
    isCover: row.is_cover,
  }
}

export function mapDbCreditSimulationToDomain(
  row: DbCarCreditRow,
): CreditSimulation {
  return {
    id: row.id,
    label: row.label,
    provider: row.provider ?? undefined,
    dp: row.dp,
    installment: row.installment,
    installmentLabel: row.installment_label,
    tenorYears: row.tenor_years,
    note: row.note ?? undefined,
    sortOrder: row.sort_order,
  }
}

export function mapDbCarToDomain(
  carRow: DbCarRow,
  imageRows: DbCarImageRow[] = [],
  creditRows: DbCarCreditRow[] = [],
): CarUnit {
  const category = VALID_CATEGORIES.has(carRow.category as CarCategory)
    ? (carRow.category as CarCategory)
    : "harian"
  const transmissionGroup = VALID_TRANSMISSION_GROUPS.has(
    carRow.transmission_group as TransmissionGroup,
  )
    ? (carRow.transmission_group as TransmissionGroup)
    : "automatic"
  const paymentMode = VALID_PAYMENT_MODES.has(carRow.payment_mode as PaymentMode)
    ? (carRow.payment_mode as PaymentMode)
    : "cash-only"
  const status = VALID_CAR_STATUSES.has(carRow.status as CarStatus)
    ? (carRow.status as CarStatus)
    : "draft"
  const fuelType = VALID_FUEL_TYPES.has(carRow.fuel_type as FuelType)
    ? (carRow.fuel_type as FuelType)
    : "bensin"

  const sortedImages = [...imageRows]
    .sort((a, b) => {
      if (a.is_cover !== b.is_cover) {
        return a.is_cover ? -1 : 1
      }
      return a.sort_order - b.sort_order
    })
    .map(mapDbCarImageToDomain)

  const sortedCredits = [...creditRows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(mapDbCreditSimulationToDomain)

  return {
    id: carRow.id,
    slug: carRow.slug,
    status,
    isFeatured: carRow.is_featured,
    featuredOrder: carRow.featured_order,
    sortOrder: carRow.sort_order,
    brand: carRow.brand,
    name: carRow.name,
    shortName: carRow.short_name,
    year: carRow.year,
    yearSort: carRow.year_sort,
    category,
    categoryLabel: carRow.category_label || getCategoryLabel(category),
    bodyType: carRow.body_type,
    seatCapacity: carRow.seat_capacity,
    color: carRow.color,
    interiorColor: carRow.interior_color,
    transmission: carRow.transmission,
    transmissionGroup,
    fuelType,
    engineCc: carRow.engine_cc,
    drivetrain: carRow.drivetrain,
    mileageKm: carRow.mileage_km,
    mileageLabel: carRow.mileage_label,
    mileageVerified: carRow.mileage_verified,
    mileageVerificationSource: carRow.mileage_verification_source,
    location: carRow.location,
    cashPrice: carRow.cash_price,
    creditPrice: carRow.credit_price,
    creditPriceNote: carRow.credit_price_note ?? undefined,
    paymentMode,
    offerBadge: carRow.offer_badge,
    tradeInAvailable: carRow.trade_in_available,
    plateInfo: carRow.plate_info,
    plateAreaCode: carRow.plate_area_code,
    plateOddEven: carRow.plate_odd_even,
    taxStatus: carRow.tax_status,
    taxExpiryDate: carRow.tax_expiry_date,
    stnk5yrExpiryDate: carRow.stnk_5yr_expiry_date,
    estimatedAnnualTax: carRow.estimated_annual_tax,
    ownershipType: carRow.ownership_type,
    ownershipHand: carRow.ownership_hand,
    stnkBlockFree: carRow.stnk_block_free,
    vinEngineMatched: carRow.vin_engine_matched,
    usageHistory: carRow.usage_history,
    documentChecklist: parseDocumentChecklist(carRow.document_checklist),
    inspectionSummary: parseInspectionSummary(carRow.inspection_summary),
    imperfections: parseImperfections(carRow.imperfections),
    recentMaintenance: carRow.recent_maintenance,
    warrantyInfo: carRow.warranty_info,
    mechanicCheckAllowed: carRow.mechanic_check_allowed,
    evSpecs: parseEvSpecs(carRow.ev_specs),
    videoWalkaroundUrl: carRow.video_walkaround_url,
    creatorInsights: parseCreatorInsights(carRow.creator_insights),
    highlights: carRow.highlights,
    conditions: carRow.conditions,
    creditSimulations: sortedCredits,
    images: sortedImages,
    createdAt: carRow.created_at,
    updatedAt: carRow.updated_at,
  }
}

export function mapDomainCarToDbInsert(
  input: CarUpsertInput,
  createdBy?: string | null,
): DbCarInsert {
  const categoryLabel =
    input.categoryLabel?.trim() || getCategoryLabel(input.category)

  return {
    ...(input.id ? { id: input.id } : {}),
    slug: input.slug,
    status: input.status,
    is_featured: input.isFeatured,
    featured_order: input.featuredOrder ?? null,
    sort_order: input.sortOrder,
    brand: input.brand,
    name: input.name,
    short_name: input.shortName,
    year: input.year,
    year_sort: input.yearSort,
    category: input.category,
    category_label: categoryLabel,
    body_type: input.bodyType || null,
    seat_capacity: input.seatCapacity ?? null,
    color: input.color,
    interior_color: input.interiorColor || null,
    transmission: input.transmission,
    transmission_group: input.transmissionGroup,
    fuel_type: input.fuelType,
    engine_cc: input.engineCc ?? null,
    drivetrain: input.drivetrain || null,
    mileage_km: input.mileageKm ?? null,
    mileage_label: input.mileageLabel,
    mileage_verified: input.mileageVerified,
    mileage_verification_source: input.mileageVerificationSource || null,
    location: input.location,
    cash_price: input.cashPrice,
    credit_price:
      input.paymentMode === "cash-credit"
        ? (input.creditPrice ?? null)
        : null,
    credit_price_note: input.creditPriceNote || null,
    payment_mode: input.paymentMode,
    offer_badge: input.offerBadge || null,
    trade_in_available: input.tradeInAvailable,
    plate_info: input.plateInfo,
    plate_area_code: input.plateAreaCode || null,
    plate_odd_even: input.plateOddEven || null,
    tax_status: input.taxStatus || null,
    tax_expiry_date: input.taxExpiryDate || null,
    stnk_5yr_expiry_date: input.stnk5yrExpiryDate || null,
    estimated_annual_tax: input.estimatedAnnualTax ?? null,
    ownership_type: input.ownershipType || null,
    ownership_hand: input.ownershipHand ?? null,
    stnk_block_free: input.stnkBlockFree,
    vin_engine_matched: input.vinEngineMatched,
    usage_history: input.usageHistory || null,
    document_checklist: input.documentChecklist,
    inspection_summary: input.inspectionSummary,
    imperfections: input.imperfections,
    recent_maintenance: input.recentMaintenance,
    warranty_info: input.warrantyInfo || null,
    mechanic_check_allowed: input.mechanicCheckAllowed,
    ev_specs: input.evSpecs ?? null,
    video_walkaround_url: input.videoWalkaroundUrl || null,
    creator_insights: input.creatorInsights ?? null,
    highlights: input.highlights,
    conditions: input.conditions,
    ...(createdBy !== undefined ? { created_by: createdBy } : {}),
  }
}

export function mapDomainCarToDbUpdate(input: CarUpsertInput): DbCarUpdate {
  const insertPayload = mapDomainCarToDbInsert(input)
  const { id: _id, created_by: _createdBy, ...updatePayload } = insertPayload
  return updatePayload
}

export function mapDbSalesContactToDomain(row: DbSalesContactRow): SalesContact {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    role: row.role,
    phoneDisplay: row.phone_display,
    phoneE164: row.phone_e164,
    isActive: row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapDbShowroomToDomain(
  settingsRow: DbShowroomSettingsRow,
  salesRows: DbSalesContactRow[] = [],
): ShowroomConfig {
  const sortedSales = [...salesRows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(mapDbSalesContactToDomain)

  return {
    id: settingsRow.id,
    name: settingsRow.name,
    city: settingsRow.city,
    address: settingsRow.address,
    hours: settingsRow.hours,
    mapsUrl: settingsRow.maps_url,
    mapsEmbedUrl: settingsRow.maps_embed_url,
    instagramHandle: settingsRow.instagram_handle,
    instagramUrl: settingsRow.instagram_url,
    logoSrc: settingsRow.logo_url,
    logoUrl: settingsRow.logo_url,
    sales: sortedSales,
    updatedAt: settingsRow.updated_at,
  }
}

export function mapDbFaqToDomain(faqRow: DbFaqRow): ShowroomFaqItem {
  return {
    id: faqRow.id,
    slug: faqRow.slug,
    question: faqRow.question,
    answer: faqRow.answer,
    isPublished: faqRow.is_published,
    sortOrder: faqRow.sort_order,
    createdAt: faqRow.created_at,
    updatedAt: faqRow.updated_at,
  }
}

export function mapDbProfileToDomain(profileRow: DbProfileRow): StaffProfile {
  const role: StaffRole = profileRow.role === "admin" ? "admin" : "sales"
  return {
    id: profileRow.id,
    email: profileRow.email,
    fullName: profileRow.full_name,
    role,
    isActive: profileRow.is_active,
    createdAt: profileRow.created_at,
    updatedAt: profileRow.updated_at,
  }
}
