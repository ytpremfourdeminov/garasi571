/**
 * @module data/cars
 * @description Arsip data statis 9 unit awal Garasi 571.
 *
 * CATATAN ARSIP (Wave 4 / Issue #24):
 * Data katalog runtime kini sepenuhnya berasal dari Supabase PostgreSQL (`public.cars`,
 * `public.car_images`, `public.car_credit_simulations`) dan aset foto dilayani dari
 * Cloudflare R2 (`garasi571-media`) melalui route `/media/$`.
 *
 * File ini dipertahankan khusus sebagai sumber data seed awal (`scripts/seed-initial-data.ts`)
 * dan referensi tipe statis. Jangan mengimpor `CARS` langsung di komponen atau route runtime.
 */

export type CarCategory = "keluarga" | "harian" | "hobi-eropa"
export type TransmissionGroup = "manual" | "automatic"
export type PaymentMode = "cash-credit" | "cash-only"
export type BudgetBand = "all" | "under-120" | "120-200" | "over-200"
export type SortOption = "harga-terendah" | "harga-tertinggi" | "tahun-terbaru"

export interface CarImage {
  src: string
  width: number
  height: number
  alt: string
}

export interface CreditSimulation {
  label: string
  provider?: string
  dp: number
  installment: number | null
  installmentLabel: string
  tenorYears: number
  note?: string
}

export interface CarUnit {
  slug: string
  brand: string
  name: string
  shortName: string
  year: string
  yearSort: number
  color: string
  transmission: string
  transmissionGroup: TransmissionGroup
  mileageLabel: string
  mileageVerified: boolean
  plateInfo: string
  location: string
  category: CarCategory
  categoryLabel: string
  cashPrice: number
  creditPrice: number | null
  creditPriceNote?: string
  paymentMode: PaymentMode
  creditSimulations: CreditSimulation[]
  tradeInAvailable: boolean
  highlights: string[]
  conditions: string[]
  images: CarImage[]
}

export interface CatalogFilterState {
  q?: string
  kategori?: "all" | CarCategory
  budget?: BudgetBand
  transmisi?: "all" | TransmissionGroup
  bayar?: "all" | PaymentMode
  urut?: SortOption
}

export const CARS: CarUnit[] = [
  {
    "slug": "mercedes-benz-w124-e320-masterpiece-1995",
    "brand": "Mercedes-Benz",
    "name": "Mercedes-Benz W124 E320 Masterpiece",
    "shortName": "W124 E320 Masterpiece",
    "year": "1995",
    "yearSort": 1995,
    "color": "Black Moonlight Blue",
    "transmission": "Manual",
    "transmissionGroup": "manual",
    "mileageLabel": "105 ribu km",
    "mileageVerified": true,
    "plateInfo": "B - 08/16",
    "location": "Surakarta, Jawa Tengah",
    "category": "hobi-eropa",
    "categoryLabel": "Hobi & Eropa",
    "cashPrice": 90000000,
    "creditPrice": null,
    "creditPriceNote": "Special Price Rp90.000.000",
    "paymentMode": "cash-only",
    "creditSimulations": [],
    "tradeInAvailable": false,
    "highlights": [
      "Setir woodpanel",
      "Headlamp & wiper headlamp",
      "Jok kulit original",
      "Velg OEM & paint protection"
    ],
    "conditions": [
      "Ban tebal",
      "Paint protection",
      "Velg OEM",
      "Audio",
      "Headlamp & wiper headlamp",
      "AC dingin",
      "Power steering",
      "Jok kulit",
      "Central lock",
      "Mesin kering",
      "Setir woodpanel",
      "Clean interiors original",
      "Sangat istimewa"
    ],
    "images": [
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/01.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kiri Mercedes-Benz W124 E320 Masterpiece 1995"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/02.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kanan Mercedes-Benz W124 E320 Masterpiece"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/03.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan Mercedes-Benz W124 E320 Masterpiece dengan wiper headlamp"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/04.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kanan Mercedes-Benz W124 E320 Masterpiece"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/05.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kiri Mercedes-Benz W124 E320 Masterpiece"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/06.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang Mercedes-Benz W124 E320 Masterpiece"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/07.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak samping atas belakang Mercedes-Benz W124 E320 Masterpiece"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/08.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Interior dashboard dan kabin depan Mercedes-Benz W124 E320 Masterpiece"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/09.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Setir woodpanel dan panel instrumen Mercedes-Benz W124 E320"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/10.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok kulit depan Mercedes-Benz W124 E320 Masterpiece"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/11.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kabin penumpang belakang dan door sill Mercedes-Benz W124"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/12.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok kulit baris belakang Mercedes-Benz W124 E320 Masterpiece"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/13.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Konsol tengah woodpanel dan tuas transmisi manual"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/14.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Detail tuas persneling emblem Masterpiece"
      },
      {
        "src": "/images/cars/mercedes-benz-w124-e320-masterpiece-1995/15.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Ruang mesin 6 silinder Mercedes-Benz W124 E320 Masterpiece"
      }
    ]
  },
  {
    "slug": "mercedes-benz-mb500-diesel-1999",
    "brand": "Mercedes-Benz",
    "name": "Mercedes-Benz MB500 Diesel",
    "shortName": "MB500 Diesel",
    "year": "1999",
    "yearSort": 1999,
    "color": "Putih",
    "transmission": "Manual",
    "transmissionGroup": "manual",
    "mileageLabel": "60 ribu km on going",
    "mileageVerified": true,
    "plateInfo": "B - Pajak panjang",
    "location": "Surakarta, Jawa Tengah",
    "category": "hobi-eropa",
    "categoryLabel": "Hobi & Eropa",
    "cashPrice": 115000000,
    "creditPrice": null,
    "creditPriceNote": "Special Price Rp115.000.000",
    "paymentMode": "cash-only",
    "creditSimulations": [],
    "tradeInAvailable": false,
    "highlights": [
      "Mesin diesel kering & tidak ngobos",
      "Kilometer rendah 60 ribu km on going",
      "Velg original & jok kulit",
      "Plat B pajak panjang"
    ],
    "conditions": [
      "Ban tebal",
      "Velg original",
      "Audio",
      "Headlamp & foglamp",
      "AC dingin",
      "Power steering",
      "Jok kulit",
      "Central lock",
      "Mesin kering & tidak ngobos",
      "Clean interiors original",
      "Sangat istimewa"
    ],
    "images": [
      {
        "src": "/images/cars/mercedes-benz-mb500-diesel-1999/01.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kanan Mercedes-Benz MB500 Diesel 1999 Putih"
      },
      {
        "src": "/images/cars/mercedes-benz-mb500-diesel-1999/02.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kiri Mercedes-Benz MB500 Diesel"
      },
      {
        "src": "/images/cars/mercedes-benz-mb500-diesel-1999/03.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan Mercedes-Benz MB500 Diesel"
      },
      {
        "src": "/images/cars/mercedes-benz-mb500-diesel-1999/04.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kanan Mercedes-Benz MB500 Diesel"
      },
      {
        "src": "/images/cars/mercedes-benz-mb500-diesel-1999/05.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak samping atas belakang Mercedes-Benz MB500 Diesel"
      },
      {
        "src": "/images/cars/mercedes-benz-mb500-diesel-1999/06.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Setir dan panel instrumen Mercedes-Benz MB500 Diesel"
      },
      {
        "src": "/images/cars/mercedes-benz-mb500-diesel-1999/07.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kokpit pengemudi Mercedes-Benz MB500 Diesel"
      },
      {
        "src": "/images/cars/mercedes-benz-mb500-diesel-1999/08.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kabin depan sisi kiri Mercedes-Benz MB500 Diesel"
      },
      {
        "src": "/images/cars/mercedes-benz-mb500-diesel-1999/09.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kabin depan sisi kanan Mercedes-Benz MB500 Diesel"
      },
      {
        "src": "/images/cars/mercedes-benz-mb500-diesel-1999/10.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kabin belakang luas Mercedes-Benz MB500 Diesel"
      },
      {
        "src": "/images/cars/mercedes-benz-mb500-diesel-1999/11.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Interior area penumpang belakang Mercedes-Benz MB500 Diesel"
      }
    ]
  },
  {
    "slug": "nissan-march-1-2-l-facelift-2015",
    "brand": "Nissan",
    "name": "Nissan March 1.2 L Facelift",
    "shortName": "March 1.2 L Facelift",
    "year": "2015/2014",
    "yearSort": 2015,
    "color": "Merah Metalik",
    "transmission": "Manual Transmisi",
    "transmissionGroup": "manual",
    "mileageLabel": "115 ribu km on going",
    "mileageVerified": true,
    "plateInfo": "AD - Pajak baru",
    "location": "Surakarta, Jawa Tengah",
    "category": "harian",
    "categoryLabel": "Harian & City Car",
    "cashPrice": 97000000,
    "creditPrice": 92000000,
    "creditPriceNote": "Khusus kredit nett",
    "paymentMode": "cash-credit",
    "creditSimulations": [
      {
        "label": "Simulasi Kredit (Hana Finance)",
        "provider": "Hana Finance",
        "dp": 23000000,
        "installment": 2500000,
        "installmentLabel": "Rp2.500.000",
        "tenorYears": 4
      }
    ],
    "tradeInAvailable": false,
    "highlights": [
      "Plat AD pajak baru",
      "Body full paint protection",
      "Velg racing R15 (upgrade modifikasi)",
      "Bisa bantu kredit DP minim"
    ],
    "conditions": [
      "Body full paint protection",
      "Audio original",
      "Velg racing R15 (upgrade modifikasi)",
      "Servis rutin terawat",
      "Ban tebal",
      "Mobil istimewa & body mulus",
      "Interior sangat bersih & original jok",
      "Mesin terawat & full orisinil",
      "Power window, power steering, electric mirror",
      "Dokumen lengkap",
      "Bisa bantu kredit DP minim",
      "Mobil tinggal pakai"
    ],
    "images": [
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/01.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kiri Nissan March 1.2 L Facelift 2015 Merah Metalik"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/02.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan Nissan March 1.2 L Facelift"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/03.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kanan Nissan March 1.2 L Facelift"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/04.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kiri Nissan March 1.2 L Facelift"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/05.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang Nissan March 1.2 L Facelift"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/06.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak samping atas belakang Nissan March 1.2 L Facelift"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/07.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Dashboard dan audio original Nissan March 1.2 L Facelift"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/08.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Setir dan panel instrumen Nissan March 1.2 L Facelift"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/09.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Detail setir kemudi Nissan March 1.2 L Facelift"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/10.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kokpit pengemudi dan transmisi manual Nissan March"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/11.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok depan original Nissan March 1.2 L Facelift"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/12.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kabin belakang Nissan March 1.2 L Facelift"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/13.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok baris belakang Nissan March 1.2 L Facelift"
      },
      {
        "src": "/images/cars/nissan-march-1-2-l-facelift-2015/14.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Ruang mesin Nissan March 1.2 L Facelift"
      }
    ]
  },
  {
    "slug": "mitsubishi-xpander-ultimate-2017",
    "brand": "Mitsubishi",
    "name": "Mitsubishi Xpander Ultimate",
    "shortName": "Xpander Ultimate",
    "year": "2017",
    "yearSort": 2017,
    "color": "Hitam Metalik",
    "transmission": "Automatic",
    "transmissionGroup": "automatic",
    "mileageLabel": "Tanyakan via WhatsApp",
    "mileageVerified": false,
    "plateInfo": "B - Pajak panjang",
    "location": "Surakarta, Jawa Tengah",
    "category": "keluarga",
    "categoryLabel": "Keluarga 7-Seater",
    "cashPrice": 195000000,
    "creditPrice": 185000000,
    "creditPriceNote": "Khusus kredit nett",
    "paymentMode": "cash-credit",
    "creditSimulations": [
      {
        "label": "Simulasi Kredit 1",
        "dp": 38000000,
        "installment": 4080000,
        "installmentLabel": "Rp4.080.000",
        "tenorYears": 5
      },
      {
        "label": "Simulasi Kredit 2",
        "dp": 43000000,
        "installment": 4895000,
        "installmentLabel": "Rp4.895.000",
        "tenorYears": 4
      }
    ],
    "tradeInAvailable": true,
    "highlights": [
      "Keyless & cruise control",
      "Velg twotone facelift & DRL lamp",
      "Camera parkir & AC double dingin",
      "Bisa bantu kredit DP minim & tukar tambah"
    ],
    "conditions": [
      "Keyless",
      "Cover jok",
      "Control audio steering & up cruise control",
      "Velg twotone facelift",
      "DRL lamp, foglamp & muffler knalpot chrome",
      "Mobil istimewa, body mulus & interior sangat bersih",
      "Camera parkir",
      "Mesin terawat, full orisinil & full aksesoris",
      "Ban tebal",
      "AC double & dingin",
      "DVD, radio, USB",
      "Power window, power steering, electric mirror & retract spion",
      "Dokumen lengkap",
      "Bisa bantu kredit DP minim & bisa tukar tambah",
      "Mobil tinggal pakai"
    ],
    "images": [
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/01.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kanan Mitsubishi Xpander Ultimate 2017 Hitam Metalik"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/02.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kiri Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/03.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak samping depan kiri Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/04.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/05.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kiri Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/06.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kanan Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/07.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/08.webp",
        "width": 960,
        "height": 1280,
        "alt": "Tampak samping atas belakang Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/09.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Bagasi belakang Mitsubishi Xpander Ultimate dengan pintu terbuka"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/10.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Setir dan cluster instrumen Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/11.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Konsol tengah, head unit, dan transmisi otomatis Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/12.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Dashboard kabin depan Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/13.webp",
        "width": 720,
        "height": 1280,
        "alt": "Tombol cruise control pada setir Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/14.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok depan Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/15.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok baris kedua Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/16.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Akses kabin baris kedua Mitsubishi Xpander Ultimate"
      },
      {
        "src": "/images/cars/mitsubishi-xpander-ultimate-2017/17.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Ruang mesin Mitsubishi Xpander Ultimate"
      }
    ]
  },
  {
    "slug": "suzuki-all-new-ertiga-gx-hybrid-2025",
    "brand": "Suzuki",
    "name": "Suzuki All New Ertiga GX Hybrid",
    "shortName": "Ertiga GX Hybrid",
    "year": "2025",
    "yearSort": 2025,
    "color": "Putih Mutiara",
    "transmission": "Manual",
    "transmissionGroup": "manual",
    "mileageLabel": "KM low",
    "mileageVerified": true,
    "plateInfo": "AD - Tangan pertama",
    "location": "Surakarta, Jawa Tengah",
    "category": "keluarga",
    "categoryLabel": "Keluarga 7-Seater",
    "cashPrice": 245000000,
    "creditPrice": 235000000,
    "creditPriceNote": "Khusus kredit nett",
    "paymentMode": "cash-credit",
    "creditSimulations": [
      {
        "label": "Simulasi 1 (BF)",
        "provider": "BF",
        "dp": 35000000,
        "installment": null,
        "installmentLabel": "Rp5 jutaan",
        "tenorYears": 6
      },
      {
        "label": "Simulasi 2 (HF)",
        "provider": "HF",
        "dp": 35000000,
        "installment": 5900000,
        "installmentLabel": "Rp5.900.000",
        "tenorYears": 5
      }
    ],
    "tradeInAvailable": true,
    "highlights": [
      "Kelengkapan full set tahun 2025",
      "Keyless, ISG Hybrid & i-stop engine",
      "Android audio & cruise control",
      "Plat AD tangan pertama & kilometer rendah"
    ],
    "conditions": [
      "Kelengkapan: Full set",
      "Keyless & ISG Hybrid",
      "Cover jok premium",
      "Control audio steering & up cruise control",
      "i-stop engine",
      "Velg twotone facelift & muffler knalpot chrome",
      "Mobil istimewa, body mulus & interior sangat bersih",
      "Android audio, DVD, radio, USB",
      "Mesin terawat, full orisinil & full aksesoris",
      "Ban tebal",
      "AC double & dingin",
      "Foglamp",
      "Power window, power steering, electric mirror & retract spion",
      "Dokumen lengkap",
      "Bisa bantu kredit DP minim & bisa tukar tambah",
      "Mobil tinggal pakai"
    ],
    "images": [
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/01.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kanan Suzuki All New Ertiga GX Hybrid 2025 Putih Mutiara"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/02.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kiri Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/03.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/04.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Detail grille depan dan headlamp Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/05.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Velg twotone facelift Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/06.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kanan Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/07.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kiri Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/08.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/09.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak samping atas belakang Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/10.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Bagasi dan baris ketiga Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/11.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Dashboard dan Android audio Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/12.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampilan lebar kokpit Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/13.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Interior kabin depan Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/14.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Setir dengan control audio steering dan cruise control"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/15.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Panel instrumen Smart Hybrid Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/16.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tombol engine start stop dan i-stop engine"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/17.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kabin depan sisi penumpang Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/18.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok depan dengan cover premium Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/19.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok baris kedua Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/20.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Akses kabin baris kedua Suzuki All New Ertiga GX Hybrid"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/21.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Ruang mesin Smart Hybrid Suzuki All New Ertiga tampak kanan"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/22.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Ruang mesin Smart Hybrid Suzuki All New Ertiga tampak kiri"
      },
      {
        "src": "/images/cars/suzuki-all-new-ertiga-gx-hybrid-2025/23.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Ruang mesin dengan kap terbuka Suzuki All New Ertiga GX Hybrid"
      }
    ]
  },
  {
    "slug": "honda-jazz-rs-ge8-facelift-mmc-2013",
    "brand": "Honda",
    "name": "Honda Jazz RS GE8 Facelift MMC",
    "shortName": "Jazz RS GE8 MMC",
    "year": "2013",
    "yearSort": 2013,
    "color": "Merah Metalik",
    "transmission": "Automatic Triptonic",
    "transmissionGroup": "automatic",
    "mileageLabel": "Tanyakan via WhatsApp",
    "mileageVerified": false,
    "plateInfo": "K - Pajak panjang (tangan pertama)",
    "location": "Surakarta, Jawa Tengah",
    "category": "harian",
    "categoryLabel": "Harian & City Car",
    "cashPrice": 159000000,
    "creditPrice": 149000000,
    "creditPriceNote": "Khusus kredit",
    "paymentMode": "cash-credit",
    "creditSimulations": [
      {
        "label": "Simulasi Kredit",
        "dp": 30000000,
        "installment": 4095000,
        "installmentLabel": "Rp4.095.000",
        "tenorYears": 5
      }
    ],
    "tradeInAvailable": false,
    "highlights": [
      "Paint protection garansi 5 tahun",
      "Record servis bengkel resmi",
      "Buku kelengkapan & kunci serep ada",
      "Tangan pertama pajak panjang"
    ],
    "conditions": [
      "Paint protection garansi 5 tahun",
      "Camera parkir",
      "Buku kelengkapan ada & kunci serep ada",
      "Record servis bengkel resmi",
      "Jok original (jok cover ada)",
      "Velg racing original & ban tebal",
      "Mobil istimewa, body mulus & interior sangat bersih",
      "Mesin terawat & full orisinil",
      "Audio original",
      "Power window, power steering, electric mirror & retract spion",
      "Dokumen lengkap",
      "Bisa bantu kredit DP minim",
      "Mobil tinggal pakai"
    ],
    "images": [
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/01.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kanan Honda Jazz RS GE8 Facelift MMC 2013 Merah Metalik"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/02.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kiri Honda Jazz RS GE8 Facelift MMC"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/03.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak samping depan kiri Honda Jazz RS GE8 Facelift MMC"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/04.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan Honda Jazz RS GE8 Facelift MMC"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/05.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kanan Honda Jazz RS GE8 Facelift MMC"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/06.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang Honda Jazz RS GE8 Facelift MMC"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/07.webp",
        "width": 960,
        "height": 1280,
        "alt": "Tampak samping atas belakang Honda Jazz RS GE8 Facelift MMC"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/08.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Bagasi belakang Honda Jazz RS GE8 Facelift MMC"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/09.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Setir kemudi dan paddle shift Honda Jazz RS GE8"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/10.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Panel speedometer Honda Jazz RS GE8 Facelift MMC"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/11.webp",
        "width": 1280,
        "height": 960,
        "alt": "Dashboard panoramik Honda Jazz RS GE8 Facelift MMC"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/12.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Konsol tengah dan tuas transmisi automatic triptonic"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/13.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kokpit pengemudi Honda Jazz RS GE8 Facelift MMC"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/14.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok depan original Honda Jazz RS GE8 Facelift MMC"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/15.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok baris belakang Honda Jazz RS GE8 Facelift MMC"
      },
      {
        "src": "/images/cars/honda-jazz-rs-ge8-facelift-mmc-2013/16.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kabin belakang Honda Jazz RS GE8 Facelift MMC"
      }
    ]
  },
  {
    "slug": "honda-all-new-mobilio-e-facelift-2018",
    "brand": "Honda",
    "name": "Honda All New Mobilio E Facelift",
    "shortName": "Mobilio E Facelift",
    "year": "2018",
    "yearSort": 2018,
    "color": "Putih Metalik",
    "transmission": "Automatic",
    "transmissionGroup": "automatic",
    "mileageLabel": "Tanyakan via WhatsApp",
    "mileageVerified": false,
    "plateInfo": "D - Pajak baru",
    "location": "Surakarta, Jawa Tengah",
    "category": "keluarga",
    "categoryLabel": "Keluarga 7-Seater",
    "cashPrice": 157000000,
    "creditPrice": 147000000,
    "creditPriceNote": "Kredit only",
    "paymentMode": "cash-credit",
    "creditSimulations": [
      {
        "label": "Simulasi Kredit (BCA Finance)",
        "provider": "BCA Finance",
        "dp": 27000000,
        "installment": 3440000,
        "installmentLabel": "Rp3.440.000",
        "tenorYears": 5
      }
    ],
    "tradeInAvailable": true,
    "highlights": [
      "Servis record & ban depan baru",
      "Paint protection & cover jok premium",
      "DRL lamp, foglamp & camera parkir",
      "Bisa bantu kredit DP minim & tukar tambah"
    ],
    "conditions": [
      "Servis record",
      "Ban depan baru",
      "Mobil istimewa, body mulus & full orisinil",
      "Control audio steering",
      "Paint protection",
      "Cover jok premium (original jok ada)",
      "Mesin terawat",
      "DVD, radio, USB",
      "AC dingin double",
      "Fog lamp, DRL lamp & camera parkir",
      "Power window, power steering & electric mirror",
      "Dokumen lengkap",
      "Bisa bantu kredit DP minim & bisa tukar tambah",
      "Mobil tinggal pakai"
    ],
    "images": [
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/01.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kanan Honda All New Mobilio E Facelift 2018 Putih Metalik"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/02.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kiri Honda All New Mobilio E Facelift"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/03.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan Honda All New Mobilio E Facelift"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/04.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kiri Honda All New Mobilio E Facelift"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/05.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kanan Honda All New Mobilio E Facelift"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/06.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang Honda All New Mobilio E Facelift"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/07.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak samping atas belakang Honda All New Mobilio E Facelift"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/08.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Bagasi dan lipatan kursi belakang Honda All New Mobilio E"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/09.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Setir dengan control audio steering dan head unit Honda Mobilio E"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/10.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kokpit pengemudi Honda All New Mobilio E Facelift"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/11.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok depan dengan cover premium Honda All New Mobilio E"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/12.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Akses kabin baris kedua Honda All New Mobilio E Facelift"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/13.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok baris kedua Honda All New Mobilio E Facelift"
      },
      {
        "src": "/images/cars/honda-all-new-mobilio-e-facelift-2018/14.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Ruang mesin i-VTEC Honda All New Mobilio E Facelift"
      }
    ]
  },
  {
    "slug": "mini-cooper-1-6-s-turbo-2011",
    "brand": "Mini Cooper",
    "name": "Mini Cooper 1.6 S Turbo (3 Doors)",
    "shortName": "Mini Cooper 1.6 S Turbo",
    "year": "2011",
    "yearSort": 2011,
    "color": "White on Red",
    "transmission": "Automatic Triptonic",
    "transmissionGroup": "automatic",
    "mileageLabel": "65 ribu km",
    "mileageVerified": true,
    "plateInfo": "D - Pajak panjang",
    "location": "Surakarta, Jawa Tengah",
    "category": "hobi-eropa",
    "categoryLabel": "Hobi & Eropa",
    "cashPrice": 305000000,
    "creditPrice": 295000000,
    "creditPriceNote": "Khusus kredit nett",
    "paymentMode": "cash-credit",
    "creditSimulations": [
      {
        "label": "Simulasi Kredit (Hana Finance)",
        "provider": "Hana Finance",
        "dp": 120000000,
        "installment": 6150000,
        "installmentLabel": "Rp6.150.000",
        "tenorYears": 4
      }
    ],
    "tradeInAvailable": false,
    "highlights": [
      "Sunroof & seat red edition",
      "Kilometer rendah 65 ribu km",
      "Record servis rutin",
      "Autolamp, foglamp & control audio steering"
    ],
    "conditions": [
      "Control audio steering",
      "Sunroof",
      "Record servis rutin",
      "Seat red edition",
      "Velg racing original & ban tebal",
      "Mobil istimewa, body mulus & interior sangat bersih",
      "Mesin terawat & full orisinil",
      "Audio original",
      "Autolamp & foglamp",
      "Power window, power steering, electric mirror & retract spion",
      "Dokumen lengkap",
      "Bisa bantu kredit DP minim",
      "Mobil tinggal pakai"
    ],
    "images": [
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/01.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kiri Mini Cooper 1.6 S Turbo 3 Doors 2011 White on Red"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/02.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan Mini Cooper 1.6 S Turbo dengan bonnet stripes"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/03.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kiri Mini Cooper 1.6 S Turbo"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/04.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kanan Mini Cooper 1.6 S Turbo"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/05.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang Mini Cooper 1.6 S Turbo dengan knalpot ganda"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/06.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak atas belakang atap hitam dan sunroof Mini Cooper 1.6 S Turbo"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/07.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak atas serong kanan atap sunroof Mini Cooper 1.6 S Turbo"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/08.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Setir dengan control audio steering dan paddle shift Mini Cooper S"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/09.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tachometer dan odometer 65.751 km Mini Cooper 1.6 S Turbo"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/10.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kunci dan tombol start Mini Cooper 1.6 S Turbo"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/11.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kabin depan sisi penumpang dengan jok kulit merah"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/12.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kabin depan sisi pengemudi Mini Cooper 1.6 S Turbo"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/13.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Speedometer tengah ikonik dan konsol kontrol Mini Cooper S"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/14.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Kokpit pengemudi Mini Cooper 1.6 S Turbo"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/15.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok kulit Red Edition depan Mini Cooper 1.6 S Turbo"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/16.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Detail jok Red Edition sisi penumpang Mini Cooper S"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/17.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok kulit Red Edition baris belakang Mini Cooper 3 Doors"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/18.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Bagasi belakang Mini Cooper 1.6 S Turbo"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/19.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Panel pintu dan kabin Mini Cooper 1.6 S Turbo"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/20.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Ruang mesin 1.6L Turbo Mini Cooper S tampak depan"
      },
      {
        "src": "/images/cars/mini-cooper-1-6-s-turbo-2011/21.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Ruang mesin 1.6L Turbo Mini Cooper S tampak samping"
      }
    ]
  },
  {
    "slug": "mercedes-benz-w212-e300-elegance-2009",
    "brand": "Mercedes-Benz",
    "name": "Mercedes-Benz W212 E300 Elegance Sunroof Panoramic (Engine V6)",
    "shortName": "W212 E300 Elegance V6",
    "year": "2009",
    "yearSort": 2009,
    "color": "Hitam Mutiara",
    "transmission": "Automatic Triptonic",
    "transmissionGroup": "automatic",
    "mileageLabel": "Tanyakan via WhatsApp",
    "mileageVerified": false,
    "plateInfo": "L - Tangan pertama",
    "location": "Surakarta, Jawa Tengah",
    "category": "hobi-eropa",
    "categoryLabel": "Hobi & Eropa",
    "cashPrice": 195000000,
    "creditPrice": 185000000,
    "paymentMode": "cash-credit",
    "creditSimulations": [
      {
        "label": "Simulasi Kredit",
        "dp": 85000000,
        "installment": 3875000,
        "installmentLabel": "Rp3.875.000",
        "tenorYears": 4
      }
    ],
    "tradeInAvailable": false,
    "highlights": [
      "Sunroof panoramic & engine V6",
      "Jok kulit, memory seat & jok elektrik dual",
      "Cruise control & tilt steering elektrik",
      "Clean interiors original (Black on Beige)"
    ],
    "conditions": [
      "Ban tebal & velg racing",
      "Sunroof panoramic",
      "Cruise control & tilt steering elektrik",
      "Audio original, control audio steering & audio super bass",
      "Auto lamp & DRL lamp",
      "AC dingin & AC dual zone",
      "Power window, power steering & central lock",
      "Airbag",
      "Jok kulit, memory seat & jok elektrik dual",
      "Mirror elektrik & retract auto",
      "Clean interiors original (Black on Beige)",
      "Sangat istimewa"
    ],
    "images": [
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/01.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kiri Mercedes-Benz W212 E300 Elegance 2009 Hitam Mutiara"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/02.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan serong kanan Mercedes-Benz W212 E300 Elegance"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/03.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak depan Mercedes-Benz W212 E300 Elegance"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/04.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang serong kiri Mercedes-Benz W212 E300 Elegance"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/05.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak belakang Mercedes-Benz W212 E300 Elegance"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/06.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak samping atas belakang Mercedes-Benz W212 E300 Elegance"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/07.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampak atas panoramic sunroof Mercedes-Benz W212 E300 Elegance"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/08.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Bagasi belakang terbuka Mercedes-Benz W212 E300 Elegance"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/09.webp",
        "width": 1280,
        "height": 960,
        "alt": "Dashboard lebar interior Black on Beige Mercedes-Benz W212 E300"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/10.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Konsol tengah wood trim dan layar audio Mercedes-Benz W212 E300"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/11.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Setir pengemudi dan panel instrumen Mercedes-Benz W212 E300"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/12.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tuas transmisi kolom setir dan saklar auto lamp"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/13.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tombol memory seat dan pengaturan jok elektrik pada pintu"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/14.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok kulit beige depan kiri Mercedes-Benz W212 E300 Elegance"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/15.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok kulit beige pengemudi Mercedes-Benz W212 E300 Elegance"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/16.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Tampilan jok depan Mercedes-Benz W212 E300 Elegance"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/17.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Interior kabin dengan pemandangan panoramic sunroof"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/18.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Atap panoramic sunroof tampak dari baris belakang"
      },
      {
        "src": "/images/cars/mercedes-benz-w212-e300-elegance-2009/19.webp",
        "width": 1280,
        "height": 1280,
        "alt": "Jok kulit baris belakang beige Mercedes-Benz W212 E300 Elegance"
      }
    ]
  }
]

export const HERO_FEATURED_SLUGS: readonly [string, string, string] = [
  "suzuki-all-new-ertiga-gx-hybrid-2025",
  "mini-cooper-1-6-s-turbo-2011",
  "mercedes-benz-w124-e320-masterpiece-1995",
]

export const CREDIT_ELIGIBLE_CARS: CarUnit[] = CARS.filter(
  (car) => car.paymentMode === "cash-credit",
)

export function formatRupiah(amount: number): string {
  return `Rp${new Intl.NumberFormat("id-ID").format(amount)}`
}

export function formatShortJuta(amount: number): string {
  const juta = amount / 1_000_000
  const formatted = Number.isInteger(juta)
    ? String(juta)
    : juta.toLocaleString("id-ID", { maximumFractionDigits: 1 })
  return `Rp${formatted} jt`
}

export function filterAndSortCars(
  cars: CarUnit[],
  filters: CatalogFilterState,
): CarUnit[] {
  const query = filters.q?.trim().toLowerCase() ?? ""

  const filtered = cars.filter((car) => {
    if (filters.kategori && filters.kategori !== "all") {
      if (car.category !== filters.kategori) return false
    }

    if (filters.transmisi && filters.transmisi !== "all") {
      if (car.transmissionGroup !== filters.transmisi) return false
    }

    if (filters.bayar && filters.bayar !== "all") {
      if (car.paymentMode !== filters.bayar) return false
    }

    if (filters.budget && filters.budget !== "all") {
      const price = car.cashPrice
      if (filters.budget === "under-120" && price >= 120_000_000) return false
      if (
        filters.budget === "120-200" &&
        (price < 120_000_000 || price > 200_000_000)
      ) {
        return false
      }
      if (filters.budget === "over-200" && price <= 200_000_000) return false
    }

    if (query) {
      const haystack = [
        car.brand,
        car.name,
        car.shortName,
        car.year,
        car.color,
        car.transmission,
        car.plateInfo,
        car.categoryLabel,
        ...car.highlights,
        ...car.conditions,
      ]
        .join(" ")
        .toLowerCase()
      if (!haystack.includes(query)) return false
    }

    return true
  })

  if (!filters.urut) {
    return filtered
  }

  return [...filtered].sort((a, b) => {
    if (filters.urut === "harga-terendah") {
      return a.cashPrice - b.cashPrice
    }
    if (filters.urut === "harga-tertinggi") {
      return b.cashPrice - a.cashPrice
    }
    return b.yearSort - a.yearSort || b.cashPrice - a.cashPrice
  })
}

export function getCarBySlug(slug: string): CarUnit | undefined {
  return CARS.find((car) => car.slug === slug)
}

export function getSimilarCars(car: CarUnit, limit = 3): CarUnit[] {
  return CARS.filter((item) => item.slug !== car.slug)
    .sort((a, b) => {
      const aSameCategory = a.category === car.category ? 0 : 1
      const bSameCategory = b.category === car.category ? 0 : 1
      if (aSameCategory !== bSameCategory) {
        return aSameCategory - bSameCategory
      }
      return (
        Math.abs(a.cashPrice - car.cashPrice) -
        Math.abs(b.cashPrice - car.cashPrice)
      )
    })
    .slice(0, limit)
}
