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
      "Dari 9 unit aktif di katalog, 7 unit melayani pembelian cash maupun kredit melalui lembaga pembiayaan tercatat (antara lain BCA Finance, Hana Finance, BF, dan HF dengan DP mulai Rp23 juta). Sementara itu, 2 unit koleksi Mercedes-Benz klasik (W124 E320 Masterpiece 1995 dan MB500 Diesel 1999) berstatus Special Price khusus pembayaran cash.",
  },
  {
    id: "layanan-tukar-tambah",
    question: "Unit mana saja yang melayani opsi tukar tambah?",
    answer:
      "Saat ini terdapat 3 unit di katalog yang tercatat melayani opsi tukar tambah, yaitu Mitsubishi Xpander Ultimate (2017), Suzuki All New Ertiga GX Hybrid (2025), dan Honda All New Mobilio E Facelift (2018).",
  },
  {
    id: "cek-kondisi-odometer-dokumen",
    question:
      "Bagaimana cara mengetahui kondisi fisik, kelengkapan dokumen, dan angka odometer unit yang belum tercantum?",
    answer:
      'Terdapat 4 unit di katalog yang memakai keterangan odometer "Tanyakan via WhatsApp". Calon pembeli dapat menghubungi tim sales via WhatsApp untuk menanyakan detail kilometer, kondisi fisik, dan kelengkapan dokumen, atau datang langsung untuk inspeksi unit di showroom Surakarta.',
  },
  {
    id: "kontak-resmi-sales",
    question: "Bagaimana cara menghubungi tim sales resmi Garasi 571?",
    answer: `Anda dapat menghubungi ${farrel.name} (${farrel.phoneDisplay}) atau ${abbad.name} (${abbad.phoneDisplay}) melalui WhatsApp, serta mengikuti pembaruan unit di akun Instagram resmi ${SHOWROOM.instagramHandle}.`,
  },
] as const
