import * as React from "react"
import { SHOWROOM } from "@/data/showroom"
import type { ShowroomConfig } from "@/lib/domain/types"

export const DEFAULT_SHOWROOM_CONFIG: ShowroomConfig = {
  id: 1,
  name: SHOWROOM.name,
  city: SHOWROOM.city,
  address: SHOWROOM.city,
  hours: SHOWROOM.hours,
  mapsUrl: SHOWROOM.mapsUrl,
  mapsEmbedUrl: SHOWROOM.mapsEmbedUrl,
  instagramHandle: SHOWROOM.instagramHandle,
  instagramUrl: SHOWROOM.instagramUrl,
  logoSrc: SHOWROOM.logoSrc,
  logoUrl: SHOWROOM.logoSrc,
  sales: SHOWROOM.sales.map((contact, index) => ({
    id: contact.id,
    slug: contact.id,
    name: contact.name,
    role: contact.role,
    phoneDisplay: contact.phoneDisplay,
    phoneE164: contact.phoneE164,
    isActive: true,
    sortOrder: index + 1,
  })),
}

const ShowroomContext = React.createContext<ShowroomConfig>(
  DEFAULT_SHOWROOM_CONFIG
)

export interface ShowroomProviderProps {
  value?: ShowroomConfig | null
  children: React.ReactNode
}

export function ShowroomProvider({ value, children }: ShowroomProviderProps) {
  const resolvedValue = React.useMemo<ShowroomConfig>(() => {
    if (!value) {
      return DEFAULT_SHOWROOM_CONFIG
    }
    return value
  }, [value])

  return (
    <ShowroomContext.Provider value={resolvedValue}>
      {children}
    </ShowroomContext.Provider>
  )
}

export function useShowroom(): ShowroomConfig {
  return React.useContext(ShowroomContext)
}
