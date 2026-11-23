import { z } from "zod"

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const optionalUrlOrPathSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true
      if (val.startsWith("/")) return true
      try {
        const parsed = new URL(val)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
      } catch {
        return false
      }
    },
    { message: "Format URL tidak valid (gunakan diawali https:// atau /)" },
  )

const optionalHttpUrlSchema = z
  .string()
  .trim()
  .refine(
    (val) => {
      if (!val) return true
      try {
        const parsed = new URL(val)
        return parsed.protocol === "http:" || parsed.protocol === "https:"
      } catch {
        return false
      }
    },
    { message: "Format URL tidak valid (gunakan diawali https://)" },
  )

export const carCategorySchema = z.enum(["keluarga", "harian", "hobi-eropa"], {
  error: "Pilih kategori unit yang valid",
})

export const transmissionGroupSchema = z.enum(["manual", "automatic"], {
  error: "Pilih kelompok transmisi (manual atau automatic)",
})

export const paymentModeSchema = z.enum(["cash-credit", "cash-only"], {
  error: "Pilih skema pembayaran (cash-credit atau cash-only)",
})

export const carStatusSchema = z.enum(
  ["draft", "ready", "booked", "sold", "archived"],
  {
    error: "Status unit tidak valid",
  },
)

export const fuelTypeSchema = z.enum(
  ["bensin", "diesel", "hybrid", "phev", "ev"],
  {
    error: "Jenis bahan bakar tidak valid",
  },
)

export const imageAngleTagSchema = z.enum(
  [
    "hero",
    "eksterior",
    "interior",
    "odometer",
    "mesin",
    "dokumen",
    "minus",
    "lainnya",
  ],
  {
    error: "Tag sudut foto tidak valid",
  },
)

export const staffRoleSchema = z.enum(["admin", "sales"], {
  error: "Peran staff harus admin atau sales",
})

export const documentChecklistSchema = z.object({
  stnk: z.boolean().optional(),
  bpkb: z.boolean().optional(),
  faktur: z.boolean().optional(),
  nik: z.boolean().optional(),
  manualBook: z.boolean().optional(),
  serviceBook: z.boolean().optional(),
  spareKey: z.boolean().optional(),
})

export const inspectionSummarySchema = z.object({
  floodFree: z.boolean().optional(),
  majorAccidentFree: z.boolean().optional(),
  exteriorGrade: z.string().trim().nullable().optional(),
  interiorGrade: z.string().trim().nullable().optional(),
  engineTransmissionGrade: z.string().trim().nullable().optional(),
  undercarriageSuspensionGrade: z.string().trim().nullable().optional(),
  tireCondition: z.string().trim().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
})

export const carImperfectionSchema = z.object({
  area: z.string().trim().min(1, "Bagian minus wajib diisi"),
  description: z.string().trim().min(1, "Deskripsi minus wajib diisi"),
  severity: z.enum(["minor", "moderate"], {
    error: "Tingkat minus harus minor atau moderate",
  }),
})

export const evSpecsSchema = z.object({
  batterySohPercent: z
    .number()
    .min(0, "SOH baterai minimal 0%")
    .max(100, "SOH baterai maksimal 100%")
    .nullable()
    .optional(),
  batteryCapacityKwh: z
    .number()
    .nonnegative("Kapasitas baterai tidak boleh negatif")
    .nullable()
    .optional(),
  claimedRangeKm: z
    .number()
    .int()
    .nonnegative("Jarak tempuh klaim tidak boleh negatif")
    .nullable()
    .optional(),
  realRangeKm: z
    .number()
    .int()
    .nonnegative("Jarak tempuh riil tidak boleh negatif")
    .nullable()
    .optional(),
  chargingPortType: z.string().trim().nullable().optional(),
  fastChargingInfo: z.string().trim().nullable().optional(),
  portableChargerIncluded: z.boolean().optional(),
  wallChargerIncluded: z.boolean().optional(),
  batteryWarrantyInfo: z.string().trim().nullable().optional(),
  batteryWarrantyTransferable: z.boolean().optional(),
})

export const creatorInsightsSchema = z.object({
  realWorldFuelConsumption: z.string().trim().nullable().optional(),
  estimatedMaintenanceCost: z.string().trim().nullable().optional(),
  commonIssuesChecked: z.string().trim().nullable().optional(),
  expertNotes: z.string().trim().nullable().optional(),
})

export const creditSimulationInputSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().min(1, "Nama paket simulasi wajib diisi"),
  provider: z.string().trim().optional(),
  dp: z
    .number({ error: "Nominal DP harus berupa angka" })
    .int("Nominal DP harus bilangan bulat")
    .nonnegative("Nominal DP tidak boleh negatif"),
  installment: z
    .number({ error: "Angsuran harus berupa angka" })
    .int("Angsuran harus bilangan bulat")
    .nonnegative("Angsuran tidak boleh negatif")
    .nullable(),
  installmentLabel: z
    .string()
    .trim()
    .min(1, "Label angsuran wajib diisi (contoh: Rp2.500.000)"),
  tenorYears: z
    .number({ error: "Tenor harus berupa angka tahun" })
    .int("Tenor harus bilangan bulat")
    .min(1, "Tenor minimal 1 tahun")
    .max(10, "Tenor maksimal 10 tahun"),
  note: z.string().trim().optional(),
  sortOrder: z.number().int().nonnegative().optional(),
})

export const creditSimulationSchema = creditSimulationInputSchema

export const carImageMetaSchema = z.object({
  id: z.string().uuid().optional(),
  carId: z.string().uuid().optional(),
  r2Key: z.string().trim().min(1, "R2 key foto wajib diisi").optional(),
  src: z.string().trim().min(1, "URL foto wajib diisi"),
  width: z.number().int().positive("Lebar foto harus lebih dari 0").default(1280),
  height: z
    .number()
    .int()
    .positive("Tinggi foto harus lebih dari 0")
    .default(1280),
  alt: z.string().trim().min(3, "Teks alternatif (alt) minimal 3 karakter"),
  angleTag: imageAngleTagSchema.default("lainnya"),
  sortOrder: z.number().int().nonnegative().default(0),
  isCover: z.boolean().default(false),
})

const optionalSlugSchema = z
  .string()
  .trim()
  .refine(
    (val) => val.length === 0 || slugRegex.test(val),
    "Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (-)"
  )
  .default("")

export const carUpsertSchema = z
  .object({
    id: z.string().uuid().optional(),
    slug: optionalSlugSchema,
    status: carStatusSchema.default("draft"),
    isFeatured: z.boolean().default(false),
    featuredOrder: z.number().int().min(1).max(10).nullable().optional(),
    sortOrder: z.number().int().default(0),
    brand: z.string().trim().min(1, "Merek mobil wajib diisi"),
    name: z.string().trim().min(2, "Nama lengkap mobil wajib diisi"),
    shortName: z.string().trim().min(2, "Nama singkat mobil wajib diisi"),
    year: z.string().trim().min(4, "Tahun mobil wajib diisi"),
    yearSort: z
      .number({ error: "Tahun urut harus berupa angka 4 digit" })
      .int()
      .min(1950, "Tahun tidak valid (minimal 1950)")
      .max(2100, "Tahun tidak valid"),
    category: carCategorySchema,
    categoryLabel: z.string().trim().optional(),
    bodyType: z.string().trim().nullable().optional(),
    seatCapacity: z
      .number()
      .int()
      .min(1, "Kapasitas kursi minimal 1")
      .max(20, "Kapasitas kursi maksimal 20")
      .nullable()
      .optional(),
    color: z.string().trim().min(1, "Warna eksterior wajib diisi"),
    interiorColor: z.string().trim().nullable().optional(),
    transmission: z.string().trim().min(1, "Detail transmisi wajib diisi"),
    transmissionGroup: transmissionGroupSchema,
    fuelType: fuelTypeSchema.default("bensin"),
    engineCc: z
      .number()
      .int()
      .nonnegative("Kapasitas mesin (CC) tidak boleh negatif")
      .nullable()
      .optional(),
    drivetrain: z.string().trim().nullable().optional(),
    mileageKm: z
      .number()
      .int()
      .nonnegative("Angka odometer (KM) tidak boleh negatif")
      .nullable()
      .optional(),
    mileageLabel: z.string().trim().min(1, "Label odometer wajib diisi"),
    mileageVerified: z.boolean().default(false),
    mileageVerificationSource: z.string().trim().nullable().optional(),
    location: z
      .string()
      .trim()
      .min(2, "Lokasi unit wajib diisi")
      .default("Surakarta, Jawa Tengah"),
    cashPrice: z
      .number({ error: "Harga cash harus berupa angka" })
      .int("Harga cash harus bilangan bulat")
      .positive("Harga cash harus lebih dari Rp0"),
    creditPrice: z
      .number({ error: "Harga kredit harus berupa angka" })
      .int("Harga kredit harus bilangan bulat")
      .positive("Harga kredit harus lebih dari Rp0")
      .nullable()
      .optional(),
    creditPriceNote: z.string().trim().nullable().optional(),
    paymentMode: paymentModeSchema,
    offerBadge: z.string().trim().nullable().optional(),
    tradeInAvailable: z.boolean().default(false),
    plateInfo: z.string().trim().min(1, "Informasi plat & pajak wajib diisi"),
    plateAreaCode: z.string().trim().nullable().optional(),
    plateOddEven: z.string().trim().nullable().optional(),
    taxStatus: z.string().trim().nullable().optional(),
    taxExpiryDate: z.string().trim().nullable().optional(),
    stnk5yrExpiryDate: z.string().trim().nullable().optional(),
    estimatedAnnualTax: z
      .number()
      .int()
      .nonnegative("Estimasi PKB tahunan tidak boleh negatif")
      .nullable()
      .optional(),
    ownershipType: z.string().trim().nullable().optional(),
    ownershipHand: z
      .number()
      .int()
      .min(1, "Tangan kepemilikan minimal 1")
      .max(20, "Tangan kepemilikan maksimal 20")
      .nullable()
      .optional(),
    stnkBlockFree: z.boolean().default(true),
    vinEngineMatched: z.boolean().default(true),
    usageHistory: z.string().trim().nullable().optional(),
    documentChecklist: documentChecklistSchema.default({}),
    inspectionSummary: inspectionSummarySchema.default({}),
    imperfections: z.array(carImperfectionSchema).default([]),
    recentMaintenance: z.array(z.string().trim().min(1)).default([]),
    warrantyInfo: z.string().trim().nullable().optional(),
    mechanicCheckAllowed: z.boolean().default(true),
    evSpecs: evSpecsSchema.nullable().optional(),
    videoWalkaroundUrl: optionalHttpUrlSchema.nullable().optional(),
    creatorInsights: creatorInsightsSchema.nullable().optional(),
    highlights: z.array(z.string().trim().min(1)).default([]),
    conditions: z.array(z.string().trim().min(1)).default([]),
    creditSimulations: z.array(creditSimulationInputSchema).default([]),
    images: z.array(carImageMetaSchema).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.paymentMode === "cash-credit") {
      if (data.creditPrice !== null && data.creditPrice !== undefined) {
        if (data.creditPrice <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["creditPrice"],
            message: "Harga kredit harus lebih besar dari Rp0",
          })
        }
      }
    }
  })

export const carQuickStatusSchema = z.object({
  id: z.string().uuid("ID mobil tidak valid"),
  status: carStatusSchema,
})

export const carFeaturedSchema = z.object({
  id: z.string().uuid("ID mobil tidak valid"),
  isFeatured: z.boolean(),
  featuredOrder: z.number().int().min(1).max(3).nullable().optional(),
})

export const showroomUpdateSchema = z.object({
  name: z.string().trim().min(2, "Nama showroom minimal 2 karakter"),
  city: z.string().trim().min(2, "Kota showroom wajib diisi"),
  address: z.string().trim().min(5, "Alamat lengkap showroom wajib diisi"),
  hours: z.string().trim().min(3, "Jam operasional wajib diisi"),
  mapsUrl: optionalHttpUrlSchema.refine((v) => v.length > 0, {
    message: "URL Google Maps wajib diisi",
  }),
  mapsEmbedUrl: optionalHttpUrlSchema.refine((v) => v.length > 0, {
    message: "URL Embed Google Maps wajib diisi",
  }),
  instagramHandle: z
    .string()
    .trim()
    .min(2, "Username Instagram wajib diisi (contoh: @garasi.571)"),
  instagramUrl: optionalHttpUrlSchema.refine((v) => v.length > 0, {
    message: "URL profil Instagram wajib diisi",
  }),
  logoUrl: optionalUrlOrPathSchema.refine((v) => v.length > 0, {
    message: "URL logo showroom wajib diisi",
  }),
})

export const salesContactUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: optionalSlugSchema,
  name: z.string().trim().min(2, "Nama sales minimal 2 karakter"),
  role: z.string().trim().min(2, "Jabatan/peran sales wajib diisi"),
  phoneDisplay: z
    .string()
    .trim()
    .min(6, "Nomor telepon tampilan wajib diisi (contoh: +62 812-xxxx-xxxx)"),
  phoneE164: z
    .string()
    .trim()
    .regex(
      /^62[0-9]{8,14}$/,
      "Nomor WhatsApp E.164 harus diawali 62 dan hanya berisi angka (contoh: 6281286414185)",
    ),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
})

export const salesContactSchema = salesContactUpsertSchema

export const faqUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  slug: optionalSlugSchema,
  question: z.string().trim().min(5, "Pertanyaan FAQ minimal 5 karakter"),
  answer: z.string().trim().min(10, "Jawaban FAQ minimal 10 karakter"),
  isPublished: z.boolean().default(true),
  sortOrder: z.number().int().nonnegative().default(0),
})

export const staffProfileUpdateSchema = z.object({
  id: z.string().uuid("ID profil staff tidak valid"),
  fullName: z.string().trim().min(1, "Nama lengkap wajib diisi").optional(),
  role: staffRoleSchema,
  isActive: z.boolean(),
})

export const profileUpdateSchema = staffProfileUpdateSchema

export type CarUpsertInput = z.infer<typeof carUpsertSchema>
export type CarQuickStatusInput = z.infer<typeof carQuickStatusSchema>
export type CarFeaturedInput = z.infer<typeof carFeaturedSchema>
export type CreditSimulationInput = z.infer<typeof creditSimulationInputSchema>
export type CarImageMetaInput = z.infer<typeof carImageMetaSchema>
export type ShowroomUpdateInput = z.infer<typeof showroomUpdateSchema>
export type SalesContactUpsertInput = z.infer<typeof salesContactUpsertSchema>
export type FaqUpsertInput = z.infer<typeof faqUpsertSchema>
export type StaffProfileUpdateInput = z.infer<typeof staffProfileUpdateSchema>
