"use client"

import { useState, useEffect } from "react"
import { BettingCategories } from "@/components/betting-categories"
import { MatchCard } from "@/components/match-card"
import { getStartingSoonMatches } from "@/lib/match-data"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { SportFilter } from "@/components/sport-filter"
import type { Match } from "@/lib/match-data"

export default function StartingSoonPage() {
  const [startingSoonMatches, setStartingSoonMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMatches = async () => {
      setIsLoading(true)
      try {
        const matches = await getStartingSoonMatches()
        setStartingSoonMatches(matches)
        setFilteredMatches(matches)
      } catch (error) {
        console.error("Erreur lors de la récupération des matchs imminents:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMatches()
  }, [])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    if (category === "all") {
      setFilteredMatches(startingSoonMatches)
    } else {
      setFilteredMatches(startingSoonMatches.filter((match) => match.category === category))
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <h1 className="text-3xl font-bold">Matchs Imminents</h1>
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
          <Clock className="h-4 w-4 mr-1" /> Bientôt
        </Badge>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
          <BettingCategories />
        </div>

        <div className="md:w-3/4">
          <SportFilter selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />

          {isLoading ? (
            <div className="text-center py-12">Chargement des matchs imminents...</div>
          ) : filteredMatches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {selectedCategory === "all"
                ? "Aucun match imminent disponible pour le moment. Veuillez vérifier plus tard."
                : `Aucun match imminent disponible pour le moment dans la catégorie ${selectedCategory}.`}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredMatches.map((match) => (
                <MatchCard
                  key={match.id}
                  id={match.id}
                  league={match.league}
                  teamA={match.teamA}
                  teamB={match.teamB}
                  time={match.time}
                  odds={match.odds}
                  compact={false}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
