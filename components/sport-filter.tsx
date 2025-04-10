"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  ClubIcon as Football,
  TurtleIcon as Tennis,
  ShoppingBasketIcon as Basketball,
  Dumbbell,
  Gamepad2,
  Zap,
} from "lucide-react"

interface SportFilterProps {
  selectedCategory: string
  onCategoryChange: (category: string) => void
}

export function SportFilter({ selectedCategory, onCategoryChange }: SportFilterProps) {
  const categories = [
    { id: "all", name: "Tous", icon: <Zap className="h-4 w-4 mr-1" /> },
    { id: "football", name: "Football", icon: <Football className="h-4 w-4 mr-1" /> },
    { id: "basketball", name: "Basketball", icon: <Basketball className="h-4 w-4 mr-1" /> },
    { id: "tennis", name: "Tennis", icon: <Tennis className="h-4 w-4 mr-1" /> },
    { id: "fighting", name: "MMA/Boxe", icon: <Dumbbell className="h-4 w-4 mr-1" /> },
    { id: "esports", name: "eSports", icon: <Gamepad2 className="h-4 w-4 mr-1" /> },
  ]

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant="outline"
          size="sm"
          className={cn(
            "flex items-center",
            selectedCategory === category.id && "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
          onClick={() => onCategoryChange(category.id)}
        >
          {category.icon}
          {category.name}
        </Button>
      ))}
    </div>
  )
}
