-- Schedules the delivery-status poller (website/src/pages/api/cron/refresh-shipment-statuses.ts)
-- every 30 minutes. Neither PPL nor Packeta offer webhooks, so this is the only way a shipment
-- is ever automatically detected as delivered — which is also what settles payment_status for
-- 'cod' (dobírka) orders, see 20260103000075_order_payment_method.sql. Same pg_cron + pg_net
-- pattern as 20260103000073_monthly_fee_cron.sql — reuses the same app.settings.site_url /
-- app.settings.cron_secret DB settings, no additional one-time setup needed if that migration's
-- setup was already done for this environment.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'refresh-shipment-statuses',
  '*/30 * * * *', -- every 30 minutes
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.site_url', true) || '/api/cron/refresh-shipment-statuses',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', current_setting('app.settings.cron_secret', true)
    ),
    body := '{}'::jsonb
  );
  $$
);
