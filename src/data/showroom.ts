export interface SalesContact {
  id: "farrel" | "abbad"
  name: string
  role: string
  phoneDisplay: string
  phoneE164: string
}

export const SHOWROOM = {
  name: "Garasi 571",
  city: "Surakarta, Jawa Tengah",
  hours: "Setiap hari, 08:00 - 16:00 WIB",
  mapsUrl: "https://maps.app.goo.gl/4wLS9NRMExMHPaXA9",
  mapsEmbedUrl:
    "https://maps.google.com/maps?q=-7.5256103,110.818928&z=16&output=embed",
  instagramHandle: "@garasi.571",
  instagramUrl: "https://www.instagram.com/garasi.571/",
  logoSrc: "/images/brand/garasi-571-logo.png",
  sales: [
    {
      id: "farrel",
      name: "Farrel",
      role: "Tim Sales Garasi 571",
      phoneDisplay: "+62 812-8641-4185",
      phoneE164: "6281286414185",
    },
    {
      id: "abbad",
      name: "Abbad",
      role: "Tim Sales Garasi 571",
      phoneDisplay: "+62 877-3999-9776",
      phoneE164: "6287739999776",
    },
  ] as const satisfies readonly SalesContact[],
} as const

export function buildWhatsAppUrl(phoneE164: string, message: string): string {
  return `https://wa.me/${phoneE164}?text=${encodeURIComponent(message)}`
}

export function buildCarInquiryMessage(
  carName: string,
  year: string,
  scheme?: string,
): string {
  const unitLabel = `${carName} (${year})`
  if (scheme) {
    return `Halo Garasi 571, saya tertarik dengan unit ${unitLabel} (${scheme}). Apakah unitnya masih tersedia untuk cek langsung di showroom Surakarta?`
  }
  return `Halo Garasi 571, saya tertarik dengan unit ${unitLabel}. Apakah unitnya masih tersedia untuk cek langsung di showroom Surakarta?`
}
