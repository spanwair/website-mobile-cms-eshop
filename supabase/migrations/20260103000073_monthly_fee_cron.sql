-- Schedules the monthly platform-fee computation for own_company parties (see
-- monthly_platform_fees, previous migration). Calls the app's own API route rather than
-- doing the computation in SQL, so the business logic lives in one place
-- (shared/services/monthlyFeeService.ts) alongside every other commission calculation, and so
-- the same call can send the "you owe X this month" email via the existing Resend integration
-- (website/src/lib/integrations/email.ts) — not something pg_net/pg_cron can do on their own.
--
-- REQUIRED ONE-TIME MANUAL SETUP PER ENVIRONMENT (cannot be part of this migration — these are
-- environment-specific secrets, and CLAUDE.md rule 5 forbids hardcoding credentials in
-- committed files):
--
--   ALTER DATABASE postgres SET app.settings.site_url = 'https://your-deployed-site.tld';
--   ALTER DATABASE postgres SET app.settings.cron_secret = '<same value as CRON_SECRET in .env>';
--
-- Run both via the Supabase SQL editor (or `supabase db execute`) once per project (dev + prod
-- each need their own values), then reconnect for the setting to take effect. Until this is
-- done the cron job will fire but the HTTP call will fail (missing/blank URL) — check
-- `SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;` to confirm it's working.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'monthly-platform-fees',
  '0 3 1 * *', -- 03:00 UTC on the 1st of every month — computes the PREVIOUS month's turnover
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.site_url', true) || '/api/cron/monthly-platform-fees',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
