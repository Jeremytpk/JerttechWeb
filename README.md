# JertTech website (jerttech.com and jerttech.app)

The real, production version of the JertTech website: public pages, request form, customer accounts, Stripe payments and the admin dashboard.

Built with **Next.js** (the website), **Firebase** (Firestore database and passwordless sign-in, in the Aura project) and **Stripe** (payments). It's designed to run on **Vercel**. All three have free tiers to get started; Stripe takes a fee per payment.

## What's included

- **Public pages:** home (with the Fade House mockup), Our work (Moova Africa, EliteReply, DriverRoom), Plans, and the request form with live estimate and add-on checkboxes.
- **Customer accounts:** sign up and sign in with email and password (or create the account while sending a request), with password reset by email. Customers see build progress, approve their quote and pay, request changes, request a code buyout, cancel (maintenance, buyout or shutdown), and manage their card through Stripe.
- **Admin dashboard** at `/admin`: overview stats, users (with an Admin on/off switch), projects (set quotes, move stages, change status), customers, payments, change requests (approve, price large changes, extra changes are added to the customer's next invoice when marked done), code buyouts (approve or decline) and cancellations (one click applies the customer's choice in Stripe).
- **Stripe webhook** that records payments, failed payments and cancelled subscriptions automatically.

## How a project flows

1. A visitor sends a request. Their account is created and the project shows as "Request received."
2. In `/admin` → Projects, you review it, adjust the quote if needed (setup fee + add-ons), and set the stage to **Quote sent**.
3. The customer signs in, sees "Your quote is ready," and pays through Stripe. The subscription starts and the project moves to **Designing** automatically.
4. You move it through Building, Testing and Live as you work. The customer sees each step.

## Setup (about 30–45 minutes)

### 1. Firebase (database and sign-in)
JertTech uses the Firestore database `ai-studio-628693c8-0773-4dc5-bbcc-e8b408cb96e0` in the **Aura** Firebase project (`aura-55447`). Everything is read and written by the website's server, so the database's security rules can stay "deny all" for browsers.

People sign in and create accounts with **email and password** (`/login`, or while sending a request), and can reset a forgotten password by email. The Aura project's sign-in is shared with other apps (Aura, LitChat, onatra…): a JertTech profile is created the first time someone signs in to JertTech, and signing out of JertTech doesn't sign anyone out of the other apps.

1. **Email/Password sign-in** is already turned on in Aura (**Authentication → Sign-in method**). Nothing to change.
2. **Allow the JertTech domains.** **Authentication → Settings → Authorized domains** → add `jerttech.com`, `www.jerttech.com` and `jerttech.app` (`localhost` is already there).
3. **Register the website.** **Project settings → General → Your apps → Add app → Web**, name it `JertTech`. Copy `apiKey` and `appId` into `NEXT_PUBLIC_FIREBASE_API_KEY` and `NEXT_PUBLIC_FIREBASE_APP_ID`.
4. **Give the server a key.** **Project settings → Service accounts → Generate new private key** downloads a JSON file. Turn it into one line with `base64 -i the-file.json | tr -d '\n'` and put that in `FIREBASE_SERVICE_ACCOUNT_BASE64`. Then delete the downloaded file. (For tighter access, create a dedicated service account in Google Cloud with only the **Cloud Datastore User** and **Firebase Authentication Admin** roles and use its key instead.)
5. **Password reset emails.** Firebase sends them. To make them come from JertTech, edit **Authentication → Templates → Password reset** and, under **Customize domain**, use `jerttech.com`.

The data model is described at the top of `lib/db.ts`.

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
1. Create your account at `https://jerttech.com/login` (Create account).
2. The very first admin is made from your computer, with `.env.local` filled in:
   `npm run make-admin -- your@email.com`
3. Sign in and open **Admin portal** from My projects (or go to `/admin`).
4. From then on, give anyone else admin access in **Admin → Users** with the **Admin** switch. Turning it off removes their access. You can't switch off your own access, so there's always at least one admin.

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
- Customize the **password reset email** in Firebase (Authentication → Templates) so it comes from jerttech.com.
- Decide how you'll **notify yourself** of new requests. Activity shows in the admin overview; email or Slack alerts can be added.

## Where to change things
- Prices, plans, add-ons, change fees: `lib/pricing.ts`
- Portfolio apps: `components/Work.tsx` (logos in `public/`)
- Colors and styles: `app/globals.css`
- Home page text: `app/page.tsx`
