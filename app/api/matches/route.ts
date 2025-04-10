import { NextResponse } from "next/server"
import { getLiveMatches, getUpcomingMatches } from "@/lib/match-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const category = searchParams.get("category")

  try {
    if (type === "live") {
      try {
        const matches = await getLiveMatches(category || undefined)
        return NextResponse.json({ matches })
      } catch (error) {
        console.error("Erreur lors de la récupération des matchs en direct:", error)
        // Renvoyer un code 200 avec un tableau vide au lieu d'une erreur 500
        return NextResponse.json({ matches: [] }, { status: 200 })
      }
    } else {
      try {
        const matches = await getUpcomingMatches(category || undefined)
        return NextResponse.json({ matches })
      } catch (error) {
        console.error("Erreur lors de la récupération des matchs à venir:", error)
        // Renvoyer un code 200 avec un tableau vide au lieu d'une erreur 500
        return NextResponse.json({ matches: [] }, { status: 200 })
      }
    }
  } catch (error) {
    console.error("API error:", error)
    // Renvoyer un code 200 avec un tableau vide au lieu d'une erreur 500
    return NextResponse.json({ matches: [] }, { status: 200 })
  }
}
