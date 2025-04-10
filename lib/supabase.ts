import { createClient } from '@supabase/supabase-js';

// These environment variables will need to be set in the .env file
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface UserBankroll {
  id: string;
  user_id: number;
  character_id: number;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface Bet {
  id: string;
  user_id: number;
  character_id: number;
  match_id: number;
  amount: number;
  odds: number;
  bet_type: 'home' | 'draw' | 'away';
  status: 'pending' | 'won' | 'lost';
  created_at: string;
  potential_win: number;
  match_data: any; // Store match data as JSON
}

export interface WithdrawRequest {
  id: string;
  user_id: number;
  character_id: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  processed_at?: string;
  admin_note?: string;
}

export interface Notification {
  id: string;
  user_id: number;
  character_id: number;
  message: string;
  read: boolean;
  created_at: string;
  type: 'withdraw_rejected' | 'bet_won' | 'bet_lost' | 'deposit_success';
}

// Helper functions for database operations

// Bankroll functions
export async function getUserBankroll(userId: number, characterId: number): Promise<number> {
  const { data, error } = await supabase
    .from('user_bankroll')
    .select('balance')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .single();

  if (error || !data) {
    console.error('Error fetching bankroll:', error);
    return 0;
  }

  return data.balance;
}

export async function updateUserBankroll(userId: number, characterId: number, amount: number): Promise<boolean> {
  // First check if the user already has a bankroll entry
  const { data: existingBankroll } = await supabase
    .from('user_bankroll')
    .select('id, balance')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .single();

  if (existingBankroll) {
    // Update existing bankroll
    const { error } = await supabase
      .from('user_bankroll')
      .update({ 
        balance: amount,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingBankroll.id);

    return !error;
  } else {
    // Create new bankroll entry
    const { error } = await supabase
      .from('user_bankroll')
      .insert({
        user_id: userId,
        character_id: characterId,
        balance: amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    return !error;
  }
}

// Bet functions
export async function createBet(
  userId: number, 
  characterId: number, 
  matchId: number, 
  amount: number, 
  odds: number, 
  betType: 'home' | 'draw' | 'away',
  matchData: any
): Promise<boolean> {
  // Check if user has enough balance
  const balance = await getUserBankroll(userId, characterId);
  if (balance < amount) {
    return false;
  }

  // Create the bet
  const { error } = await supabase
    .from('bets')
    .insert({
      user_id: userId,
      character_id: characterId,
      match_id: matchId,
      amount: amount,
      odds: odds,
      bet_type: betType,
      status: 'pending',
      created_at: new Date().toISOString(),
      potential_win: amount * odds,
      match_data: matchData
    });

  if (error) {
    console.error('Error creating bet:', error);
    return false;
  }

  // Update user's bankroll
  const newBalance = balance - amount;
  const updated = await updateUserBankroll(userId, characterId, newBalance);

  return updated;
}

export async function getUserBets(userId: number, characterId: number): Promise<Bet[]> {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching bets:', error);
    return [];
  }

  return data || [];
}

// Withdraw request functions
export async function createWithdrawRequest(
  userId: number, 
  characterId: number, 
  amount: number
): Promise<boolean> {
  // Check if user has enough balance
  const balance = await getUserBankroll(userId, characterId);
  if (balance < amount) {
    return false;
  }

  // Create the withdraw request
  const { error } = await supabase
    .from('withdraw_requests')
    .insert({
      user_id: userId,
      character_id: characterId,
      amount: amount,
      status: 'pending',
      created_at: new Date().toISOString()
    });

  return !error;
}

// Notification functions
export async function createNotification(
  userId: number, 
  characterId: number, 
  message: string, 
  type: 'withdraw_rejected' | 'bet_won' | 'bet_lost' | 'deposit_success'
): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      character_id: characterId,
      message: message,
      read: false,
      created_at: new Date().toISOString(),
      type: type
    });

  return !error;
}

export async function getUserNotifications(userId: number, characterId: number): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  return data || [];
}

export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId);

  if (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }

  return true;
}

export async function markAllNotificationsAsRead(userId: number, characterId: number): Promise<boolean> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .eq('character_id', characterId)
    .eq('read', false);

  if (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }

  return true;
}

// Admin functions
export async function getAllBets(): Promise<Bet[]> {
  const { data, error } = await supabase
    .from('bets')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all bets:', error);
    return [];
  }

  return data || [];
}

export async function getAllWithdrawRequests(): Promise<WithdrawRequest[]> {
  const { data, error } = await supabase
    .from('withdraw_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all withdraw requests:', error);
    return [];
  }

  return data || [];
}

export async function processWithdrawRequest(
  requestId: string, 
  approved: boolean, 
  adminNote?: string
): Promise<boolean> {
  // Get the withdraw request
  const { data: request, error: fetchError } = await supabase
    .from('withdraw_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    console.error('Error fetching withdraw request:', fetchError);
    return false;
  }

  // Update the request status
  const { error: updateError } = await supabase
    .from('withdraw_requests')
    .update({
      status: approved ? 'approved' : 'rejected',
      processed_at: new Date().toISOString(),
      admin_note: adminNote
    })
    .eq('id', requestId);

  if (updateError) {
    console.error('Error updating withdraw request:', updateError);
    return false;
  }

  if (approved) {
    // If approved, deduct the amount from the user's bankroll
    const balance = await getUserBankroll(request.user_id, request.character_id);
    const newBalance = balance - request.amount;
    await updateUserBankroll(request.user_id, request.character_id, newBalance);
  } else {
    // If rejected, create a notification for the user
    await createNotification(
      request.user_id,
      request.character_id,
      `Your withdrawal request for $${request.amount} was rejected. Reason: ${adminNote || 'No reason provided'}`,
      'withdraw_rejected'
    );
  }

  return true;
}
