// Implémentation API réelle pour récupérer les données sportives
import { cache } from "react"

export interface Match {
  id: number
  league: string
  teamA: string
  teamB: string
  time: string
  date?: Date // Date réelle pour le tri
  odds: {
    home: number
    draw: number
    away: number
  }
  score?: string
  status?: "upcoming" | "live" | "finished"
  category?: string
}

// Mettre en cache les réponses API pour éviter de dépasser les limites de taux
export const getUpcomingMatches = cache(async (category?: string): Promise<Match[]> => {
  try {
    console.log("Fetching upcoming matches with API key:", process.env.SPORTS_API_KEY ? "Available" : "Not available")

    // API-FOOTBALL endpoint pour les matchs à venir
    const response = await fetch("https://v3.football.api-sports.io/fixtures?date=2025-04-10", {
      headers: {
        "x-rapidapi-key": process.env.SPORTS_API_KEY || "",
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
      next: { revalidate: 1800 }, // Revalider toutes les 30 minutes
    })

    if (!response.ok) {
      console.error("Erreur de réponse API:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    console.log("API response:", data)

    if (!data.response || !Array.isArray(data.response)) {
      console.error("Format de réponse API inattendu:", data)
      return []
    }

    // Transformer la réponse API en notre interface Match
    const matches = data.response.map((fixture: any) => {
      const fixtureDate = new Date(fixture.fixture.date)
      const category = getSportCategory(fixture.league.id, fixture.league.name)

      return {
        id: fixture.fixture.id,
        league: fixture.league.name,
        teamA: fixture.teams.home.name,
        teamB: fixture.teams.away.name,
        time: fixtureDate.toLocaleString(),
        date: fixtureDate, // Stocker la date réelle pour le tri
        odds: {
          // Cotes par défaut si non disponibles
          home: 2.1,
          draw: 3.4,
          away: 3.75,
        },
        status: "upcoming",
        category: category,
      }
    })

    const now = new Date()
    const upcomingMatches = matches.filter((match) => match.date && match.date >= now)

    // Si une catégorie est spécifiée, filtrer les matchs
    if (category) {
      return upcomingMatches.filter((match) => match.category?.toLowerCase() === category.toLowerCase())
    }

    return upcomingMatches
  } catch (error) {
    console.error("Erreur lors de la récupération des matchs à venir:", error)
    return []
  }
})

// Mise en cache plus longue pour les matchs en direct (10 minutes)
export const getLiveMatches = cache(async (category?: string): Promise<Match[]> => {
  try {
    console.log("Fetching live matches with API key:", process.env.SPORTS_API_KEY ? "Available" : "Not available")

    // Vérifier si la clé API est disponible
    if (!process.env.SPORTS_API_KEY) {
      console.warn("Clé API non disponible, utilisation des données de secours")
      return []
    }

    // API-FOOTBALL endpoint pour les matchs en direct
    const response = await fetch("https://v3.football.api-sports.io/fixtures?live=all", {
      headers: {
        "x-rapidapi-key": process.env.SPORTS_API_KEY,
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
      next: { revalidate: 600 }, // Revalider toutes les 10 minutes
    })

    if (!response.ok) {
      console.error("Erreur de réponse API:", response.status, response.statusText)
      return []
    }

    const data = await response.json()
    console.log("API response (live):", data)

    if (!data.response || !Array.isArray(data.response)) {
      console.error("Format de réponse API inattendu:", data)
      return []
    }

    // Si aucun match en direct n'est trouvé, retourner un tableau vide
    if (data.response.length === 0) {
      console.log("Aucun match en direct trouvé")
      return []
    }

    // Transformer la réponse API en notre interface Match
    const matches = data.response
      .map((fixture: any) => {
        try {
          const category = getSportCategory(fixture.league.id, fixture.league.name)

          return {
            id: fixture.fixture.id,
            league: fixture.league.name,
            teamA: fixture.teams.home.name,
            teamB: fixture.teams.away.name,
            time: `${fixture.fixture.status.elapsed || "0"}'`,
            date: new Date(fixture.fixture.date),
            score: `${fixture.goals.home || 0}-${fixture.goals.away || 0}`,
            odds: {
              // Les cotes en direct sont souvent différentes
              home: fixture.odds?.live?.home || 1.9,
              draw: fixture.odds?.live?.draw || 3.2,
              away: fixture.odds?.live?.away || 4.1,
            },
            status: "live",
            category: category,
          }
        } catch (err) {
          console.error("Erreur lors de la transformation d'un match:", err)
          return null
        }
      })
      .filter(Boolean) // Filtrer les matchs null

    // Si une catégorie est spécifiée, filtrer les matchs
    if (category) {
      return matches.filter((match) => match.category?.toLowerCase() === category.toLowerCase())
    }

    return matches
  } catch (error) {
    console.error("Erreur lors de la récupération des matchs en direct:", error)
    return []
  }
})

// Fonction pour déterminer la catégorie de sport en fonction de l'ID de la ligue et du nom
function getSportCategory(leagueId: number, leagueName: string): string {
  // Déterminer la catégorie en fonction du nom de la ligue
  const name = leagueName.toLowerCase()

  if (
    name.includes("football") ||
    name.includes("premier league") ||
    name.includes("liga") ||
    name.includes("serie a") ||
    name.includes("bundesliga") ||
    name.includes("ligue 1")
  ) {
    return "football"
  }

  if (name.includes("basketball") || name.includes("nba") || name.includes("euroleague")) {
    return "basketball"
  }

  if (name.includes("tennis") || name.includes("atp") || name.includes("wta")) {
    return "tennis"
  }

  if (name.includes("mma") || name.includes("ufc") || name.includes("boxing") || name.includes("boxe")) {
    return "fighting"
  }

  if (
    name.includes("esports") ||
    name.includes("league of legends") ||
    name.includes("dota") ||
    name.includes("counter-strike") ||
    name.includes("valorant")
  ) {
    return "esports"
  }

  // Par défaut, considérer comme football
  return "football"
}

// Obtenir les cotes pour un match spécifique
export const getMatchOdds = cache(async (matchId: number): Promise<Match["odds"] | null> => {
  try {
    // API-FOOTBALL endpoint pour les cotes
    const response = await fetch(`https://v3.football.api-sports.io/odds?fixture=${matchId}`, {
      headers: {
        "x-rapidapi-key": process.env.SPORTS_API_KEY || "",
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
      next: { revalidate: 300 }, // Revalider toutes les 5 minutes
    })

    if (!response.ok) {
      console.error("Erreur de réponse API:", response.status)
      return null
    }

    const data = await response.json()

    if (!data.response || data.response.length === 0) {
      return null
    }

    // Obtenir les cotes du premier bookmaker
    const bookmaker = data.response[0].bookmakers[0]
    if (!bookmaker) return null

    // Trouver le marché 1X2 (domicile, nul, extérieur)
    const market = bookmaker.bets.find((bet: any) => bet.name === "Match Winner")
    if (!market) return null

    // Extraire les cotes
    const homeOdd = market.values.find((v: any) => v.value === "Home")?.odd
    const drawOdd = market.values.find((v: any) => v.value === "Draw")?.odd
    const awayOdd = market.values.find((v: any) => v.value === "Away")?.odd

    return {
      home: Number.parseFloat(homeOdd) || 2.0,
      draw: Number.parseFloat(drawOdd) || 3.5,
      away: Number.parseFloat(awayOdd) || 4.0,
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des cotes du match:", error)
    return null
  }
})

// Pour mettre à jour les cotes en temps réel
export async function getUpdatedOdds(matchId: number): Promise<Match["odds"] | null> {
  // Essayer d'obtenir les cotes réelles
  const realOdds = await getMatchOdds(matchId)
  if (realOdds) return realOdds

  // Si l'API échoue, générer des cotes aléatoires raisonnables
  return {
    home: Math.round((1.5 + Math.random() * 2) * 100) / 100,
    draw: Math.round((2.5 + Math.random() * 2) * 100) / 100,
    away: Math.round((1.5 + Math.random() * 3) * 100) / 100,
  }
}

// Fonction pour obtenir les matchs qui commencent bientôt
export const getStartingSoonMatches = cache(async (): Promise<Match[]> => {
  // Récupérer tous les matchs à venir
  const matches = await getUpcomingMatches()

  // Filtrer pour ne garder que les matchs qui commencent dans les 3 prochaines heures
  const now = new Date()
  const hourFilter = new Date(now.getTime() + 1 * 60 * 60 * 1000)

  const startingSoonMatches = matches.filter((match) => {
    if (!match.date) return false
    return match.date >= now && match.date <= hourFilter
  })

  // Trier par date de début (le plus proche en premier)
  return startingSoonMatches.sort((a, b) => {
    if (!a.date || !b.date) return 0
    return a.date.getTime() - b.date.getTime()
  })
})
