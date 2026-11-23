export type CarCategory = "keluarga" | "harian" | "hobi-eropa"
export type TransmissionGroup = "manual" | "automatic"
export type PaymentMode = "cash-credit" | "cash-only"
export type BudgetBand = "all" | "under-120" | "120-200" | "over-200"
export type SortOption = "harga-terendah" | "harga-tertinggi" | "tahun-terbaru"
export type CarStatus = "draft" | "ready" | "booked" | "sold" | "archived"
export type FuelType = "bensin" | "diesel" | "hybrid" | "phev" | "ev"
export type ImageAngleTag =
  | "hero"
  | "eksterior"
  | "interior"
  | "odometer"
  | "mesin"
  | "dokumen"
  | "minus"
  | "lainnya"
export type StaffRole = "admin" | "sales"

export type CompletenessTabKey =
  | "identity"
  | "pricing"
  | "legality"
  | "media"
  | "insights"

export type ImperfectionSeverity = "minor" | "moderate"

export interface DocumentChecklist {
  stnk?: boolean
  bpkb?: boolean
  faktur?: boolean
  nik?: boolean
  manualBook?: boolean
  serviceBook?: boolean
  spareKey?: boolean
}

export interface InspectionSummary {
  floodFree?: boolean
  majorAccidentFree?: boolean
  exteriorGrade?: string | null
  interiorGrade?: string | null
  engineTransmissionGrade?: string | null
  undercarriageSuspensionGrade?: string | null
  tireCondition?: string | null
  notes?: string | null
}

export interface CarImperfection {
  area: string
  description: string
  severity: ImperfectionSeverity
}

export interface EvSpecs {
  batterySohPercent?: number | null
  batteryCapacityKwh?: number | null
  claimedRangeKm?: number | null
  realRangeKm?: number | null
  chargingPortType?: string | null
  fastChargingInfo?: string | null
  portableChargerIncluded?: boolean
  wallChargerIncluded?: boolean
  batteryWarrantyInfo?: string | null
  batteryWarrantyTransferable?: boolean
}

export interface CreatorInsights {
  realWorldFuelConsumption?: string | null
  estimatedMaintenanceCost?: string | null
  commonIssuesChecked?: string | null
  expertNotes?: string | null
}

export interface CarImage {
  id?: string
  carId?: string
  r2Key?: string
  src: string
  width: number
  height: number
  alt: string
  angleTag: ImageAngleTag
  sortOrder: number
  isCover: boolean
}

export interface CreditSimulation {
  id?: string
  label: string
  provider?: string
  dp: number
  installment: number | null
  installmentLabel: string
  tenorYears: number
  note?: string
  sortOrder?: number
}

export interface CarUnit {
  id: string
  slug: string
  status: CarStatus
  isFeatured: boolean
  featuredOrder: number | null
  sortOrder: number
  brand: string
  name: string
  shortName: string
  year: string
  yearSort: number
  category: CarCategory
  categoryLabel: string
  bodyType: string | null
  seatCapacity: number | null
  color: string
  interiorColor: string | null
  transmission: string
  transmissionGroup: TransmissionGroup
  fuelType: FuelType
  engineCc: number | null
  drivetrain: string | null
  mileageKm: number | null
  mileageLabel: string
  mileageVerified: boolean
  mileageVerificationSource: string | null
  location: string
  cashPrice: number
  creditPrice: number | null
  creditPriceNote?: string
  paymentMode: PaymentMode
  offerBadge: string | null
  tradeInAvailable: boolean
  plateInfo: string
  plateAreaCode: string | null
  plateOddEven: string | null
  taxStatus: string | null
  taxExpiryDate: string | null
  stnk5yrExpiryDate: string | null
  estimatedAnnualTax: number | null
  ownershipType: string | null
  ownershipHand: number | null
  stnkBlockFree: boolean
  vinEngineMatched: boolean
  usageHistory: string | null
  documentChecklist: DocumentChecklist
  inspectionSummary: InspectionSummary
  imperfections: CarImperfection[]
  recentMaintenance: string[]
  warrantyInfo: string | null
  mechanicCheckAllowed: boolean
  evSpecs: EvSpecs | null
  videoWalkaroundUrl: string | null
  creatorInsights: CreatorInsights | null
  highlights: string[]
  conditions: string[]
  creditSimulations: CreditSimulation[]
  images: CarImage[]
  createdAt?: string
  updatedAt?: string
}

export interface CatalogFilterState {
  q?: string
  kategori?: "all" | CarCategory
  budget?: BudgetBand
  transmisi?: "all" | TransmissionGroup
  bayar?: "all" | PaymentMode
  urut?: SortOption
}

export interface SalesContact {
  id: string
  slug: string
  name: string
  role: string
  phoneDisplay: string
  phoneE164: string
  isActive: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface ShowroomConfig {
  id?: number
  name: string
  city: string
  address: string
  hours: string
  mapsUrl: string
  mapsEmbedUrl: string
  instagramHandle: string
  instagramUrl: string
  logoSrc: string
  logoUrl: string
  sales: SalesContact[]
  updatedAt?: string
}

export interface ShowroomFaqItem {
  id: string
  slug: string
  question: string
  answer: string
  isPublished: boolean
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface StaffProfile {
  id: string
  email: string
  fullName: string
  role: StaffRole
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CompletenessDimension {
  key:
    | "identity_specs"
    | "pricing_credit"
    | "odometer_condition"
    | "legality_tax"
    | "inspection_transparency"
    | "visual_angles"
  label: string
  weight: number
  earnedWeight: number
  percentage: number
  completedCount: number
  totalCount: number
  missingItems: string[]
  missingItemTargets?: Array<{
    label: string
    targetId?: string
  }>
  targetTab: CompletenessTabKey
}

export interface CompletenessResult {
  score: number
  dimensions: CompletenessDimension[]
  missingItems: Array<{
    label: string
    targetId?: string
    dimensionKey: CompletenessDimension["key"]
    targetTab: CompletenessTabKey
  }>
  suggestedTab: CompletenessTabKey
}
