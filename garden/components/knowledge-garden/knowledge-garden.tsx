"use client"

import { Canvas } from "@react-three/fiber"
import { Suspense, useState, useCallback, useMemo } from "react"
import { GardenScene } from "./garden-scene"
import { CategoryTags } from "./category-tags"
import { TimelineSlider } from "./timeline-slider"
import { ControlPanel } from "./control-panel"
import { generateNotes } from "@/lib/generate-notes"

export function KnowledgeGarden() {
  const [currentTime, setCurrentTime] = useState(0.5)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [hoveredNote, setHoveredNote] = useState<string | null>(null)

  const notes = useMemo(() => generateNotes(150), [])

  const categories = useMemo(() => {
    const cats = [...new Set(notes.map((n) => n.category))]
    return cats.map((cat) => ({
      name: cat,
      count: notes.filter((n) => n.category === cat).length,
    }))
  }, [notes])

  const handleCategoryClick = useCallback((category: string) => {
    setSelectedCategory((prev) => (prev === category ? null : category))
  }, [])

  const handlePlayPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
  }, [])

  return (
    <div className="relative w-full h-screen bg-background overflow-hidden">
      {/* Left Category Tags */}
      <CategoryTags
        categories={categories.slice(0, Math.ceil(categories.length / 2))}
        position="left"
        selectedCategory={selectedCategory}
        onCategoryClick={handleCategoryClick}
      />

      {/* Right Category Tags */}
      <CategoryTags
        categories={categories.slice(Math.ceil(categories.length / 2))}
        position="right"
        selectedCategory={selectedCategory}
        onCategoryClick={handleCategoryClick}
      />

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        className="absolute inset-0"
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <GardenScene
            notes={notes}
            currentTime={currentTime}
            selectedCategory={selectedCategory}
            hoveredNote={hoveredNote}
            onHoverNote={setHoveredNote}
            isPlaying={isPlaying}
            onTimeUpdate={setCurrentTime}
          />
        </Suspense>
      </Canvas>

      {/* Hovered Note Info */}
      {hoveredNote && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-card/90 backdrop-blur-sm border border-border rounded-lg px-4 py-2 shadow-xl">
            <p className="text-sm text-foreground font-medium">
              {notes.find((n) => n.id === hoveredNote)?.title}
            </p>
          </div>
        </div>
      )}

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          <TimelineSlider
            value={currentTime}
            onChange={setCurrentTime}
            isPlaying={isPlaying}
          />
          <ControlPanel
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
            currentTime={currentTime}
          />
        </div>
      </div>

      {/* Top Right Info */}
      <div className="absolute top-4 right-4 text-right">
        <p className="text-xs text-muted-foreground font-mono">FPS</p>
        <p className="text-xs text-muted-foreground font-mono">v1.0</p>
      </div>
    </div>
  )
}
