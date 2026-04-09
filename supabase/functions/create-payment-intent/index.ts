import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function stripeRequest(
  endpoint: string,
  body: Record<string, string>
): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.stripe.com/v1${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(body).toString(),
  });
  return res.json();
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { userId, amountCents } = await req.json();

    if (!userId || !amountCents) {
      return new Response(
        JSON.stringify({ error: "userId and amountCents are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Supabase admin client to read/write profiles
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Look up user's Stripe customer ID from profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, full_name")
      .eq("id", userId)
      .single();

    let stripeCustomerId = profile?.stripe_customer_id;

    // Create Stripe Customer if one doesn't exist
    if (!stripeCustomerId) {
      // Get user email from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const email = authUser?.user?.email || "";

      const customer = await stripeRequest("/customers", {
        email,
        name: profile?.full_name || "",
        "metadata[supabase_user_id]": userId,
      });

      stripeCustomerId = customer.id as string;

      // Save customer ID to profile
      await supabase
        .from("profiles")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", userId);
    }

    // Create PaymentIntent
    const paymentIntent = await stripeRequest("/payment_intents", {
      amount: String(amountCents),
      currency: "usd",
      customer: stripeCustomerId,
      "automatic_payment_methods[enabled]": "true",
      "metadata[supabase_user_id]": userId,
    });

    if (paymentIntent.error) {
      return new Response(
        JSON.stringify({ error: (paymentIntent.error as Record<string, string>).message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
