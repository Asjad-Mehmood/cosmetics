# Deploying Amazon Group on Vercel

Amazon Group is **one Vercel project with two services** (configured in the
root `vercel.json`) and a free Neon Postgres database. They share one domain:

| Address                    | Service      | What it is                          |
| -------------------------- | ------------ | ----------------------------------- |
| `amazon-group.vercel.app/` | `storefront` | The shop customers use              |
| `.../admin`                | `storefront` | The admin panel for staff           |
| `.../api/v1`               | `api`        | The backend (orders, stock, emails) |

Everything here works on Vercel's free (Hobby) plan and Neon's free plan. Vercel's
Hobby plan is meant for non-commercial use, so move to Pro once the shop is
taking real orders.

## 1. Project settings

In your Vercel project (for example `amazon-group`): **Settings → Build and Deployment**.

- **Root Directory: leave empty** (the repository root, where `vercel.json` is).
- Framework Preset: **Services** (or **Other** if Services is not listed). Not
  Next.js: each service sets its own framework in `vercel.json`.
- Leave the build, output and install commands empty. Each service's build
  comes from `vercel.json`:
  - `api` (`apps/api`, Express): `node scripts/vercel-build.mjs` generates the
    Prisma client, bundles `src/vercel.ts` to `vercel-bundle/` (loaded by the
    service's entrypoint, `apps/api/vercel-entry.js`) and, on production
    deploys only, migrates and seeds the database;
  - `storefront` (`apps/storefront`, Next.js): `next build`.

## 2. The database (free)

**Storage → Create Database → Neon (Postgres)**. Choose the **Singapore** region
(closest to Pakistan, and where the functions run) and the free plan, then
**Connect** it to the project. This adds `DATABASE_URL` and
`DATABASE_URL_UNPOOLED` automatically.

## 3. Environment variables

**Settings → Environment Variables**, for Production and Preview:

| Name                  | Value                                                      |
| --------------------- | ---------------------------------------------------------- |
| `JWT_ACCESS_SECRET`   | random text, at least 32 characters                        |
| `CRON_SECRET`         | different random text, at least 32 characters              |
| `SEED_ADMIN_EMAIL`    | your email: the first admin account                        |
| `SEED_ADMIN_PASSWORD` | the first admin password (a strong one, not `ChangeMe123`) |

For the random values, run `openssl rand -hex 32` or use any password generator
with a long length. Keep them private and never put them in the repository.

That's all. The site's own address is used automatically for links in emails.
If you add a custom domain, also add `STOREFRONT_URL` = `https://your-domain`.

Optional: `REDIS_URL` (e.g. a free Upstash Redis) shares rate limits between
function instances. Without it each instance keeps its own.

Optional, for booking parcels with **TCS** from the admin. TCS provides these
when you sign up for API access. Add them for **Production** only, and only
when you are ready to book real parcels:

| Name                   | Value                                                      |
| ---------------------- | ---------------------------------------------------------- |
| `TCS_ENV`              | `sandbox` while testing, `production` once TCS approves it |
| `TCS_CLIENT_ID`        | client ID from TCS                                         |
| `TCS_CLIENT_SECRET`    | client secret from TCS                                     |
| `TCS_USERNAME`         | API username from TCS                                      |
| `TCS_PASSWORD`         | API password from TCS                                      |
| `TCS_ACCOUNT_NUMBER`   | your TCS account number, e.g. `04011K1`                    |
| `TCS_COST_CENTER_CODE` | cost center code TCS set up for your pickup address        |

The TCS login is kept only here, never in the database or the admin, so nobody
can read it from the website. After adding or changing them, **redeploy**. Then
in the admin, **Settings → TCS courier**: check the pickup details, turn TCS on
and press **Test connection**.

## 4. Deploy

**Deployments → Redeploy** (or push to `main`). The build:

1. creates or updates the database tables;
2. creates your admin account and the store settings, shipping zones and pages;
3. the first time only, adds the starter catalogue. Later deploys never
   overwrite what you change in the admin;
4. builds the site.

Only **production** deploys (from `main`) change the database. Preview deploys
of other branches just build the site, so an unmerged change can never migrate
or seed the live store.

Check `https://<your-site>/api/v1/health` shows `"status":"ok"`.

## 5. After the first deploy

1. Open `https://<your-site>/admin` and sign in with `SEED_ADMIN_EMAIL` /
   `SEED_ADMIN_PASSWORD`.
2. **Inventory:** every pack size starts with 20 in stock. Set your real stock.
3. **Store settings:** check the store name, phone, address and return window.
4. **Email:** until this is set up the shop sends no email at all. Orders still
   work, and customers see their order on screen. For security the email login
   is kept only in Vercel, never in the admin. When you're ready, add these in
   **Settings → Environment Variables** (Production) and redeploy:

   | Name            | Value                                                                                                          |
   | --------------- | -------------------------------------------------------------------------------------------------------------- |
   | `SMTP_HOST`     | e.g. `smtp.gmail.com`                                                                                          |
   | `SMTP_PORT`     | `465` (with `SMTP_SECURE=true`) or `587`                                                                       |
   | `SMTP_SECURE`   | `true` for port 465, otherwise leave it out                                                                    |
   | `SMTP_USER`     | the email account, e.g. `orders@yourdomain.com`                                                                |
   | `SMTP_PASSWORD` | its password. For Gmail, an **App password** (Google Account → Security → 2-Step Verification → App passwords) |
   | `EMAIL_FROM`    | sender, e.g. `Amazon Group <orders@yourdomain.com>`                                                            |

   Or use Resend instead: `RESEND_API_KEY` (from resend.com) and `EMAIL_FROM`.
   Then in the admin, **Settings → Email** shows where email is sent from; press
   **Send test** to check. If email was set up in the admin before this
   change, it keeps working until you add these, and that page then offers to
   delete the saved copy.

5. **Staff:** invite your team. While email is off you get a link to send them
   yourself.

## How it fits together

- **Two services, one domain.** The project's top-level rewrites send
  `/api/*` to the `api` service (the Express app in `apps/api`, which sees the
  path unchanged, `/api/v1/...`) and everything else to the `storefront`
  service (Next.js: the shop in `app/(shop)`, the admin in `app/admin`).
  Browsers call `/api/v1` on the same domain, so login cookies are
  first-party.
- **Server-side reads use a service binding.** The storefront's server
  rendering reads the catalogue from the API at the internal `API_URL` that
  Vercel injects (`bindings` in `vercel.json`). Those requests carry a token
  derived from `JWT_ACCESS_SECRET` so they skip the per-IP rate limits.
- Shop and admin share the site, so a staff member signed in to the admin is
  also signed in to the shop.
- Emails are sent before the function finishes (`waitUntil`).
- **Scheduled jobs:** Vercel Cron calls `/api/v1/cron/daily` at 08:00 Pakistan
  time with the `CRON_SECRET`. It expires unpaid card orders, sends abandoned-cart
  reminders and review requests, and emails the daily summary.
- **Images:** the catalogue photos come from Unsplash's CDN (free to use).
  Photos you upload in the admin are resized in your browser and stored in the
  database, so no Cloudinary account is needed. Unsplash resizes its photos
  itself, so no Vercel image-optimisation quota is used.
- **Payments:** Cash on Delivery only. Card payments stay switched off until
  Stripe keys (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`,
  `STRIPE_WEBHOOK_SECRET`) are added.
- **Database:** the functions use Neon's pooled connection; migrations use the
  direct one (`DATABASE_URL_UNPOOLED`). Neon keeps point-in-time restore for
  backups.

## Custom domain

Add the domain under **Settings → Domains** (e.g. `amazongroup.pk`), set
`STOREFRONT_URL` = `https://amazongroup.pk`, and redeploy. The admin is then at
`amazongroup.pk/admin`.
