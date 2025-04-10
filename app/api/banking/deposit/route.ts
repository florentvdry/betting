import { NextResponse } from "next/server";
import { processDeposit } from "@/lib/fleeca-gateway";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId, characterId, amount, token } = body;

    // Validate the request
    if (!userId || !characterId || !amount) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate the amount
    const depositAmount = Number(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    // Process the deposit
    const result = await processDeposit(userId, characterId, depositAmount, token);

    // Return the result
    return NextResponse.json(result);
  } catch (error) {
    console.error("Deposit error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "An error occurred while processing your deposit",
        rawContent: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
