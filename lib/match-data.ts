// Implémentation API réelle pour récupérer les données sportives
import { cache } from "react"
import { supabase } from "./supabase"

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

// Interface pour la table de cache dans Supabase
export interface MatchCache {
  id: number // Changed from string to int
  matches: Match[]
  last_updated: string
  type: "upcoming" | "live"
  category?: string
}

// Fonction pour vérifier si le cache est valide en fonction de l'heure
function isCacheValid(lastUpdated: string): boolean {
  const now = new Date()
  const lastUpdate = new Date(lastUpdated)
  const hourOfDay = now.getHours()

  // Calculer la différence en minutes
  const diffInMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60))

  // Entre 18h (6PM) et 1h du matin, mettre à jour toutes les 30 minutes
  if ((hourOfDay >= 18 && hourOfDay <= 23) || hourOfDay < 1) {
    return diffInMinutes < 30
  }

  // Le reste de la journée, mettre à jour toutes les 2 heures (120 minutes)
  return diffInMinutes < 120
}

// Map des identifiants de cache strings vers des nombres
const CACHE_ID_MAP = {
  upcoming: 1,
  live: 2,
  upcoming_football: 3,
  live_football: 4,
  upcoming_basketball: 5,
  live_basketball: 6,
  upcoming_tennis: 7,
  live_tennis: 8,
  upcoming_fighting: 9,
  live_fighting: 10,
  upcoming_esports: 11,
  live_esports: 12
}

// Fonction pour obtenir l'ID numérique du cache
function getCacheNumericId(type: "upcoming" | "live", category?: string): number {
  const cacheKey = category ? `${type}_${category}` : type
  const numericId = CACHE_ID_MAP[cacheKey as keyof typeof CACHE_ID_MAP]

  if (!numericId) {
    // Si l'ID n'existe pas dans le mapping, utiliser une valeur par défaut basée sur un hash simple
    return stringToNumber(cacheKey)
  }

  return numericId
}

// Fonction pour convertir une chaîne en nombre (pour les catégories non prédéfinies)
function stringToNumber(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash = hash & hash // Convert to 32bit integer
  }
  // Assurer que le hash est positif et éloigné des IDs prédéfinis
  return Math.abs(hash) % 1000000 + 1000
}

// Fonction pour récupérer les matchs depuis le cache Supabase
async function getMatchesFromCache(type: "upcoming" | "live", category?: string): Promise<Match[] | null> {
  try {
    // Obtenir l'ID numérique du cache
    const numericCacheId = getCacheNumericId(type, category)

    // Récupérer les données du cache
    const { data, error } = await supabase
      .from('match_cache')
      .select('*')
      .eq('id', numericCacheId)
      .maybeSingle()

    if (error || !data) {
      console.log(`Pas de cache trouvé pour ${type}${category ? '_' + category : ''} (ID: ${numericCacheId}):`, error)
      return null
    }

    // Vérifier si le cache est valide
    if (!isCacheValid(data.last_updated)) {
      console.log(`Cache expiré pour ${type}${category ? '_' + category : ''} (ID: ${numericCacheId}), dernière mise à jour:`, data.last_updated)
      return null
    }

    console.log(`Utilisation du cache pour ${type}${category ? '_' + category : ''} (ID: ${numericCacheId}), dernière mise à jour:`, data.last_updated)

    // Convertir les dates string en objets Date
    const matches = data.matches.map((match: any) => ({
      ...match,
      date: match.date ? new Date(match.date) : undefined
    }))

    return matches
  } catch (error) {
    console.error("Erreur lors de la récupération du cache:", error)
    return null
  }
}

// Fonction pour mettre à jour le cache dans Supabase
async function updateMatchCache(matches: Match[], type: "upcoming" | "live", category?: string): Promise<void> {
  try {
    // Obtenir l'ID numérique du cache
    const numericCacheId = getCacheNumericId(type, category)

    // Préparer les données pour le stockage
    // Convertir les objets Date en strings pour le stockage JSON
    const matchesForStorage = matches.map(match => ({
      ...match,
      date: match.date ? match.date.toISOString() : undefined
    }))

    // Mettre à jour ou insérer dans le cache
    const { error } = await supabase
      .from('match_cache')
      .upsert({
        id: numericCacheId,
        matches: matchesForStorage,
        last_updated: new Date().toISOString(),
        type,
        category
      })

    if (error) {
      console.error(`Erreur lors de la mise à jour du cache pour ${type}${category ? '_' + category : ''} (ID: ${numericCacheId}):`, error)
    } else {
      console.log(`Cache mis à jour pour ${type}${category ? '_' + category : ''} (ID: ${numericCacheId})`)
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du cache:", error)
  }
}

// Mettre en cache les réponses API pour éviter de dépasser les limites de taux
export const getUpcomingMatches = cache(async (category?: string): Promise<Match[]> => {
  try {
    // Vérifier d'abord si nous avons des données en cache valides
    const cachedMatches = await getMatchesFromCache("upcoming", category)
    if (cachedMatches) {
      console.log("Utilisation des données en cache pour les matchs à venir")
      return cachedMatches
    }

    console.log("Pas de cache valide, appel de l'API pour les matchs à venir")
    console.log("Fetching upcoming matches with API key:", process.env.SPORTS_API_KEY ? "Available" : "Not available")

    // Get the current date in YYYY-MM-DD format
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];

    // API-FOOTBALL endpoint pour les matchs à venir - changed to use current date
    const response = await fetch(`https://v3.football.api-sports.io/fixtures?date=${formattedDate}`, {
      headers: {
        "x-rapidapi-key": process.env.SPORTS_API_KEY || "",
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
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

    // Filtrer par catégorie si nécessaire
    const filteredMatches = category
      ? upcomingMatches.filter((match) => match.category?.toLowerCase() === category.toLowerCase())
      : upcomingMatches

    // Mettre à jour le cache avec les nouvelles données
    await updateMatchCache(filteredMatches, "upcoming", category)

    return filteredMatches
  } catch (error) {
    console.error("Erreur lors de la récupération des matchs à venir:", error)

    // En cas d'erreur, essayer de récupérer les données du cache même si elles sont expirées
    try {
      // Obtenir l'ID numérique du cache
      const numericCacheId = getCacheNumericId("upcoming", category)

      const { data } = await supabase
        .from('match_cache')
        .select('*')
        .eq('id', numericCacheId)
        .maybeSingle()

      if (data && data.matches) {
        console.log("Utilisation du cache expiré en cas d'erreur API")
        return data.matches.map((match: any) => ({
          ...match,
          date: match.date ? new Date(match.date) : undefined
        }))
      }
    } catch (cacheError) {
      console.error("Erreur lors de la récupération du cache de secours:", cacheError)
    }

    return []
  }
})

// Mise en cache plus longue pour les matchs en direct
export const getLiveMatches = cache(async (category?: string): Promise<Match[]> => {
  try {
    // Vérifier d'abord si nous avons des données en cache valides
    // Pour les matchs en direct, nous utilisons un temps de cache plus court
    const cachedMatches = await getMatchesFromCache("live", category)
    if (cachedMatches) {
      console.log("Utilisation des données en cache pour les matchs en direct")
      return cachedMatches
    }

    console.log("Pas de cache valide, appel de l'API pour les matchs en direct")
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

    // Filtrer par catégorie si nécessaire
    const filteredMatches = category
      ? matches.filter((match) => match.category?.toLowerCase() === category.toLowerCase())
      : matches

    // Mettre à jour le cache avec les nouvelles données
    await updateMatchCache(filteredMatches, "live", category)

    return filteredMatches
  } catch (error) {
    console.error("Erreur lors de la récupération des matchs en direct:", error)

    // En cas d'erreur, essayer de récupérer les données du cache même si elles sont expirées
    try {
      // Obtenir l'ID numérique du cache
      const numericCacheId = getCacheNumericId("live", category)

      const { data } = await supabase
        .from('match_cache')
        .select('*')
        .eq('id', numericCacheId)
        .maybeSingle()

      if (data && data.matches) {
        console.log("Utilisation du cache expiré en cas d'erreur API")
        return data.matches.map((match: any) => ({
          ...match,
          date: match.date ? new Date(match.date) : undefined
        }))
      }
    } catch (cacheError) {
      console.error("Erreur lors de la récupération du cache de secours:", cacheError)
    }

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

// Map des identifiants de cache pour les cotes
function getOddsCacheNumericId(matchId: number): number {
  // Préfixe pour garantir que l'ID est différent des autres caches
  return 100000 + matchId
}

// Fonction pour récupérer les cotes d'un match depuis le cache
async function getMatchOddsFromCache(matchId: number): Promise<Match["odds"] | null> {
  try {
    // Obtenir l'ID numérique du cache
    const numericCacheId = getOddsCacheNumericId(matchId)

    // Récupérer les données du cache
    const { data, error } = await supabase
      .from('match_odds_cache')
      .select('*')
      .eq('id', numericCacheId)
      .maybeSingle()

    if (error || !data) {
      console.log(`Pas de cache trouvé pour les cotes du match ${matchId} (ID: ${numericCacheId}):`, error)
      return null
    }

    // Vérifier si le cache est valide
    if (!isCacheValid(data.last_updated)) {
      console.log(`Cache expiré pour les cotes du match ${matchId} (ID: ${numericCacheId}), dernière mise à jour:`, data.last_updated)
      return null
    }

    console.log(`Utilisation du cache pour les cotes du match ${matchId} (ID: ${numericCacheId}), dernière mise à jour:`, data.last_updated)
    return data.odds
  } catch (error) {
    console.error("Erreur lors de la récupération du cache des cotes:", error)
    return null
  }
}

// Fonction pour mettre à jour le cache des cotes
async function updateMatchOddsCache(matchId: number, odds: Match["odds"]): Promise<void> {
  try {
    // Obtenir l'ID numérique du cache
    const numericCacheId = getOddsCacheNumericId(matchId)

    // Mettre à jour ou insérer dans le cache
    const { error } = await supabase
      .from('match_odds_cache')
      .upsert({
        id: numericCacheId,
        match_id: matchId,
        odds: odds,
        last_updated: new Date().toISOString()
      })

    if (error) {
      console.error(`Erreur lors de la mise à jour du cache des cotes pour le match ${matchId} (ID: ${numericCacheId}):`, error)
    } else {
      console.log(`Cache des cotes mis à jour pour le match ${matchId} (ID: ${numericCacheId})`)
    }
  } catch (error) {
    console.error("Erreur lors de la mise à jour du cache des cotes:", error)
  }
}

// Obtenir les cotes pour un match spécifique
export const getMatchOdds = cache(async (matchId: number): Promise<Match["odds"] | null> => {
  try {
    // Vérifier d'abord si nous avons des données en cache valides
    const cachedOdds = await getMatchOddsFromCache(matchId)
    if (cachedOdds) {
      console.log(`Utilisation des cotes en cache pour le match ${matchId}`)
      return cachedOdds
    }

    console.log(`Pas de cache valide, appel de l'API pour les cotes du match ${matchId}`)

    // API-FOOTBALL endpoint pour les cotes
    const response = await fetch(`https://v3.football.api-sports.io/odds?fixture=${matchId}`, {
      headers: {
        "x-rapidapi-key": process.env.SPORTS_API_KEY || "",
        "x-rapidapi-host": "v3.football.api-sports.io",
      },
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

    const odds = {
      home: Number.parseFloat(homeOdd) || 2.0,
      draw: Number.parseFloat(drawOdd) || 3.5,
      away: Number.parseFloat(awayOdd) || 4.0,
    }

    // Mettre à jour le cache avec les nouvelles cotes
    await updateMatchOddsCache(matchId, odds)

    return odds
  } catch (error) {
    console.error("Erreur lors de la récupération des cotes du match:", error)

    // En cas d'erreur, essayer de récupérer les données du cache même si elles sont expirées
    try {
      // Obtenir l'ID numérique du cache
      const numericCacheId = getOddsCacheNumericId(matchId)

      const { data } = await supabase
        .from('match_odds_cache')
        .select('*')
        .eq('id', numericCacheId)
        .maybeSingle()

      if (data && data.odds) {
        console.log(`Utilisation du cache expiré des cotes en cas d'erreur API pour le match ${matchId}`)
        return data.odds
      }
    } catch (cacheError) {
      console.error("Erreur lors de la récupération du cache de secours des cotes:", cacheError)
    }

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