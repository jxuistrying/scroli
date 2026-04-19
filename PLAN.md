# Scroli — Launch Plan

**Status:** Core loop complete. Payments wired. UI polished. Now: harden, test, and ship.

Work through these steps top-to-bottom. Each checkpoint tells you exactly what to verify before moving on.

---

## Step 1 — Run SQL Migrations

Everything else depends on the database being correct.

Open Supabase → SQL Editor and run:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_method_id text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS mascot_type text DEFAULT 'original';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS default_charity_id uuid references charities(id);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notifications_enabled boolean DEFAULT true;
```

Also enable Row Level Security on all tables:

```sql
-- Profiles: own row only
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Daily records: own records only
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can view own records" ON daily_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users can insert own records" ON daily_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users can update own records" ON daily_records FOR UPDATE USING (auth.uid() = user_id);

-- Transactions: own transactions only
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can view own transactions" ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Charities: public read
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "charities are public" ON charities FOR SELECT USING (true);
```

**CHECKPOINT 1 ✓**
- [ ] Sign in to app — no auth errors
- [ ] Onboarding completes and saves to profile
- [ ] Stats screen loads without errors
- [ ] Supabase Table Editor shows new columns on `profiles`

---

## Step 2 — Screen Time on Real Device

The simulator returns mock data. The entire app is built around this working correctly.

- [ ] Run on a physical iPhone: `npx expo run:ios --device`
- [ ] Go through onboarding, set a goal (e.g. 2 hours)
- [ ] Use your phone normally for a bit, then open Impact Flow
- [ ] Confirm the screen time shown matches iOS Settings → Screen Time
- [ ] Test the "deny permission" path: revoke Screen Time access → app should show an instructions screen (build this if missing)
- [ ] Confirm Apple Pay works on real device (Settings → Payment Method)

**CHECKPOINT 2 ✓**
- [ ] Impact Flow shows real screen time minutes (not mock 0)
- [ ] Success/failure state is correct based on actual usage vs goal
- [ ] Apple Pay sheet appears and completes setup
- [ ] `payment_method_id` is saved on the profile row in Supabase

---

## Step 3 — Push Notifications

**Files:** `src/services/NotificationService.ts`, `app.json`

- [ ] Install: `npx expo install expo-notifications`
- [ ] Create `src/services/NotificationService.ts`:
  ```ts
  requestPermission()         // ask user on onboarding
  scheduleDailyReminder()     // morning nudge: "Don't forget your goal today"
  scheduleEndOfDay()          // 9pm: "Time to check in. How did today go?"
  cancelAll()                 // for Settings toggle
  ```
- [ ] Add permission request as the last onboarding step (after payment setup)
- [ ] Wire Settings → Push Notifications toggle → `cancelAll()` / reschedule
- [ ] Add `notifications_enabled` read/write to profile on toggle

**CHECKPOINT 3 ✓**
- [ ] Onboarding asks for notification permission
- [ ] A scheduled notification fires at the expected time on real device
- [ ] Toggling off in Settings cancels future notifications

---

## Step 4 — End-of-Day Evaluation Cron

**Files:** `supabase/functions/evaluate-day/index.ts`

Right now charges only fire when the user manually opens the Impact Flow. This makes the whole commitment mechanic optional. Fix it.

- [ ] Create Edge Function `evaluate-day`:
  - Fetch all users with a `pending` daily_record for yesterday
  - Run same logic as `TrackingService.evaluateDayResult`
  - On failure: call `confirmCharge`, log transaction, send push notification
  - On success: log transaction as $0, send "Great job!" push notification
- [ ] Deploy: `supabase functions deploy evaluate-day --no-verify-jwt`
- [ ] Test manually via Supabase dashboard (invoke with a test user)
- [ ] Schedule via pg_cron (run in SQL Editor):
  ```sql
  select cron.schedule(
    'evaluate-daily',
    '5 0 * * *',
    $$select net.http_post(
      url := 'https://<project-ref>.supabase.co/functions/v1/evaluate-day',
      headers := '{"Authorization": "Bearer <service-role-key>"}'::jsonb
    )$$
  );
  ```

**CHECKPOINT 4 ✓**
- [ ] Manually invoke `evaluate-day` → pending records for yesterday get evaluated
- [ ] A failure record triggers a real Stripe charge (use test mode card)
- [ ] Transaction appears in `transactions` table
- [ ] Push notification is delivered

---

## Step 5 — Stripe Production & Charge Flow

- [ ] In Stripe Dashboard: activate your account (submit business info)
- [ ] Replace test keys with live keys in Supabase secrets:
  ```bash
  supabase secrets set STRIPE_SECRET_KEY=sk_live_...
  ```
- [ ] Re-deploy all three Edge Functions with live key active
- [ ] Set billing statement descriptor in Stripe → Settings → Business → Statement descriptor (shows "SCROLI" on card statements)
- [ ] Enable Stripe automatic receipts: Stripe → Settings → Emails → Successful payments
- [ ] Run one real end-to-end charge on a real card for $1 stake
- [ ] Handle charge failure: if card declines, show user "Your card was declined. Update your payment method." and flag their account

**CHECKPOINT 5 ✓**
- [ ] Real card charged successfully in live mode
- [ ] Stripe Dashboard shows the transaction
- [ ] User receives email receipt from Stripe
- [ ] Declined card shows error in app, not a crash

---

## Step 6 — Onboarding Guardrails & Error States

- [ ] Block onboarding completion if no payment method added (disable "Finish" button, show "Add a payment method to continue")
- [ ] Dashboard: show banner "Add a payment method — your stake isn't active yet" if `payment_method_id` is null
- [ ] All screens: replace bare loading spinner with a skeleton or named loading state
- [ ] Stats / Profile: show a friendly empty state for new users with 0 records
- [ ] Network offline: show toast "No internet connection" instead of a silent crash
- [ ] Impact Flow: graceful error if ScreenTime API fails (show "Couldn't load screen time data")

**CHECKPOINT 6 ✓**
- [ ] New user signup → can't finish onboarding without payment method
- [ ] Brand new account → Stats and Profile show empty state (not a blank white screen)
- [ ] Turn on Airplane Mode → app shows "No internet connection", doesn't crash

---

## Step 7 — Legal Pages

Required by App Store and by law when charging users money.

- [ ] Write a Privacy Policy (can use a generator like Termly or Iubenda)
  - Must cover: data collected (email, screen time usage, payment info), Stripe as payment processor, Supabase as data store, how to delete account
  - **Important:** explicitly state that screen time data never leaves the device
- [ ] Write Terms of Service
  - Must cover: what the charge is for, no refunds (or your refund policy), how to cancel, minimum age (18+)
- [ ] Host both at a URL (Notion public page, GitHub Pages, or a simple landing page works)
- [ ] Wire Settings → "Terms of Service" → open URL in browser
- [ ] Wire Settings → "Privacy & Security" → open URL in browser
- [ ] Add "By continuing you agree to our Terms of Service and Privacy Policy" with tappable links on the payment onboarding step

**CHECKPOINT 7 ✓**
- [ ] Both pages are live at a real URL
- [ ] Settings rows open the correct pages
- [ ] Onboarding payment step shows the legal copy with working links

---

## Step 8 — App Store Assets

- [ ] App icon: 1024×1024 PNG, no alpha channel, no rounded corners (App Store adds them)
- [ ] Splash screen: centered wave logo on cream (#F5F6FA) background
- [ ] Screenshots: capture on iPhone 6.7" and 6.1" (required sizes)
  - Suggested screens to capture: Dashboard, Impact Flow (success), Impact Flow (failure), Stats, Profile
- [ ] App Store listing copy:
  - Name: Scroli
  - Subtitle (30 chars): "Put money on your screen time"
  - Description: explain the commitment mechanic, charity angle, how charging works
  - Keywords: screen time, digital wellness, accountability, focus, charity
- [ ] Age rating: select 17+ (financial transactions + "simulated gambling" category may apply)

**CHECKPOINT 8 ✓**
- [ ] Icon appears correctly in Expo config and on device
- [ ] Splash screen shows on cold launch
- [ ] All required screenshot sizes ready

---

## Step 9 — TestFlight Beta

- [ ] Build: `eas build --platform ios --profile preview`
- [ ] Submit to TestFlight: `eas submit --platform ios`
- [ ] Internal testers (you + co-founder): install and run through the full flow on real devices
- [ ] Fix any issues found during internal testing
- [ ] External beta: invite 10–20 people from target audience
  - Full flow: sign up → onboarding → set goal → use phone → check in → get charged or not
  - Collect feedback on: onboarding clarity, impact flow, charge notification timing
- [ ] Fix critical issues from beta feedback

**CHECKPOINT 9 ✓**
- [ ] Full flow works end-to-end for an external user on a real device
- [ ] Charges fire correctly overnight via cron
- [ ] No crashes reported in Sentry (set up Sentry before this step if possible)

---

## Step 10 — App Store Submission

- [ ] Add Sentry for crash reporting: `npx expo install @sentry/react-native`
- [ ] Production build: `eas build --platform ios --profile production`
- [ ] Submit for review: `eas submit --platform ios`
- [ ] App Store Connect: fill in all metadata, upload screenshots, set pricing (free)
- [ ] Review notes for Apple: explain what the app does and why Stripe charges are legitimate (not in-app purchases, not gambling — it's a commitment/accountability tool)

**Watch for these Apple rejection reasons:**
| Risk | What to say in review notes |
|------|---------------------------|
| Guideline 3.1.1 (in-app purchases) | Charges are a voluntary commitment made by the user, not a subscription or digital good |
| Guideline 1.4.3 (gambling) | No chance element — user sets their own stake and controls their behavior |
| Screen Time API usage | Data is processed on-device only; no screen time data is transmitted to servers |

---

## Post-Launch (After v1 Ships)

| Item | Priority |
|------|----------|
| Analytics (Amplitude or Mixpanel) | High — need funnel data to improve onboarding |
| Charge failure recovery flow | High — card declines need a clear path to fix |
| Per-app breakdown in Stats | Medium — requires `applicationActivities` Screen Time API |
| Android support | Medium — separate Digital Wellbeing API |
| Weekly email digest | Low |
| Streak freeze (paid feature) | Low |
| Admin dashboard (Retool or Supabase Studio) | Low |
