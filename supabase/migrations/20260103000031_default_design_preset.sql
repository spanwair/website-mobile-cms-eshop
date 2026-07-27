-- Shipped default look, derived from .claude/DESIGN.md (Lexend / green tech-resale palette),
-- corrected only where the raw doc tokens would fail its own WCAG AA rule (see designPresets.ts
-- for the full mapping rationale). Only changes column DEFAULTs — existing store_configs rows
-- keep whatever they were already customized to.

ALTER TABLE store_configs
  ALTER COLUMN color_primary        SET DEFAULT '#7EBA28',
  ALTER COLUMN color_secondary      SET DEFAULT '#89B744',
  ALTER COLUMN color_surface        SET DEFAULT '#F7F7F7',
  ALTER COLUMN color_text_primary   SET DEFAULT '#4D4D4D',
  ALTER COLUMN color_text_secondary SET DEFAULT '#6C757D',
  ALTER COLUMN color_border         SET DEFAULT '#E5E5E5',
  ALTER COLUMN font_heading         SET DEFAULT 'Lexend',
  ALTER COLUMN font_body            SET DEFAULT 'Lexend',
  ALTER COLUMN radius_scale         SET DEFAULT 'soft';
