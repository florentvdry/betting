import { NextResponse } from "next/server";
import { createBet, getUserBankroll } from "@/lib/supabase";
import { Match } from "@/lib/match-data";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId, characterId, matchId, amount, odds, betType, matchData } = body;

    // Validate the request
    if (!userId || !characterId || !matchId || !amount || !odds || !betType) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate the amount
    const betAmount = Number(amount);
    if (isNaN(betAmount) || betAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid bet amount" },
        { status: 400 }
      );
    }

    // Validate the odds
    const betOdds = Number(odds);
    if (isNaN(betOdds) || betOdds <= 1) {
      return NextResponse.json(
        { success: false, message: "Invalid odds" },
        { status: 400 }
      );
    }

    // Validate the bet type
    if (!['home', 'draw', 'away'].includes(betType)) {
      return NextResponse.json(
        { success: false, message: "Invalid bet type" },
        { status: 400 }
      );
    }

    // Check if the user has enough balance
    const balance = await getUserBankroll(userId, characterId);
    if (balance < betAmount) {
      return NextResponse.json(
        { success: false, message: "Insufficient funds" },
        { status: 400 }
      );
    }

    // Create the bet
    const result = await createBet(
      userId,
      characterId,
      matchId,
      betAmount,
      betOdds,
      betType as 'home' | 'draw' | 'away',
      matchData
    );

    if (result) {
      return NextResponse.json({
        success: true,
        message: "Bet placed successfully",
        potentialWin: betAmount * betOdds
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to place bet" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Bet error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while processing your bet" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve user bets
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const characterId = searchParams.get("characterId");

    if (!userId || !characterId) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      );
    }

    // This function needs to be implemented in the supabase.ts file
    const bets = await getUserBets(parseInt(userId), parseInt(characterId));

    return NextResponse.json({
      success: true,
      bets
    });
  } catch (error) {
    console.error("Error fetching bets:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while fetching your bets" },
      { status: 500 }
    );
  }
}

// Import the getUserBets function from the supabase.ts file
import { getUserBets } from "@/lib/supabase";