"use client"

import { cn } from "@/lib/utils"

interface Category {
  name: string
  count: number
}

interface CategoryTagsProps {
  categories: Category[]
  position: "left" | "right"
  selectedCategory: string | null
  onCategoryClick: (category: string) => void
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  "Machine Learning": { bg: "bg-pink-500/80", text: "text-white" },
  "Web Development": { bg: "bg-teal-400/80", text: "text-black" },
  "Data Science": { bg: "bg-emerald-300/80", text: "text-black" },
  "DevOps": { bg: "bg-yellow-400/80", text: "text-black" },
  "Mobile Development": { bg: "bg-green-400/80", text: "text-black" },
  "Cloud Computing": { bg: "bg-blue-400/80", text: "text-white" },
  "Cybersecurity": { bg: "bg-red-300/80", text: "text-black" },
  "Blockchain": { bg: "bg-purple-300/80", text: "text-black" },
  "AI Ethics": { bg: "bg-orange-300/80", text: "text-black" },
  "System Design": { bg: "bg-violet-500/80", text: "text-white" },
  "Frontend": { bg: "bg-cyan-400/80", text: "text-black" },
  "Backend": { bg: "bg-orange-400/80", text: "text-black" },
  "Database": { bg: "bg-fuchsia-400/80", text: "text-white" },
  "Testing": { bg: "bg-sky-400/80", text: "text-black" },
  "Architecture": { bg: "bg-rose-400/80", text: "text-white" },
}

function getTagColors(category: string) {
  return (
    CATEGORY_COLORS[category] || { bg: "bg-gray-400/80", text: "text-black" }
  )
}

export function CategoryTags({
  categories,
  position,
  selectedCategory,
  onCategoryClick,
}: CategoryTagsProps) {
  return (
    <div
      className={cn(
        "absolute top-0 bottom-24 z-10 flex flex-col justify-center gap-2 py-8",
        position === "left" ? "left-4" : "right-4",
        position === "left" ? "items-start" : "items-end"
      )}
    >
      {categories.map((category, index) => {
        const colors = getTagColors(category.name)
        const isSelected = selectedCategory === category.name
        const isFiltered = selectedCategory !== null && !isSelected

        return (
          <button
            key={category.name}
            onClick={() => onCategoryClick(category.name)}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-medium",
              "transition-all duration-300 ease-out",
              "hover:scale-105 hover:shadow-lg",
              "focus:outline-none focus:ring-2 focus:ring-white/30",
              colors.bg,
              colors.text,
              isSelected && "ring-2 ring-white shadow-lg scale-105",
              isFiltered && "opacity-30 scale-95"
            )}
            style={{
              animationDelay: `${index * 50}ms`,
            }}
          >
            <span className="whitespace-nowrap">{category.name}</span>
          </button>
        )
      })}
    </div>
  )
}
