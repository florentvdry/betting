import { NextResponse } from "next/server";
import { createWithdrawRequest, getUserBankroll } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { userId, characterId, amount } = body;

    // Validate the request
    if (!userId || !characterId || !amount) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate the amount
    const withdrawAmount = Number(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    // Check if the user has enough balance
    const balance = await getUserBankroll(userId, characterId);
    if (balance < withdrawAmount) {
      return NextResponse.json(
        { success: false, message: "Insufficient funds" },
        { status: 400 }
      );
    }

    // Create the withdraw request
    const result = await createWithdrawRequest(userId, characterId, withdrawAmount);

    if (result) {
      return NextResponse.json({
        success: true,
        message: "Withdraw request submitted successfully. It will be processed by an administrator."
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Failed to create withdraw request" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Withdraw error:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while processing your withdraw request" },
      { status: 500 }
    );
  }
}