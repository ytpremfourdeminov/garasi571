/**
 * @module data/faq
 * @description Arsip daftar FAQ statis awal Garasi 571.
 *
 * CATATAN ARSIP (Wave 4 / Issue #24):
 * Data FAQ runtime kini diambil langsung dari Supabase PostgreSQL (`public.showroom_faqs`).
 * File ini dipertahankan khusus sebagai sumber seed awal (`scripts/seed-initial-data.ts`).
 * Jangan mengimpor `SHOWROOM_FAQS` langsung pada route atau komponen runtime.
 */

import { SHOWROOM } from "@/data/showroom"

export interface ShowroomFaqItem {
  id: string
  question: string
  answer: string
}

const farrel = SHOWROOM.sales[0]
const abbad = SHOWROOM.sales[1]

export const SHOWROOM_FAQS: readonly ShowroomFaqItem[] = [
  {
    id: "lokasi-jam-operasional",
    question:
      "Di mana lokasi showroom Garasi 571 dan kapan jam operasionalnya?",
    answer: `Showroom ${SHOWROOM.name} berlokasi di ${SHOWROOM.city} dan buka ${SHOWROOM.hours}. Anda dapat melihat titik lokasi langsung melalui Google Maps di ${SHOWROOM.mapsUrl}.`,
  },
  {
    id: "opsi-pembayaran-cash-kredit",
    question:
      "Bagaimana perbedaan opsi pembayaran cash dan kredit di Garasi 571?",
    answer:
      "Sebagian besar unit melayani pembelian cash maupun kredit melalui mitra leasing seperti BCA Finance dan Hana Finance (DP mulai Rp23 juta). Untuk unit koleksi tertentu, tersedia harga khusus pembelian tunai.",
  },
  {
    id: "layanan-tukar-tambah",
    question: "Unit mana saja yang melayani opsi tukar tambah?",
    answer:
      'Layanan tukar tambah tersedia untuk unit bertanda "Bisa Tukar Tambah" di katalog. Hubungi tim sales untuk taksiran kendaraan lama Anda.',
  },
  {
    id: "cek-kondisi-odometer-dokumen",
    question:
      "Bagaimana cara mengetahui kondisi fisik, kelengkapan dokumen, dan angka odometer unit yang belum tercantum?",
    answer:
      "Untuk unit yang belum mencantumkan angka kilometer, Anda bisa menanyakan detail odometer, kondisi fisik, dan dokumen langsung via WhatsApp atau cek langsung di showroom.",
  },
  {
    id: "kontak-resmi-sales",
    question: "Bagaimana cara menghubungi tim sales resmi Garasi 571?",
    answer: `Anda dapat menghubungi ${farrel.name} (${farrel.phoneDisplay}) atau ${abbad.name} (${abbad.phoneDisplay}) melalui WhatsApp, serta mengikuti pembaruan unit di akun Instagram resmi ${SHOWROOM.instagramHandle}.`,
  },
] as const
