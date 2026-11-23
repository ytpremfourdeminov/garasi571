import * as React from "react"
import { cn } from "cn"

export interface ErrorStateViewProps {
  variant: "not-found" | "error"
  title: string
  description: string
  actions: React.ReactNode
  className?: string
  fullScreen?: boolean
}

function NotFoundIllustration() {
  return (
    <svg
      viewBox="0 0 360 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-auto w-full max-w-[300px] sm:max-w-[340px]"
    >
      {/* Background horizontal motion streaks */}
      <rect x="26" y="64" width="62" height="10" rx="5" fill="#E5E2DC" />
      <rect x="12" y="90" width="44" height="10" rx="5" fill="#E5E2DC" />
      <rect x="44" y="114" width="52" height="10" rx="5" fill="#E5E2DC" />
      <rect x="268" y="48" width="66" height="10" rx="5" fill="#E5E2DC" />
      <rect x="288" y="74" width="52" height="10" rx="5" fill="#E5E2DC" />
      <rect x="262" y="102" width="72" height="10" rx="5" fill="#E5E2DC" />
      <rect x="128" y="28" width="96" height="10" rx="5" fill="#E5E2DC" />

      {/* Left "4" */}
      <path
        d="M112 46L66 112H112V138C112 144.627 117.373 150 124 150C130.627 150 136 144.627 136 138V112H144C150.627 112 156 106.627 156 100C156 93.3726 150.627 88 144 88H136V54C136 45.2 128.4 39.6 120.4 42.4C117 43.6 114 44.8 112 46Z"
        fill="#FFFFFF"
        stroke="#161514"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M112 68L88 100H112V68Z"
        fill="#FAF9F7"
        stroke="#161514"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Right "4" */}
      <path
        d="M244 46L198 112H244V138C244 144.627 249.373 150 256 150C262.627 150 268 144.627 268 138V112H276C282.627 112 288 106.627 288 100C288 93.3726 282.627 88 276 88H268V54C268 45.2 260.4 39.6 252.4 42.4C249 43.6 246 44.8 244 46Z"
        fill="#FFFFFF"
        stroke="#161514"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M244 68L220 100H244V68Z"
        fill="#FAF9F7"
        stroke="#161514"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* Center Magnifying Glass ("0") */}
      <circle
        cx="180"
        cy="94"
        r="48"
        fill="#FFFFFF"
        stroke="#161514"
        strokeWidth="3.5"
      />
      <circle
        cx="180"
        cy="94"
        r="36"
        fill="#FAF9F7"
        stroke="#161514"
        strokeWidth="3"
      />

      {/* Broken / Missing Fragment Inside Lens */}
      <path
        d="M156 88L168 78L178 86L192 74L204 88L194 102L182 114L168 104L156 88Z"
        fill="#B91C1C"
        stroke="#161514"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M150 94L162 90M198 96L210 92M176 62L180 74M178 114L174 126"
        stroke="#161514"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Magnifying Glass Handle */}
      <path
        d="M214 128L244 158C248.418 162.418 248.418 169.582 244 174C239.582 178.418 232.418 178.418 228 174L198 144"
        fill="#FFFFFF"
        stroke="#161514"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ServerErrorIllustration() {
  return (
    <svg
      viewBox="0 0 360 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-auto w-full max-w-[300px] sm:max-w-[340px]"
    >
      {/* Background horizontal motion streaks */}
      <rect x="24" y="66" width="58" height="10" rx="5" fill="#E5E2DC" />
      <rect x="14" y="94" width="42" height="10" rx="5" fill="#E5E2DC" />
      <rect x="40" y="120" width="56" height="10" rx="5" fill="#E5E2DC" />
      <rect x="272" y="54" width="64" height="10" rx="5" fill="#E5E2DC" />
      <rect x="292" y="82" width="50" height="10" rx="5" fill="#E5E2DC" />
      <rect x="266" y="110" width="68" height="10" rx="5" fill="#E5E2DC" />
      <rect x="132" y="26" width="96" height="10" rx="5" fill="#E5E2DC" />

      {/* Minimalist Car Silhouette Body */}
      <path
        d="M84 128V104C84 96.268 90.268 90 98 90H116L134 62C137.3 56.8 143 54 149.2 54H210.8C217 54 222.7 56.8 226 62L244 90H262C269.732 90 276 96.268 276 104V128C276 132.418 272.418 136 268 136H92C87.5817 136 84 132.418 84 128Z"
        fill="#FFFFFF"
        stroke="#161514"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      {/* Windshield */}
      <path
        d="M128 90L142 66H218L232 90H128Z"
        fill="#FAF9F7"
        stroke="#161514"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      {/* Grille */}
      <rect
        x="148"
        y="106"
        width="64"
        height="18"
        rx="4"
        fill="#FAF9F7"
        stroke="#161514"
        strokeWidth="3"
      />
      {/* Headlights */}
      <circle
        cx="112"
        cy="112"
        r="9"
        fill="#FAF9F7"
        stroke="#161514"
        strokeWidth="3"
      />
      <circle
        cx="248"
        cy="112"
        r="9"
        fill="#FAF9F7"
        stroke="#161514"
        strokeWidth="3"
      />
      {/* Wheels */}
      <path
        d="M96 136V148C96 152.418 99.5817 156 104 156H118C122.418 156 126 152.418 126 148V136"
        fill="#FFFFFF"
        stroke="#161514"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
      <path
        d="M234 136V148C234 152.418 237.582 156 242 156H256C260.418 156 264 152.418 264 148V136"
        fill="#FFFFFF"
        stroke="#161514"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      {/* Crimson Alert Badge Overlay */}
      <path
        d="M180 34L204 76H156L180 34Z"
        fill="#B91C1C"
        stroke="#161514"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M180 50V61"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="180" cy="68" r="1.75" fill="#FFFFFF" />
    </svg>
  )
}

export function ErrorStateView({
  variant,
  title,
  description,
  actions,
  className,
  fullScreen = false,
}: ErrorStateViewProps) {
  const content = (
    <section
      className={cn(
        "mx-auto flex w-full max-w-xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24",
        className
      )}
    >
      {variant === "not-found" ? (
        <NotFoundIllustration />
      ) : (
        <ServerErrorIllustration />
      )}

      <h1 className="mt-6 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        {title}
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-muted-foreground sm:text-base">
        {description}
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {actions}
      </div>
    </section>
  )

  if (fullScreen) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background text-foreground">
        {content}
      </main>
    )
  }

  return content
}
