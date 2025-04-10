import { BettingCategories } from "@/components/betting-categories"
import { MatchCard } from "@/components/match-card"
import { getUpcomingMatches } from "@/lib/match-data"

export default async function MatchesPage() {
  // Récupérer les données de match réelles
  const matches = await getUpcomingMatches()

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Tous les Matchs</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
          <BettingCategories />
        </div>

        <div className="md:w-3/4">
          {matches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucun match à venir disponible pour le moment. Veuillez vérifier plus tard.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {matches.map((match) => (
                <MatchCard
                  key={match.id}
                  id={match.id}
                  league={match.league}
                  teamA={match.teamA}
                  teamB={match.teamB}
                  time={match.time}
                  odds={match.odds}
                  compact={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
