"use client"

import { useState, useEffect } from "react"
import { BettingCategories } from "@/components/betting-categories"
import { Badge } from "@/components/ui/badge"
import { SportFilter } from "@/components/sport-filter"
import type { Match } from "@/lib/match-data"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

// Données de secours pour les matchs en direct
const FALLBACK_LIVE_MATCHES: Match[] = [
  {
    id: 101,
    league: "Premier League",
    teamA: "Chelsea",
    teamB: "Arsenal",
    time: "45'",
    score: "1-0",
    odds: { home: 1.65, draw: 3.75, away: 5.5 },
    status: "live",
    category: "football",
  },
  {
    id: 102,
    league: "La Liga",
    teamA: "Atletico Madrid",
    teamB: "Valencia",
    time: "32'",
    score: "0-0",
    odds: { home: 1.9, draw: 2.8, away: 4.5 },
    status: "live",
    category: "football",
  },
  {
    id: 103,
    league: "NBA",
    teamA: "Miami Heat",
    teamB: "Chicago Bulls",
    time: "3Q",
    score: "67-72",
    odds: { home: 2.5, draw: 15.0, away: 1.6 },
    status: "live",
    category: "basketball",
  },
  {
    id: 104,
    league: "ATP Masters",
    teamA: "Daniil Medvedev",
    teamB: "Alexander Zverev",
    time: "2e Set",
    score: "6-4, 3-2",
    odds: { home: 1.4, draw: 20.0, away: 3.1 },
    status: "live",
    category: "tennis",
  },
]

export default function LivePage() {
  const [liveMatches, setLiveMatches] = useState<Match[]>([])
  const [filteredMatches, setFilteredMatches] = useState<Match[]>([])
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useFallback, setUseFallback] = useState(false)

  const fetchLiveMatches = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Utiliser directement l'API route pour éviter les problèmes CORS
      const response = await fetch("/api/matches?type=live", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })

      if (!response.ok) {
        console.error("Erreur de réponse API:", response.status, response.statusText)
        throw new Error(`Erreur API: ${response.status}`)
      }

      const data = await response.json()

      if (!data.matches || !Array.isArray(data.matches) || data.matches.length === 0) {
        console.log("Aucun match en direct trouvé, utilisation des données de secours")
        setUseFallback(true)
        setLiveMatches(FALLBACK_LIVE_MATCHES)
        setFilteredMatches(FALLBACK_LIVE_MATCHES)
      } else {
        setUseFallback(false)
        setLiveMatches(data.matches)
        setFilteredMatches(data.matches)
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des matchs en direct:", error)
      setError("Impossible de charger les matchs en direct. Utilisation des données de secours.")
      setUseFallback(true)
      setLiveMatches(FALLBACK_LIVE_MATCHES)
      setFilteredMatches(FALLBACK_LIVE_MATCHES)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Charger les matchs une seule fois au chargement de la page
    fetchLiveMatches()
  }, [])

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    if (category === "all") {
      setFilteredMatches(liveMatches)
    } else {
      setFilteredMatches(liveMatches.filter((match) => match.category === category))
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Matchs en Direct</h1>
          <Badge variant="outline" className="bg-red-500/10 text-red-500">
            Direct
          </Badge>
        </div>

        {useFallback && (
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLiveMatches}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Réessayer
          </Button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
          <BettingCategories />
        </div>

        <div className="md:w-3/4">
          <SportFilter selectedCategory={selectedCategory} onCategoryChange={handleCategoryChange} />

          {isLoading ? (
            <div className="text-center py-12">Chargement des matchs en direct...</div>
          ) : error ? (
            <div className="text-center py-6 text-amber-600 mb-4">{error}</div>
          ) : null}

          {useFallback && (
            <div className="text-center py-4 text-amber-600 mb-4 text-sm bg-amber-50 rounded-md border border-amber-200 px-4">
              Affichage des données de démonstration. Les matchs réels ne sont pas disponibles pour le moment.
            </div>
          )}

          {filteredMatches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {selectedCategory === "all"
                ? "Aucun match en direct disponible pour le moment."
                : `Aucun match en direct disponible pour le moment dans la catégorie ${selectedCategory}.`}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredMatches.map((match) => (
                <div key={match.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-muted-foreground">{match.league}</span>
                    <Badge variant="outline" className="bg-red-500/10 text-red-500">
                      {match.time}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <div className="text-lg font-semibold">{match.teamA}</div>
                    <div className="text-xl font-bold">{match.score}</div>
                    <div className="text-lg font-semibold">{match.teamB}</div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 py-2 px-3 border rounded-md text-center hover:bg-accent">
                      {match.odds.home.toFixed(2)}
                    </button>
                    <button className="flex-1 py-2 px-3 border rounded-md text-center hover:bg-accent">
                      {match.odds.draw.toFixed(2)}
                    </button>
                    <button className="flex-1 py-2 px-3 border rounded-md text-center hover:bg-accent">
                      {match.odds.away.toFixed(2)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
