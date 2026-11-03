# JertTech website (jerttech.com and jerttech.app)

The real, production version of the JertTech website: public pages, request form, customer accounts, Stripe payments and the admin dashboard.

Built with **Next.js** (the website), **Supabase** (database and sign-in) and **Stripe** (payments). It's designed to run on **Vercel**. All three have free tiers to get started; Stripe takes a fee per payment.

## What's included

- **Public pages:** home (with the Fade House mockup), Our work (Moova Africa, EliteReply, DriverRoom), Plans, and the request form with live estimate and add-on checkboxes.
- **Customer accounts:** sending a request creates an account automatically and emails a sign-in link (no passwords). Customers see build progress, approve their quote and pay, request changes, request a code buyout, cancel (maintenance, buyout or shutdown), and manage their card through Stripe.
- **Admin dashboard** at `/admin`: overview stats, projects (set quotes, move stages, change status), customers, payments, change requests (approve, price large changes, extra changes are added to the customer's next invoice when marked done), code buyouts (approve or decline) and cancellations (one click applies the customer's choice in Stripe).
- **Stripe webhook** that records payments, failed payments and cancelled subscriptions automatically.

## How a project flows

1. A visitor sends a request. Their account is created and the project shows as "Request received."
2. In `/admin` → Projects, you review it, adjust the quote if needed (setup fee + add-ons), and set the stage to **Quote sent**.
3. The customer signs in, sees "Your quote is ready," and pays through Stripe. The subscription starts and the project moves to **Designing** automatically.
4. You move it through Building, Testing and Live as you work. The customer sees each step.

## Setup (about 30–45 minutes)

### 1. Supabase (database and sign-in)
1. Create a project at supabase.com.
2. Open **SQL Editor → New query**, paste everything from `supabase/schema.sql`, and click **Run**.
3. In **Authentication → URL Configuration**, set **Site URL** to `https://jerttech.com` and add `https://jerttech.com/auth/callback`, `https://jerttech.app/auth/callback` (and `http://localhost:3000/auth/callback` for testing) under **Redirect URLs**.
4. In **Authentication → Providers → Email**, keep Email enabled. For real customers, set up custom SMTP under **Authentication → Emails** (for example with Resend or Postmark), because Supabase's built-in email is heavily rate-limited.
5. Copy the **Project URL**, **anon key** and **service_role key** from **Project Settings → API**. Keep the service_role key secret.

### 2. Stripe (payments)
1. Create an account at stripe.com. Start in **Test mode**.
2. Copy your **Secret key** from **Developers → API keys**.
3. In **Settings → Billing → Customer portal**, turn the portal on (this powers "Update card and invoices").
4. After deploying (step 3), go to **Developers → Webhooks → Add endpoint**:
   - URL: `https://jerttech.com/api/stripe/webhook`
   - Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`
   - Copy the **Signing secret** (`whsec_...`).

### 3. Deploy to Vercel
1. Put this folder in a GitHub repository.
2. At vercel.com, **Add New → Project** and import the repository.
3. Add the environment variables from `.env.example` with your real values.
4. Deploy, then add the Stripe webhook secret (step 2.4) and redeploy.
5. In Vercel **Settings → Domains**, add `jerttech.com` and follow the DNS instructions from your domain provider. Then add `jerttech.app` and choose **Redirect to jerttech.com** (308). Use one main domain: sign-ins only last on the domain they were made on, so customers would otherwise appear signed out when switching between the two.

### 4. Make yourself the admin
1. Go to `https://jerttech.com/request` and send a test request with your own email (or create a user in Supabase **Authentication → Users**).
2. In Supabase SQL Editor run:
   `update public.profiles set role = 'admin' where email = 'your@email.com';`
3. Sign in at `/login` and open `/admin`.

### 5. Test before going live
In Stripe test mode, pay with card `4242 4242 4242 4242`, any future date, any CVC. Check that the payment appears in the portal and admin. When everything works, switch Stripe to live mode, replace the keys and webhook secret in Vercel, and redeploy.

## Running it on your computer
```
npm install
cp .env.example .env.local   # then fill in your keys
npm run dev                  # open http://localhost:3000
```
To test webhooks locally, install the Stripe CLI and run `stripe listen --forward-to localhost:3000/api/stripe/webhook`.

## Before you take real customers
- Have your **terms of service and privacy policy** reviewed (badge rule, code ownership, minimum terms, cancellation, data export) and add them as pages.
- Set up **custom email (SMTP)** in Supabase so sign-in links arrive reliably.
- Decide how you'll **notify yourself** of new requests. Activity shows in the admin overview; email or Slack alerts can be added.

## Where to change things
- Prices, plans, add-ons, change fees: `lib/pricing.ts`
- Portfolio apps: `components/Work.tsx` (logos in `public/`)
- Colors and styles: `app/globals.css`
- Home page text: `app/page.tsx`
