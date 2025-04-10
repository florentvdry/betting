import { NextResponse } from "next/server"
import { getUpdatedOdds } from "@/lib/match-data"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const matchId = searchParams.get("matchId")

  if (!matchId) {
    return NextResponse.json({ error: "Match ID is required" }, { status: 400 })
  }

  try {
    const odds = await getUpdatedOdds(Number.parseInt(matchId))

    if (!odds) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 })
    }

    return NextResponse.json({ odds })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch odds" }, { status: 500 })
  }
}
