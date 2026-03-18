"use client"

import { Play, Pause, RotateCcw, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ControlPanelProps {
  isPlaying: boolean
  onPlayPause: () => void
  currentTime: number
}

export function ControlPanel({
  isPlaying,
  onPlayPause,
  currentTime,
}: ControlPanelProps) {
  const formatTime = (time: number) => {
    const minutes = Math.floor(time * 60)
    const seconds = Math.floor((time * 60 - minutes) * 60)
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className="flex items-center justify-between">
      {/* Left side - Play controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPlayPause}
          className="h-10 w-10 rounded-full bg-secondary/50 hover:bg-secondary text-foreground"
        >
          {isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5 ml-0.5" />
          )}
        </Button>

        <span className="text-sm text-muted-foreground font-mono min-w-[48px]">
          {formatTime(currentTime)} / 60:00
        </span>
      </div>

      {/* Center - Timeline markers */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400" />
          <span className="text-xs text-muted-foreground">Feb 2020</span>
        </div>
        <div className="w-16 h-px bg-gradient-to-r from-teal-400/50 to-pink-400/50" />
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-pink-400" />
          <span className="text-xs text-muted-foreground">Feb 2026</span>
        </div>
      </div>

      {/* Right side - View controls */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
