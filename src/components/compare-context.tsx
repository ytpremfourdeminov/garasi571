import * as React from "react"
import { CARS, type CarUnit } from "@/data/cars"

const MAX_COMPARE_CARS = 3

interface CompareContextValue {
  selectedSlugs: string[]
  selectedCars: CarUnit[]
  isSelected: (slug: string) => boolean
  toggleCompare: (slug: string) => void
  removeCompare: (slug: string) => void
  clearCompare: () => void
  isDialogOpen: boolean
  setDialogOpen: React.Dispatch<React.SetStateAction<boolean>>
  maxReached: boolean
  announcement: string
}

const CompareContext = React.createContext<CompareContextValue | null>(null)

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selectedSlugs, setSelectedSlugs] = React.useState<string[]>([])
  const [isDialogOpen, setDialogOpen] = React.useState(false)
  const [announcement, setAnnouncement] = React.useState("")

  const selectedCars = React.useMemo(() => {
    const carMap = new Map(CARS.map((car) => [car.slug, car]))
    return selectedSlugs
      .map((slug) => carMap.get(slug))
      .filter((car): car is CarUnit => Boolean(car))
  }, [selectedSlugs])

  const isSelected = React.useCallback(
    (slug: string) => selectedSlugs.includes(slug),
    [selectedSlugs]
  )

  const toggleCompare = React.useCallback((slug: string) => {
    const car = CARS.find((item) => item.slug === slug)
    const label = car ? car.shortName : "Unit"

    setSelectedSlugs((prev) => {
      if (prev.includes(slug)) {
        const next = prev.filter((item) => item !== slug)
        setAnnouncement(
          next.length === 0
            ? `${label} dihapus. Daftar perbandingan kosong.`
            : `${label} dihapus dari perbandingan (${next.length}/3).`
        )
        if (next.length === 0) {
          setDialogOpen(false)
        }
        return next
      }

      if (prev.length >= MAX_COMPARE_CARS) {
        setAnnouncement(
          "Maksimal 3 unit dapat dibandingkan sekaligus. Hapus salah satu unit terlebih dahulu."
        )
        return prev
      }

      const next = [...prev, slug]
      setAnnouncement(
        `${label} ditambahkan ke perbandingan (${next.length}/3).`
      )
      return next
    })
  }, [])

  const removeCompare = React.useCallback((slug: string) => {
    const car = CARS.find((item) => item.slug === slug)
    const label = car ? car.shortName : "Unit"

    setSelectedSlugs((prev) => {
      if (!prev.includes(slug)) {
        return prev
      }
      const next = prev.filter((item) => item !== slug)
      setAnnouncement(
        next.length === 0
          ? `${label} dihapus. Daftar perbandingan kosong.`
          : `${label} dihapus dari perbandingan (${next.length}/3).`
      )
      if (next.length === 0) {
        setDialogOpen(false)
      }
      return next
    })
  }, [])

  const clearCompare = React.useCallback(() => {
    setSelectedSlugs([])
    setDialogOpen(false)
    setAnnouncement("Daftar perbandingan dikosongkan.")
  }, [])

  const maxReached = selectedSlugs.length >= MAX_COMPARE_CARS

  const value = React.useMemo<CompareContextValue>(
    () => ({
      selectedSlugs,
      selectedCars,
      isSelected,
      toggleCompare,
      removeCompare,
      clearCompare,
      isDialogOpen,
      setDialogOpen,
      maxReached,
      announcement,
    }),
    [
      selectedSlugs,
      selectedCars,
      isSelected,
      toggleCompare,
      removeCompare,
      clearCompare,
      isDialogOpen,
      maxReached,
      announcement,
    ]
  )

  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  )
}

export function useCompare(): CompareContextValue {
  const context = React.useContext(CompareContext)
  if (!context) {
    throw new Error("useCompare harus digunakan di dalam CompareProvider.")
  }
  return context
}
