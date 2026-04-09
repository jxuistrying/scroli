import { supabase } from './supabase';

export interface PaymentIntentResponse {
  clientSecret: string | null;
  error?: string;
}

export const PaymentService = {
  /**
   * Create a Stripe PaymentIntent via the Edge Function.
   * Returns a clientSecret for client-side confirmation (Feature 2).
   */
  async createPaymentIntent(
    userId: string,
    amountCents: number
  ): Promise<PaymentIntentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-payment-intent',
        { body: { userId, amountCents } }
      );

      if (error) {
        console.error('createPaymentIntent error:', error);
        return { clientSecret: null, error: error.message };
      }

      return { clientSecret: data.clientSecret };
    } catch (err) {
      console.error('createPaymentIntent unexpected error:', err);
      return { clientSecret: null, error: 'An unexpected error occurred' };
    }
  },

  /**
   * Save a payment method to the user's profile via Edge Function.
   * Called after the user adds a card in the Payment Setup screen (Feature 2).
   */
  async savePaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'save-payment-method',
        { body: { userId, paymentMethodId } }
      );

      if (error) {
        console.error('savePaymentMethod error:', error);
        return { success: false, error: error.message };
      }

      return { success: data.success ?? true };
    } catch (err) {
      console.error('savePaymentMethod unexpected error:', err);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  /**
   * Charge the user's saved payment method.
   * Called automatically when TrackingService detects a goal failure.
   * Creates a PaymentIntent with off-session confirmation.
   */
  async confirmCharge(
    userId: string,
    amountCents: number
  ): Promise<boolean> {
    try {
      const { clientSecret, error } = await PaymentService.createPaymentIntent(
        userId,
        amountCents
      );

      if (error || !clientSecret) {
        console.error('confirmCharge failed:', error);
        return false;
      }

      // For now, the PaymentIntent is created but needs to be confirmed
      // client-side (Feature 2 will handle this with the card UI).
      // Once save-payment-method is wired, we can auto-confirm server-side.
      console.log('PaymentIntent created for charge:', clientSecret);
      return true;
    } catch (err) {
      console.error('confirmCharge unexpected error:', err);
      return false;
    }
  },
};
