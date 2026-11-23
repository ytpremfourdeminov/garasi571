import { spawnSync } from "node:child_process"
import { existsSync, readdirSync, readFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { CARS, HERO_FEATURED_SLUGS, type CarUnit } from "@/data/cars"
import { SHOWROOM_FAQS } from "@/data/faq"
import { SHOWROOM } from "@/data/showroom"
import type {
  DocumentChecklist,
  FuelType,
  ImageAngleTag,
  InspectionSummary,
} from "@/lib/domain/types"

const R2_BUCKET_NAME = "garasi571-media"
const BRAND_LOGO_LOCAL_PATH = "public/images/brand/garasi-571-logo.png"
const BRAND_LOGO_R2_KEY = "brand/garasi-571-logo.png"
const BRAND_LOGO_URL = `/media/${BRAND_LOGO_R2_KEY}`
const CARS_IMAGE_ROOT = "public/images/cars"
const MAIN_REPO_ENV_LOCAL_PATH =
  "/Users/kangabbad/Documents/MyProject/fullstack-workspace/garasi571/.env.local"

const DB_URL_ENV_KEYS = [
  "SUPABASE_DIRECT_SESSION_POOLER_DB_URL",
  "SUPABASE_DIRECT_CONNECTION_DB_URL",
] as const

interface CliOptions {
  dryRun: boolean
  skipR2: boolean
  force: boolean
  local: boolean
  help: boolean
}

interface MediaAsset {
  localPath: string
  r2Key: string
  contentType: "image/png" | "image/webp"
}

interface EnrichedCarFields {
  fuelType: FuelType
  bodyType: string
  seatCapacity: number
  interiorColor: string | null
  mileageKm: number | null
  plateAreaCode: string | null
  taxStatus: string | null
  ownershipHand: number | null
  documentChecklist: DocumentChecklist
  inspectionSummary: InspectionSummary
  isFeatured: boolean
  featuredOrder: number | null
  sortOrder: number
}

type SqlPrimitive = string | number | boolean | null

interface SqlArrayParam {
  readonly serializedValues: string
  readonly arrayType: string
}

type SqlParam = SqlPrimitive | SqlArrayParam

interface SqlExecutor {
  <TRow = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: SqlParam[]
  ): Promise<TRow[]>
}

interface BunSqlClient extends SqlExecutor {
  array: (values: readonly string[], typeName?: string) => SqlArrayParam
  begin: <TResult>(
    fn: (tx: SqlExecutor) => Promise<TResult>
  ) => Promise<TResult>
  close: (options?: { timeout?: number }) => Promise<void>
}

interface BunGlobalLike {
  SQL?: new (connectionString: string) => BunSqlClient
}

interface DbConnectionResolution {
  url: string | null
  keyName: string | null
  sourceLabel: string | null
}

function parseCliArgs(argv: readonly string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    skipR2: false,
    force: false,
    local: false,
    help: false,
  }

  for (const arg of argv) {
    switch (arg) {
      case "--dry-run":
        options.dryRun = true
        break
      case "--skip-r2":
        options.skipR2 = true
        break
      case "--force":
        options.force = true
        break
      case "--local":
        options.local = true
        break
      case "--help":
      case "-h":
        options.help = true
        break
      default:
        throw new Error(
          `Flag tidak dikenal: ${arg}. Gunakan --help untuk daftar opsi.`
        )
    }
  }

  return options
}

function printUsage(): void {
  console.log(`Usage: bun run scripts/seed-initial-data.ts [options]

Options:
  --dry-run   Log rencana upload R2 & upsert database tanpa menulis apa pun
  --skip-r2   Lewati upload media ke Cloudflare R2 (hanya upsert database)
  --force     Upload ulang seluruh objek R2 meskipun sudah tercatat di database
  --local     Gunakan --local alih-alih --remote saat menjalankan wrangler r2 object put
  --help, -h  Tampilkan bantuan ini`)
}

function parseEnvFileReadOnly(
  filePath: string,
  targetKeys: readonly string[]
): Partial<Record<string, string>> {
  const result: Partial<Record<string, string>> = {}
  const content = readFileSync(filePath, "utf8")
  const allowed = new Set(targetKeys)

  for (const rawLine of content.split(/\r?\n/)) {
    const trimmed = rawLine.trim()
    if (!trimmed || trimmed.startsWith("#")) continue

    const line = trimmed.startsWith("export ")
      ? trimmed.slice("export ".length).trim()
      : trimmed
    const eqIndex = line.indexOf("=")
    if (eqIndex <= 0) continue

    const key = line.slice(0, eqIndex).trim()
    if (!allowed.has(key)) continue

    let value = line.slice(eqIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (value.length > 0) {
      result[key] = value
    }
  }

  return result
}

function resolveDatabaseUrl(cwd: string): DbConnectionResolution {
  for (const key of DB_URL_ENV_KEYS) {
    const envVal = process.env[key]?.trim()
    if (envVal) {
      return { url: envVal, keyName: key, sourceLabel: "process.env" }
    }
  }

  const candidatePaths = Array.from(
    new Set([resolve(cwd, ".env.local"), resolve(MAIN_REPO_ENV_LOCAL_PATH)])
  )

  for (const candidatePath of candidatePaths) {
    if (!existsSync(candidatePath)) continue
    const parsed = parseEnvFileReadOnly(candidatePath, DB_URL_ENV_KEYS)
    for (const key of DB_URL_ENV_KEYS) {
      const value = parsed[key]
      if (value) {
        return { url: value, keyName: key, sourceLabel: candidatePath }
      }
    }
  }

  return { url: null, keyName: null, sourceLabel: null }
}

function collectMediaAssets(cwd: string): MediaAsset[] {
  const assets: MediaAsset[] = []

  const logoPath = resolve(cwd, BRAND_LOGO_LOCAL_PATH)
  if (!existsSync(logoPath)) {
    throw new Error(`File logo brand tidak ditemukan: ${BRAND_LOGO_LOCAL_PATH}`)
  }
  assets.push({
    localPath: logoPath,
    r2Key: BRAND_LOGO_R2_KEY,
    contentType: "image/png",
  })

  const carsRoot = resolve(cwd, CARS_IMAGE_ROOT)
  if (!existsSync(carsRoot)) {
    throw new Error(`Direktori foto mobil tidak ditemukan: ${CARS_IMAGE_ROOT}`)
  }

  const slugs = readdirSync(carsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()

  for (const slug of slugs) {
    const slugDir = join(carsRoot, slug)
    const files = readdirSync(slugDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".webp"))
      .map((entry) => entry.name)
      .sort()

    for (const file of files) {
      assets.push({
        localPath: join(slugDir, file),
        r2Key: `cars/${slug}/${file}`,
        contentType: "image/webp",
      })
    }
  }

  return assets
}

function inferFuelType(car: CarUnit): FuelType {
  if (car.slug.includes("diesel") || /\bdiesel\b/i.test(car.name)) {
    return "diesel"
  }
  if (car.slug.includes("hybrid") || /\bhybrid\b/i.test(car.name)) {
    return "hybrid"
  }
  return "bensin"
}

function inferBodyTypeAndSeats(car: CarUnit): {
  bodyType: string
  seatCapacity: number
} {
  if (car.slug.includes("mini-cooper")) {
    return { bodyType: "Hatchback", seatCapacity: 4 }
  }
  if (
    car.slug.includes("xpander") ||
    car.slug.includes("ertiga") ||
    car.slug.includes("mobilio")
  ) {
    return { bodyType: "MPV", seatCapacity: 7 }
  }
  if (car.slug.includes("mb500")) {
    return { bodyType: "MPV", seatCapacity: 5 }
  }
  if (car.slug.includes("jazz")) {
    return { bodyType: "Hatchback", seatCapacity: 5 }
  }
  if (car.slug.includes("march")) {
    return { bodyType: "City Car", seatCapacity: 5 }
  }
  return { bodyType: "Sedan", seatCapacity: 5 }
}

function inferPlateAreaCode(plateInfo: string): string | null {
  const prefix = plateInfo.split("-")[0]?.trim()
  if (!prefix) return null
  return /^[A-Z]{1,2}$/.test(prefix) ? prefix : null
}

function inferTaxStatus(plateInfo: string): string | null {
  if (/pajak panjang/i.test(plateInfo)) return "Pajak Panjang"
  if (/pajak baru/i.test(plateInfo)) return "Pajak Baru"
  return null
}

function inferMileageKm(car: CarUnit): number | null {
  if (!car.mileageVerified) return null
  const match = /^(\d+)\s*ribu\s*km\b/i.exec(car.mileageLabel.trim())
  if (!match?.[1]) return null
  const thousands = Number.parseInt(match[1], 10)
  return Number.isFinite(thousands) ? thousands * 1000 : null
}

function inferDocumentChecklist(car: CarUnit): DocumentChecklist {
  const combined = [...car.conditions, ...car.highlights].join(" | ")
  const checklist: DocumentChecklist = {}

  if (/dokumen lengkap/i.test(combined)) {
    checklist.stnk = true
    checklist.bpkb = true
  }
  if (/kunci serep ada/i.test(combined)) {
    checklist.spareKey = true
  }
  if (/buku kelengkapan|record servis|servis record/i.test(combined)) {
    checklist.serviceBook = true
  }

  return checklist
}

function inferInteriorColor(car: CarUnit): string | null {
  const combined = [...car.highlights, ...car.conditions].join(" | ")
  if (/black on beige/i.test(combined)) return "Black on Beige"
  if (/seat red edition/i.test(combined)) return "Red Edition"
  return null
}

function enrichCarFields(car: CarUnit, index: number): EnrichedCarFields {
  const { bodyType, seatCapacity } = inferBodyTypeAndSeats(car)
  const featuredIndex = HERO_FEATURED_SLUGS.indexOf(car.slug)

  return {
    fuelType: inferFuelType(car),
    bodyType,
    seatCapacity,
    interiorColor: inferInteriorColor(car),
    mileageKm: inferMileageKm(car),
    plateAreaCode: inferPlateAreaCode(car.plateInfo),
    taxStatus: inferTaxStatus(car.plateInfo),
    ownershipHand: /tangan pertama/i.test(car.plateInfo) ? 1 : null,
    documentChecklist: inferDocumentChecklist(car),
    inspectionSummary: {},
    isFeatured: featuredIndex !== -1,
    featuredOrder: featuredIndex !== -1 ? featuredIndex + 1 : null,
    sortOrder: index + 1,
  }
}

function createBunSqlClient(connectionString: string): BunSqlClient {
  const bunGlobal = (globalThis as { Bun?: BunGlobalLike }).Bun
  if (!bunGlobal?.SQL) {
    throw new Error(
      "Bun.SQL tidak tersedia. Jalankan script ini menggunakan runtime Bun (bun run scripts/seed-initial-data.ts)."
    )
  }
  return new bunGlobal.SQL(connectionString)
}

async function fetchExistingR2Keys(sql: SqlExecutor): Promise<Set<string>> {
  const existingKeys = new Set<string>()
  try {
    const carImageRows = await sql<{ r2_key: string }>`
      SELECT r2_key FROM public.car_images
    `
    for (const row of carImageRows) {
      if (row.r2_key) existingKeys.add(row.r2_key)
    }

    const showroomRows = await sql<{ logo_url: string }>`
      SELECT logo_url FROM public.showroom_settings WHERE id = 1
    `
    if (showroomRows[0]?.logo_url === BRAND_LOGO_URL) {
      existingKeys.add(BRAND_LOGO_R2_KEY)
    }
  } catch {
    // Table may not exist yet or DB check failed; fall back to uploading all assets.
  }
  return existingKeys
}

function uploadR2Asset(asset: MediaAsset, useLocal: boolean): void {
  const targetFlag = useLocal ? "--local" : "--remote"
  const objectPath = `${R2_BUCKET_NAME}/${asset.r2Key}`
  const args = [
    "wrangler",
    "r2",
    "object",
    "put",
    objectPath,
    "--file",
    asset.localPath,
    "--content-type",
    asset.contentType,
    targetFlag,
  ]

  const result = spawnSync("bunx", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  })

  if (result.error) {
    throw new Error(
      `Gagal menjalankan bunx wrangler untuk ${objectPath}: ${result.error.message}. Pastikan Wrangler terpasang dan login aktif (bunx wrangler login).`
    )
  }

  if (result.status !== 0) {
    const stderr = (result.stderr || result.stdout || "").trim()
    throw new Error(
      [
        `Upload R2 gagal untuk ${objectPath} (exit ${String(result.status)}).`,
        stderr ? `Detail: ${stderr}` : null,
        `Panduan: pastikan sudah login Cloudflare ('bunx wrangler login'), bucket '${R2_BUCKET_NAME}' sudah dibuat, atau gunakan '--skip-r2' / '--local'.`,
      ]
        .filter(Boolean)
        .join("\n")
    )
  }
}

async function syncR2Media(
  assets: readonly MediaAsset[],
  options: CliOptions,
  sql: BunSqlClient | null
): Promise<{ uploaded: number; skipped: number }> {
  if (options.skipR2) {
    console.log("[Step A] Dilewati (--skip-r2).")
    return { uploaded: 0, skipped: assets.length }
  }

  if (options.dryRun) {
    const targetFlag = options.local ? "--local" : "--remote"
    console.log(
      `[Step A][dry-run] Akan mengunggah ${assets.length} aset ke R2 '${R2_BUCKET_NAME}' (${targetFlag}, force=${String(options.force)}):`
    )
    console.log(
      `  - ${BRAND_LOGO_LOCAL_PATH} -> ${BRAND_LOGO_R2_KEY} (image/png)`
    )
    console.log(
      `  - ${assets.length - 1} foto mobil (.webp) -> cars/<slug>/<file>.webp`
    )
    return { uploaded: 0, skipped: 0 }
  }

  const existingKeys =
    !options.force && !options.local && sql
      ? await fetchExistingR2Keys(sql)
      : new Set<string>()

  let uploaded = 0
  let skipped = 0

  console.log(
    `[Step A] Memproses ${assets.length} aset media untuk R2 '${R2_BUCKET_NAME}' (${options.local ? "--local" : "--remote"})...`
  )

  for (const asset of assets) {
    if (!options.force && existingKeys.has(asset.r2Key)) {
      skipped += 1
      continue
    }

    uploadR2Asset(asset, options.local)
    uploaded += 1
    if (uploaded % 20 === 0 || uploaded === assets.length - skipped) {
      console.log(
        `  [R2] Terunggah ${uploaded}/${assets.length - skipped} objek (terakhir: ${asset.r2Key})`
      )
    }
  }

  console.log(
    `[Step A] Selesai: ${uploaded} diunggah, ${skipped} dilewati (sudah ada).`
  )
  return { uploaded, skipped }
}

async function seedDatabase(sql: BunSqlClient): Promise<void> {
  console.log("[Step B] Memulai upsert idempoten ke PostgreSQL...")

  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO public.showroom_settings (
        id,
        name,
        city,
        address,
        hours,
        maps_url,
        maps_embed_url,
        instagram_handle,
        instagram_url,
        logo_url
      ) VALUES (
        1,
        ${SHOWROOM.name},
        ${SHOWROOM.city},
        ${SHOWROOM.city},
        ${SHOWROOM.hours},
        ${SHOWROOM.mapsUrl},
        ${SHOWROOM.mapsEmbedUrl},
        ${SHOWROOM.instagramHandle},
        ${SHOWROOM.instagramUrl},
        ${BRAND_LOGO_URL}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        city = EXCLUDED.city,
        address = EXCLUDED.address,
        hours = EXCLUDED.hours,
        maps_url = EXCLUDED.maps_url,
        maps_embed_url = EXCLUDED.maps_embed_url,
        instagram_handle = EXCLUDED.instagram_handle,
        instagram_url = EXCLUDED.instagram_url,
        logo_url = EXCLUDED.logo_url
    `
    console.log("  [DB] showroom_settings (id=1) upserted.")

    for (const [idx, person] of SHOWROOM.sales.entries()) {
      await tx`
        INSERT INTO public.sales_contacts (
          slug,
          name,
          role,
          phone_display,
          phone_e164,
          is_active,
          sort_order
        ) VALUES (
          ${person.id},
          ${person.name},
          ${person.role},
          ${person.phoneDisplay},
          ${person.phoneE164},
          true,
          ${idx + 1}
        )
        ON CONFLICT (slug) DO UPDATE SET
          name = EXCLUDED.name,
          role = EXCLUDED.role,
          phone_display = EXCLUDED.phone_display,
          phone_e164 = EXCLUDED.phone_e164,
          is_active = EXCLUDED.is_active,
          sort_order = EXCLUDED.sort_order
      `
    }
    console.log(
      `  [DB] sales_contacts (${SHOWROOM.sales.length} kontak) upserted.`
    )

    for (const [idx, faq] of SHOWROOM_FAQS.entries()) {
      await tx`
        INSERT INTO public.showroom_faqs (
          slug,
          question,
          answer,
          is_published,
          sort_order
        ) VALUES (
          ${faq.id},
          ${faq.question},
          ${faq.answer},
          true,
          ${idx + 1}
        )
        ON CONFLICT (slug) DO UPDATE SET
          question = EXCLUDED.question,
          answer = EXCLUDED.answer,
          is_published = EXCLUDED.is_published,
          sort_order = EXCLUDED.sort_order
      `
    }
    console.log(`  [DB] showroom_faqs (${SHOWROOM_FAQS.length} FAQ) upserted.`)

    let totalSimulations = 0
    let totalImages = 0

    for (const [carIdx, car] of CARS.entries()) {
      const enriched = enrichCarFields(car, carIdx)

      const carRows = await tx<{ id: string }>`
        INSERT INTO public.cars (
          slug,
          status,
          is_featured,
          featured_order,
          sort_order,
          brand,
          name,
          short_name,
          year,
          year_sort,
          category,
          category_label,
          body_type,
          seat_capacity,
          color,
          interior_color,
          transmission,
          transmission_group,
          fuel_type,
          mileage_km,
          mileage_label,
          mileage_verified,
          location,
          cash_price,
          credit_price,
          credit_price_note,
          payment_mode,
          trade_in_available,
          plate_info,
          plate_area_code,
          tax_status,
          ownership_hand,
          document_checklist,
          inspection_summary,
          highlights,
          conditions
        ) VALUES (
          ${car.slug},
          'ready',
          ${enriched.isFeatured},
          ${enriched.featuredOrder},
          ${enriched.sortOrder},
          ${car.brand},
          ${car.name},
          ${car.shortName},
          ${car.year},
          ${car.yearSort},
          ${car.category},
          ${car.categoryLabel},
          ${enriched.bodyType},
          ${enriched.seatCapacity},
          ${car.color},
          ${enriched.interiorColor},
          ${car.transmission},
          ${car.transmissionGroup},
          ${enriched.fuelType},
          ${enriched.mileageKm},
          ${car.mileageLabel},
          ${car.mileageVerified},
          ${car.location},
          ${car.cashPrice},
          ${car.creditPrice},
          ${car.creditPriceNote ?? null},
          ${car.paymentMode},
          ${car.tradeInAvailable},
          ${car.plateInfo},
          ${enriched.plateAreaCode},
          ${enriched.taxStatus},
          ${enriched.ownershipHand},
          ${JSON.stringify(enriched.documentChecklist)}::jsonb,
          ${JSON.stringify(enriched.inspectionSummary)}::jsonb,
          ${sql.array(car.highlights, "TEXT")},
          ${sql.array(car.conditions, "TEXT")}
        )
        ON CONFLICT (slug) DO UPDATE SET
          status = EXCLUDED.status,
          is_featured = EXCLUDED.is_featured,
          featured_order = EXCLUDED.featured_order,
          sort_order = EXCLUDED.sort_order,
          brand = EXCLUDED.brand,
          name = EXCLUDED.name,
          short_name = EXCLUDED.short_name,
          year = EXCLUDED.year,
          year_sort = EXCLUDED.year_sort,
          category = EXCLUDED.category,
          category_label = EXCLUDED.category_label,
          body_type = EXCLUDED.body_type,
          seat_capacity = EXCLUDED.seat_capacity,
          color = EXCLUDED.color,
          interior_color = EXCLUDED.interior_color,
          transmission = EXCLUDED.transmission,
          transmission_group = EXCLUDED.transmission_group,
          fuel_type = EXCLUDED.fuel_type,
          mileage_km = EXCLUDED.mileage_km,
          mileage_label = EXCLUDED.mileage_label,
          mileage_verified = EXCLUDED.mileage_verified,
          location = EXCLUDED.location,
          cash_price = EXCLUDED.cash_price,
          credit_price = EXCLUDED.credit_price,
          credit_price_note = EXCLUDED.credit_price_note,
          payment_mode = EXCLUDED.payment_mode,
          trade_in_available = EXCLUDED.trade_in_available,
          plate_info = EXCLUDED.plate_info,
          plate_area_code = EXCLUDED.plate_area_code,
          tax_status = EXCLUDED.tax_status,
          ownership_hand = EXCLUDED.ownership_hand,
          document_checklist = EXCLUDED.document_checklist,
          inspection_summary = EXCLUDED.inspection_summary,
          highlights = EXCLUDED.highlights,
          conditions = EXCLUDED.conditions
        RETURNING id
      `

      const carId = carRows[0]?.id
      if (!carId) {
        throw new Error(`Gagal memperoleh id untuk mobil '${car.slug}'.`)
      }

      await tx`
        DELETE FROM public.car_credit_simulations
        WHERE car_id = ${carId}
      `

      for (const [simIdx, sim] of car.creditSimulations.entries()) {
        await tx`
          INSERT INTO public.car_credit_simulations (
            car_id,
            label,
            provider,
            dp,
            installment,
            installment_label,
            tenor_years,
            note,
            sort_order
          ) VALUES (
            ${carId},
            ${sim.label},
            ${sim.provider ?? null},
            ${sim.dp},
            ${sim.installment},
            ${sim.installmentLabel},
            ${sim.tenorYears},
            ${sim.note ?? null},
            ${simIdx}
          )
        `
        totalSimulations += 1
      }

      for (const [imgIdx, img] of car.images.entries()) {
        const filename = img.src.split("/").pop()
        if (!filename) {
          throw new Error(
            `Nama file gambar tidak valid pada '${car.slug}': ${img.src}`
          )
        }
        const r2Key = `cars/${car.slug}/${filename}`
        const url = `/media/${r2Key}`
        const isCover = imgIdx === 0
        const angleTag: ImageAngleTag = isCover ? "hero" : "lainnya"

        await tx`
          INSERT INTO public.car_images (
            car_id,
            r2_key,
            url,
            width,
            height,
            alt,
            angle_tag,
            sort_order,
            is_cover
          ) VALUES (
            ${carId},
            ${r2Key},
            ${url},
            ${img.width},
            ${img.height},
            ${img.alt},
            ${angleTag},
            ${imgIdx},
            ${isCover}
          )
          ON CONFLICT (r2_key) DO UPDATE SET
            car_id = EXCLUDED.car_id,
            url = EXCLUDED.url,
            width = EXCLUDED.width,
            height = EXCLUDED.height,
            alt = EXCLUDED.alt,
            angle_tag = EXCLUDED.angle_tag,
            sort_order = EXCLUDED.sort_order,
            is_cover = EXCLUDED.is_cover
        `
        totalImages += 1
      }
    }

    console.log(
      `  [DB] cars (${CARS.length} unit), car_credit_simulations (${totalSimulations} paket), car_images (${totalImages} foto) tersinkronisasi.`
    )
  })

  console.log("[Step B] Selesai.")
}

function logDryRunDatabasePlan(dbResolution: DbConnectionResolution): void {
  const dbStatus = dbResolution.keyName
    ? `${dbResolution.keyName} ditemukan (sumber: ${dbResolution.sourceLabel})`
    : "BELUM ditemukan (siapkan SUPABASE_DIRECT_SESSION_POOLER_DB_URL atau SUPABASE_DIRECT_CONNECTION_DB_URL di .env.local)"

  console.log(`[Step B][dry-run] Status koneksi DB: ${dbStatus}`)
  console.log("[Step B][dry-run] Rencana upsert database:")
  console.log(
    `  - showroom_settings (id=1): '${SHOWROOM.name}', logo_url='${BRAND_LOGO_URL}'`
  )
  console.log(
    `  - sales_contacts (${SHOWROOM.sales.length}): ${SHOWROOM.sales.map((s) => s.id).join(", ")}`
  )
  console.log(
    `  - showroom_faqs (${SHOWROOM_FAQS.length}): ${SHOWROOM_FAQS.map((f) => f.id).join(", ")}`
  )
  console.log(`  - cars (${CARS.length} unit):`)

  let totalSims = 0
  let totalImgs = 0

  for (const [idx, car] of CARS.entries()) {
    const enriched = enrichCarFields(car, idx)
    totalSims += car.creditSimulations.length
    totalImgs += car.images.length
    const featuredTag = enriched.isFeatured
      ? `featured=#${String(enriched.featuredOrder)}`
      : "regular"
    const docsKeys = Object.keys(enriched.documentChecklist).join(",") || "none"
    console.log(
      `    ${idx + 1}. ${car.slug} [${featuredTag}, ${enriched.bodyType}/${enriched.seatCapacity}p, ${enriched.fuelType}, plat=${enriched.plateAreaCode ?? "-"}, docs=${docsKeys}, sims=${car.creditSimulations.length}, imgs=${car.images.length}]`
    )
  }

  console.log(
    `  - Total relasi: ${totalSims} car_credit_simulations, ${totalImgs} car_images (URL prefix '/media/cars/<slug>/<file>.webp').`
  )
}

async function main(): Promise<void> {
  const options = parseCliArgs(process.argv.slice(2))
  if (options.help) {
    printUsage()
    return
  }

  const cwd = process.cwd()
  const assets = collectMediaAssets(cwd)
  const dbResolution = resolveDatabaseUrl(cwd)

  if (options.dryRun) {
    await syncR2Media(assets, options, null)
    logDryRunDatabasePlan(dbResolution)
    console.log("[dry-run] Selesai tanpa perubahan ke R2 maupun database.")
    return
  }

  if (!dbResolution.url) {
    throw new Error(
      "Koneksi database tidak ditemukan. Pastikan SUPABASE_DIRECT_SESSION_POOLER_DB_URL atau SUPABASE_DIRECT_CONNECTION_DB_URL tersedia di .env.local."
    )
  }

  const sql = createBunSqlClient(dbResolution.url)
  try {
    await syncR2Media(assets, options, sql)
    await seedDatabase(sql)
  } finally {
    await sql.close({ timeout: 5 })
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`[seed-initial-data] Error: ${message}`)
  process.exitCode = 1
})
