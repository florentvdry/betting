import { BettingCategories } from "@/components/betting-categories"
import { MatchCard } from "@/components/match-card"
import { getStartingSoonMatches } from "@/lib/match-data"
import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"

export default async function StartingSoonPage() {
  // Récupérer les matchs qui commencent bientôt, déjà triés par date
  const startingSoonMatches = await getStartingSoonMatches()

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
          {startingSoonMatches.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Aucun match imminent disponible pour le moment. Veuillez vérifier plus tard.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {startingSoonMatches.map((match) => (
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
