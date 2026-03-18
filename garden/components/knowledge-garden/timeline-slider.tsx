"use client"

import { useMemo } from "react"
import { Slider } from "@/components/ui/slider"

interface TimelineSliderProps {
  value: number
  onChange: (value: number) => void
  isPlaying: boolean
}

function formatDate(progress: number): string {
  const startDate = new Date("2020-01-01")
  const endDate = new Date("2026-01-01")
  const totalMs = endDate.getTime() - startDate.getTime()
  const currentDate = new Date(startDate.getTime() + totalMs * progress)

  return currentDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })
}

export function TimelineSlider({
  value,
  onChange,
  isPlaying,
}: TimelineSliderProps) {
  const dateLabel = useMemo(() => formatDate(value), [value])

  const markers = useMemo(() => {
    const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026]
    return years.map((year) => ({
      year,
      position: ((year - 2020) / 6) * 100,
    }))
  }, [])

  return (
    <div className="relative">
      {/* Year markers */}
      <div className="relative h-4 mb-2">
        {markers.map((marker) => (
          <div
            key={marker.year}
            className="absolute top-0 transform -translate-x-1/2"
            style={{ left: `${marker.position}%` }}
          >
            <div className="w-px h-2 bg-muted-foreground/30" />
            <span className="text-[10px] text-muted-foreground font-mono">
              {marker.year}
            </span>
          </div>
        ))}
      </div>

      {/* Current date indicator */}
      <div
        className="absolute -top-8 transform -translate-x-1/2 pointer-events-none"
        style={{ left: `${value * 100}%` }}
      >
        <div className="bg-primary text-primary-foreground px-2 py-0.5 rounded text-xs font-medium shadow-lg">
          {dateLabel}
        </div>
      </div>

      {/* Timeline track */}
      <div className="relative py-2">
        <Slider
          value={[value * 100]}
          onValueChange={([v]) => onChange(v / 100)}
          max={100}
          step={0.1}
          className="w-full"
        />

        {/* Glow effect under thumb position */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full pointer-events-none"
          style={{
            left: `${value * 100}%`,
            transform: "translate(-50%, -50%)",
            background: isPlaying
              ? "radial-gradient(circle, rgba(78, 205, 196, 0.6) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(255, 107, 157, 0.4) 0%, transparent 70%)",
            filter: "blur(8px)",
          }}
        />
      </div>
    </div>
  )
}
