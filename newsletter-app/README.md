# Chévere Weekly

Companion Next.js service for Chévere's immediate subscriber list, weekly issue editor, email rendering, test sends, subscription management, provider-event logging, and Friday scheduling.

The production scheduler is intentionally disabled unless `NEWSLETTER_CRON_ENABLED=true`.

## Architecture

- **Public site:** remains on GitHub Pages. Its shared signup form posts to `https://newsletter.itschevere.com/api/subscribe`.
- **Newsletter service:** deploy this directory as a separate Vercel project whose root directory is `newsletter-app`.
- **Database and admin login:** Supabase Postgres and Supabase Auth.
- **Email:** Resend, using a verified sender domain and a signed webhook for delivery, open, click, bounce, complaint, and failure events.
- **Schedule:** `NEWSLETTER_SEND_TIME` stores the Friday time in `America/Chicago`. Vercel calls the protected endpoint at the matching UTC times in `vercel.json`; the endpoint checks Chicago wall-clock time so daylight-saving changes are handled correctly. The committed placeholder is 8:30 a.m. CT and must be replaced with the requested time before activation.

## Initial setup

1. Create a Supabase project.
2. Run `supabase/migrations/001_newsletter.sql` in the Supabase SQL editor.
3. In Supabase Auth, create Sabrina's admin user with the same email configured in `ADMIN_EMAIL`. Keep public user registration disabled because only the administrator signs in.
4. Create a Resend account, verify `itschevere.com`, and configure SPF/DKIM as Resend instructs. Add a signed webhook pointing to `https://newsletter.itschevere.com/api/webhooks/resend` and subscribe it to email delivery, failure, bounce, complaint, open, and click events.
5. Deploy this directory to Vercel with `newsletter.itschevere.com` as its custom domain.
6. Add every variable from `.env.example` to Vercel. Use long random values for `TOKEN_SECRET` and `CRON_SECRET`, and copy the webhook signing secret into `RESEND_WEBHOOK_SECRET`.
7. Keep `NEWSLETTER_CRON_ENABLED=false` through all verification steps.
8. Point the `newsletter` DNS record to Vercel only after the deployment is healthy.

## Required verification before activation

- The Supabase migration completed and all four newsletter tables have RLS enabled.
- The admin account can sign in and no other account can access `/admin` or its APIs.
- A public signup immediately creates or reactivates one active subscriber without a confirmation email.
- Repeated signup attempts do not create duplicate addresses.
- The footer unsubscribe link, one-click unsubscribe request, and subscription-management page immediately mark the subscriber unsubscribed.
- A draft can be saved, edited, and previewed at desktop and mobile widths.
- A published website article can populate The Chévere Read.
- A test email reaches the private `ADMIN_EMAIL` with correct images, links, sender details, and footer.
- An incomplete issue cannot be approved.
- An approved issue shows the next Friday at `NEWSLETTER_SEND_TIME` in America/Chicago.
- Resend webhook signatures are verified, duplicate webhook IDs are ignored, and supported delivery metrics appear in the dashboard.
- A manual request to `/api/cron/newsletter` with the correct Bearer secret records a disabled skip while the safety switch is false.
- Resend's sender domain is verified and its production sending limits are appropriate.

Only after every item passes, change `NEWSLETTER_CRON_ENABLED` to `true` and redeploy. Do not manually call the scheduled endpoint for a real issue unless the current Chicago time is within its allowed Friday window.

## Create the first issue

1. Open `/admin` and sign in.
2. Choose **Create issue**.
3. Fill in all six editorial sections and at least three recommendations.
4. Choose a published site article under **The Chévere Read** or enter its details manually.
5. Save the draft.
6. Use **Preview** and switch between desktop and mobile.
7. Use **Send test** and inspect the received message.
8. Return to the issue, make any changes, save again, and repeat the test if needed.
9. Check the per-issue approval box, then choose **Approve & schedule** only when the final issue is ready. This schedules it for the next Friday at `NEWSLETTER_SEND_TIME` in America/Chicago.

Drafts, empty issues, unapproved issues, previously sent issues, inactive subscribers, and unsubscribed addresses are never selected for delivery. If no eligible issue exists, that Friday is logged as skipped and nothing is sent.

## Local development

Copy `.env.example` to `.env.local`, fill in non-production test credentials, then run:

```text
pnpm install
pnpm dev
```

The public website can override the companion URL during local testing by defining `window.CHEVERE_NEWSLETTER_API_URL` before `site.js` loads.
