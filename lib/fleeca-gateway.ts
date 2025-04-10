import { createNotification, updateUserBankroll, getUserBankroll } from './supabase';

interface FlecaPaymentResponse {
  token: string;
  auth_key: string;
  message: string;
  payment: number;
  routing_from: string;
  routing_to: string;
  sandbox: boolean;
  token_expired: boolean;
  token_created_at: string;
}

/**
 * Process a deposit using the Fleeca Gateway
 * @param userId User ID
 * @param characterId Character ID
 * @param amount Amount to deposit
 * @returns Success status and message
 */
export async function processDeposit(userId: number, characterId: number, amount: number, token?: string): Promise<{ success: boolean; message: string; rawContent?: string; paymentUrl?: string }> {
  try {
    // Get the gateway URLs and auth key from environment variables
    const gatewayUrl = process.env.FLEECA_GATEWAY_URL;
    const tokenUrl = process.env.FLEECA_TOKEN_URL;
    const authKey = process.env.FLEECA_AUTH_KEY;

    if (!gatewayUrl || !tokenUrl || !authKey) {
      console.error('Fleeca Gateway configuration missing');
      return { success: false, message: 'Payment gateway configuration error' };
    }

    // Construct the full URL for the payment
    // Type 0 is the only type that exists according to the requirements
    const paymentUrl = `${gatewayUrl}${authKey}/0/${amount}`;

    // If no token is provided, return the payment URL for the client to use
    if (!token) {
      return { 
        success: false, 
        message: 'Token is required to complete the payment', 
        paymentUrl 
      };
    }

    // Make a POST request to the token URL with the token
    const tokenResponse = await fetch(`${tokenUrl}${token}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Clone the response to read the text without consuming the original
    const responseClone = tokenResponse.clone();
    let rawContent: string;
    try {
      rawContent = await responseClone.text();
      console.log('Raw response content:', rawContent);
    } catch (textError) {
      console.error('Could not read response text:', textError);
      rawContent = 'Could not read response text';
    }

    if (!tokenResponse.ok) {
      console.error('Fleeca Gateway token error:', tokenResponse.status, tokenResponse.statusText);
      return { 
        success: false, 
        message: 'Payment gateway token error', 
        rawContent 
      };
    }

    // Check if the response is JSON
    const contentType = tokenResponse.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Fleeca Gateway returned non-JSON response:', contentType);
      return { 
        success: false, 
        message: 'Payment gateway returned an invalid response format', 
        rawContent 
      };
    }

    // Parse the response
    let data: FlecaPaymentResponse;
    try {
      data = await tokenResponse.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      return { 
        success: false, 
        message: 'Failed to parse payment gateway response', 
        rawContent 
      };
    }

    // Check if the payment was successful
    if (data.message === 'successful_payment') {
      // Update the user's bankroll
      const currentBalance = await getUserBankroll(userId, characterId);
      const newBalance = currentBalance + amount;

      const updated = await updateUserBankroll(userId, characterId, newBalance);

      if (updated) {
        // Create a notification for the user
        await createNotification(
          userId,
          characterId,
          `Your deposit of $${amount} was successful.`,
          'deposit_success'
        );

        return { 
          success: true, 
          message: `Deposit of $${amount} was successful. Your new balance is $${newBalance}.`,
          rawContent
        };
      } else {
        return { 
          success: false, 
          message: 'Payment was processed but there was an error updating your balance.',
          rawContent
        };
      }
    } else {
      return { 
        success: false, 
        message: `Payment failed: ${data.message}`,
        rawContent
      };
    }
  } catch (error) {
    console.error('Error processing deposit:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while processing your deposit.',
      rawContent: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
