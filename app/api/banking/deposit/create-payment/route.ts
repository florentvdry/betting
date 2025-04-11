import { NextResponse } from "next/server";

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
    const depositAmount = Number(amount);
    if (isNaN(depositAmount) || depositAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Invalid amount" },
        { status: 400 }
      );
    }

    // Get the gateway URL and auth key from environment variables
    const gatewayUrl = process.env.FLEECA_GATEWAY_URL;
    const authKey = process.env.FLEECA_AUTH_KEY;

    if (!gatewayUrl || !authKey) {
      console.error('Fleeca Gateway configuration missing');
      return NextResponse.json(
        { success: false, message: "Payment gateway configuration error" },
        { status: 500 }
      );
    }

    // Construct the payment URL
    // Type 0 is the only type that exists according to the requirements
    const paymentUrl = `${gatewayUrl}${authKey}/0/${depositAmount}`;

    // Store the user information in a temporary database or session
    // This would be similar to the Wix code that stores data in 'TemporaryOrders'
    // For now, we'll just return the payment URL
    // In a production environment, you would want to store this information
    // to verify the payment when the user returns from the payment page

    return NextResponse.json({
      success: true,
      message: "Payment URL generated successfully",
      paymentUrl
    });
  } catch (error) {
    console.error("Error generating payment URL:", error);
    return NextResponse.json(
      { success: false, message: "An error occurred while generating the payment URL" },
      { status: 500 }
    );
  }
}