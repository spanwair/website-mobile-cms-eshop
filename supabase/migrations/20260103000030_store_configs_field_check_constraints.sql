-- Defense-in-depth for store_configs.color_*/font_* — these values are injected into a
-- <style set:html> block on every public storefront page (website/src/lib/themeEngine.ts)
-- with zero HTML escaping. App-layer validation lives in
-- shared/services/storeConfigService.ts (updateStoreConfig), but a DB constraint closes the
-- gap for any other write path (direct SQL, future scripts, service-role calls).

ALTER TABLE store_configs
  ADD CONSTRAINT store_configs_color_primary_check         CHECK (color_primary        ~ '^#[0-9a-fA-F]{3,8}$'),
  ADD CONSTRAINT store_configs_color_secondary_check        CHECK (color_secondary       ~ '^#[0-9a-fA-F]{3,8}$'),
  ADD CONSTRAINT store_configs_color_background_check       CHECK (color_background      ~ '^#[0-9a-fA-F]{3,8}$'),
  ADD CONSTRAINT store_configs_color_surface_check          CHECK (color_surface         ~ '^#[0-9a-fA-F]{3,8}$'),
  ADD CONSTRAINT store_configs_color_text_primary_check     CHECK (color_text_primary    ~ '^#[0-9a-fA-F]{3,8}$'),
  ADD CONSTRAINT store_configs_color_text_secondary_check   CHECK (color_text_secondary  ~ '^#[0-9a-fA-F]{3,8}$'),
  ADD CONSTRAINT store_configs_color_border_check           CHECK (color_border          ~ '^#[0-9a-fA-F]{3,8}$'),
  ADD CONSTRAINT store_configs_font_heading_check           CHECK (font_heading          ~ '^[A-Za-z0-9 ''.-]{1,60}$'),
  ADD CONSTRAINT store_configs_font_body_check              CHECK (font_body             ~ '^[A-Za-z0-9 ''.-]{1,60}$');
