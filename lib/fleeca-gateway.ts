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
 * @returns Object containing success status, message, and the server response
 */
export async function processDeposit(userId: number, characterId: number, amount: number): Promise<{ success: boolean; message: string; response?: any }> {
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

    // Make the request to the Fleeca Gateway
    const response = await fetch(paymentUrl);

    // Clone the response to be able to read the body multiple times if needed
    const responseClone = response.clone();

    if (!response.ok) {
      console.error('Fleeca Gateway error:', response.status, response.statusText);
      try {
        const text = await responseClone.text();
        return { 
          success: false, 
          message: 'Payment gateway error',
          response: text
        };
      } catch (textError) {
        console.error('Could not read response text:', textError);
        return { 
          success: false, 
          message: 'Payment gateway error',
          response: { 
            status: response.status, 
            statusText: response.statusText 
          }
        };
      }
    }

    // Check if the response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('Fleeca Gateway returned non-JSON response:', contentType);

      // Try to get the text of the response for debugging
      try {
        const text = await response.text();
        console.error('Response text:', text.substring(0, 200) + '...');
        return { 
          success: false, 
          message: 'Payment gateway returned an invalid response format',
          response: text
        };
      } catch (textError) {
        console.error('Could not read response text:', textError);
        return { 
          success: false, 
          message: 'Payment gateway returned an invalid response format',
          response: { error: 'Could not read response text' }
        };
      }
    }

    // Parse the response
    let data: FlecaPaymentResponse;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Failed to parse JSON response:', jsonError);
      // Try to get the text of the response for the response object
      try {
        const text = await response.text();
        return { 
          success: false, 
          message: 'Failed to parse payment gateway response',
          response: text
        };
      } catch (textError) {
        console.error('Could not read response text:', textError);
        return { 
          success: false, 
          message: 'Failed to parse payment gateway response',
          response: { error: 'Could not read response text' }
        };
      }
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
          response: data
        };
      } else {
        return { 
          success: false, 
          message: 'Payment was processed but there was an error updating your balance.',
          response: data
        };
      }
    } else {
      return { 
        success: false, 
        message: `Payment failed: ${data.message}`,
        response: data
      };
    }
  } catch (error) {
    console.error('Error processing deposit:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while processing your deposit.',
      response: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}
