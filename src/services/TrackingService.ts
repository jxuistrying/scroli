import { supabase } from './supabase';
import { PaymentService } from './PaymentService';

export type DayResult = 'success' | 'failure' | 'pending';

export const TrackingService = {
  /**
   * Save or update the user's active goal.
   * Called at end of onboarding.
   */
  async saveGoal(userId: string, dailyLimitMinutes: number): Promise<void> {
    // Deactivate existing goals first
    await supabase
      .from('goals')
      .update({ is_active: false })
      .eq('user_id', userId);

    const { error } = await supabase.from('goals').insert({
      user_id: userId,
      title: `${Math.round(dailyLimitMinutes / 60)}h daily limit`,
      daily_limit_minutes: dailyLimitMinutes,
      is_active: true,
    });

    if (error) throw error;
  },

  /**
   * Get the user's current active goal in minutes.
   * Returns null if none found.
   */
  async getActiveGoal(userId: string): Promise<{ id: string; daily_limit_minutes: number } | null> {
    const { data, error } = await supabase
      .from('goals')
      .select('id, daily_limit_minutes')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data;
  },

  /**
   * Upsert today's screen time record.
   * Safe to call multiple times — updates duration if record exists.
   */
  async saveDailyRecord(userId: string, durationMinutes: number): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const goal = await TrackingService.getActiveGoal(userId);

    const { error } = await supabase.from('daily_records').upsert(
      {
        user_id: userId,
        date: today,
        duration_minutes: Math.round(durationMinutes),
        goal_id: goal?.id ?? null,
        status: 'pending',
      },
      { onConflict: 'user_id,date' }
    );

    if (error) throw error;
  },

  /**
   * Evaluate today's result: compare duration to goal.
   * Sets status to 'success' or 'failure' and returns it.
   */
  async evaluateDayResult(userId: string, date?: string): Promise<DayResult> {
    const targetDate = date ?? new Date().toISOString().split('T')[0];
    const goal = await TrackingService.getActiveGoal(userId);
    if (!goal) return 'pending';

    const { data, error } = await supabase
      .from('daily_records')
      .select('id, duration_minutes')
      .eq('user_id', userId)
      .eq('date', targetDate)
      .single();

    if (error || !data) return 'pending';

    const status: DayResult =
      data.duration_minutes <= goal.daily_limit_minutes ? 'success' : 'failure';

    await supabase
      .from('daily_records')
      .update({ status })
      .eq('id', data.id);

    // On failure, charge the user's saved payment method
    if (status === 'failure') {
      try {
        const balance = await TrackingService.getWalletBalance(userId);
        if (balance > 0) {
          const charged = await PaymentService.confirmCharge(userId, balance);
          if (charged) {
            await TrackingService.logTransaction(userId, balance, 'charge');
          }
        }
      } catch (chargeErr) {
        console.error('Failed to process failure charge:', chargeErr);
        // Don't throw — the day result should still be saved even if charge fails
      }
    }

    return status;
  },

  /**
   * Fetch last N days of records for the current user.
   */
  async getRecentRecords(userId: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_records')
      .select('date, duration_minutes, status')
      .eq('user_id', userId)
      .gte('date', sinceStr)
      .order('date', { ascending: true });

    if (error) throw error;
    return data ?? [];
  },

  /**
   * Get wallet balance in cents for a user.
   */
  async getWalletBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('wallet_balances')
      .select('balance_cents')
      .eq('user_id', userId)
      .single();

    if (error || !data) return 0;
    return data.balance_cents;
  },

  /**
   * Log a transaction (charge or donation).
   */
  async logTransaction(
    userId: string,
    amountCents: number,
    type: 'charge' | 'refund' | 'donation',
    charityId?: string
  ): Promise<void> {
    const { error } = await supabase.from('transactions').insert({
      user_id: userId,
      amount_cents: amountCents,
      type,
      charity_id: charityId ?? null,
    });

    if (error) throw error;
  },

  /**
   * Get all transactions for a user.
   */
  async getTransactions(userId: string) {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount_cents, type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  },
};
