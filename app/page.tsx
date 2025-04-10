import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MatchCard } from "@/components/match-card"
import { BettingCategories } from "@/components/betting-categories"
import { getUpcomingMatches } from "@/lib/match-data"

export default async function Home() {
  // Récupérer les données de match réelles
  const upcomingMatches = await getUpcomingMatches()

  // S'assurer que nous avons des matchs à afficher
  console.log("Nombre de matchs à venir:", upcomingMatches.length)

  const featuredMatches = upcomingMatches.slice(0, 2) // Prendre les 2 premiers pour les matchs en vedette
  const otherMatches = upcomingMatches.slice(2, 5) // Prendre les 3 suivants pour les matchs à venir

  return (
    <section className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
          <BettingCategories />
        </div>
        <div className="md:w-3/4">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-4">Matchs à la Une</h2>
            {featuredMatches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun match à la une disponible pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featuredMatches.map((match, index) => (
                  <MatchCard
                    key={match.id}
                    id={match.id}
                    league={match.league}
                    teamA={match.teamA}
                    teamB={match.teamB}
                    time={match.time}
                    odds={match.odds}
                    featured={index === 0} // Le premier match est mis en avant
                  />
                ))}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Matchs à Venir</h2>
            {otherMatches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun match à venir disponible pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {otherMatches.map((match) => (
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
            <div className="mt-4">
              <Button asChild variant="outline" className="w-full">
                <Link href="/matches">Voir Tous les Matchs</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
