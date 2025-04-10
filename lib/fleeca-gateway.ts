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
export async function processDeposit(userId: number, characterId: number, amount: number): Promise<{ success: boolean; message: string }> {
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
    
    if (!response.ok) {
      console.error('Fleeca Gateway error:', response.status, response.statusText);
      return { success: false, message: 'Payment gateway error' };
    }

    // Parse the response
    const data: FlecaPaymentResponse = await response.json();

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
          message: `Deposit of $${amount} was successful. Your new balance is $${newBalance}.` 
        };
      } else {
        return { 
          success: false, 
          message: 'Payment was processed but there was an error updating your balance.' 
        };
      }
    } else {
      return { 
        success: false, 
        message: `Payment failed: ${data.message}` 
      };
    }
  } catch (error) {
    console.error('Error processing deposit:', error);
    return { 
      success: false, 
      message: 'An unexpected error occurred while processing your deposit.' 
    };
  }
}