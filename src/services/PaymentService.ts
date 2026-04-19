import { supabase } from './supabase';

export interface PaymentIntentResponse {
  clientSecret: string | null;
  error?: string;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const jwt = data.session?.access_token;
  return jwt ? { Authorization: `Bearer ${jwt}` } : {};
}

export const PaymentService = {
  async createPaymentIntent(
    userId: string,
    amountCents: number
  ): Promise<PaymentIntentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-payment-intent',
        { body: { userId, amountCents }, headers: await getAuthHeader() }
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

  async savePaymentMethod(
    userId: string,
    paymentMethodId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'save-payment-method',
        { body: { userId, paymentMethodId }, headers: await getAuthHeader() }
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

  async createSetupIntent(userId: string): Promise<PaymentIntentResponse> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'create-setup-intent',
        { body: { userId }, headers: await getAuthHeader() }
      );
      if (error) {
        console.error('createSetupIntent error:', error.message);
        return { clientSecret: null, error: error.message };
      }
      return { clientSecret: data.clientSecret };
    } catch (err) {
      console.error('createSetupIntent unexpected error:', err);
      return { clientSecret: null, error: 'An unexpected error occurred' };
    }
  },

  async confirmCharge(userId: string, amountCents: number): Promise<boolean> {
    try {
      const { clientSecret, error } = await PaymentService.createPaymentIntent(userId, amountCents);
      if (error || !clientSecret) {
        console.error('confirmCharge failed:', error);
        return false;
      }
      console.log('PaymentIntent created for charge:', clientSecret);
      return true;
    } catch (err) {
      console.error('confirmCharge unexpected error:', err);
      return false;
    }
  },
};
