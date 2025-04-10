import { BettingCategories } from "@/components/betting-categories"
import { MatchCard } from "@/components/match-card"
import { getUpcomingMatches } from "@/lib/match-data"

interface CategoryPageProps {
  params: {
    slug: string
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = params

  // Récupérer uniquement les matchs à venir pour cette catégorie
  const upcomingMatches = await getUpcomingMatches(slug)

  // Mapper les slugs aux noms de catégorie
  const categoryNames: Record<string, string> = {
    football: "Football",
    basketball: "Basketball",
    tennis: "Tennis",
    fighting: "MMA/Boxe",
    esports: "eSports",
  }

  const categoryName = categoryNames[slug] || slug.charAt(0).toUpperCase() + slug.slice(1)

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">{categoryName}</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/4">
          <BettingCategories />
        </div>

        <div className="md:w-3/4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Matchs à Venir</h2>
            {upcomingMatches.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aucun match à venir disponible pour le moment dans cette catégorie.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {upcomingMatches.map((match) => (
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
    </div>
  )
}
