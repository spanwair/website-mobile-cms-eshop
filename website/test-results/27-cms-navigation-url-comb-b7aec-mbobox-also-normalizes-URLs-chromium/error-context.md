# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 27-cms-navigation-url-combobox.spec.ts >> CMS Navigation URL Combobox >> footer URL combobox also normalizes URLs
- Location: tests/e2e/27-cms-navigation-url-combobox.spec.ts:37:3

# Error details

```
Error: Channel closed
```

```
Error: locator.click: Target page, context or browser has been closed
Call log:
  - waiting for locator('form.link-form .combobox').nth(1).locator('.combobox-input')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('CMS Navigation URL Combobox', () => {
  4  |   test('always shows "Add new" and handles URL normalization', async ({ page }) => {
  5  |     await page.goto('/admin/cms/navigation');
  6  |     const combobox = page.locator('form.nav-form .combobox').first();
  7  |     const input = combobox.locator('.combobox-input');
  8  |     const list = combobox.locator('.combobox-list');
  9  | 
  10 |     // 1. Empty input: "Add new" visible, clicking does nothing
  11 |     await input.click();
  12 |     await expect(list).toBeVisible();
  13 |     const createItem = list.locator('.combobox-create');
  14 |     await expect(createItem).toBeVisible();
  15 |     await expect(createItem).toHaveAttribute('aria-disabled', 'true');
  16 |     await createItem.click();
  17 |     await expect(input).toHaveValue('');
  18 | 
  19 |     // 2. Type "kontakt" -> shows "/kontakt", clicking sets it
  20 |     await input.fill('kontakt');
  21 |     await expect(createItem).toBeVisible();
  22 |     await expect(createItem).toContainText('"/kontakt"');
  23 |     await createItem.click();
  24 |     await expect(input).toHaveValue('/kontakt');
  25 | 
  26 |     // 3. Type "/kontakt" -> clicking sets it (no double slash)
  27 |     await input.fill('/kontakt');
  28 |     await createItem.click();
  29 |     await expect(input).toHaveValue('/kontakt');
  30 | 
  31 |     // 4. Type "https://example.com" -> clicking sets it unchanged
  32 |     await input.fill('https://example.com');
  33 |     await createItem.click();
  34 |     await expect(input).toHaveValue('https://example.com');
  35 |   });
  36 | 
  37 |   test('footer URL combobox also normalizes URLs', async ({ page }) => {
  38 |     await page.goto('/admin/settings/footer');
  39 |     const combobox = page.locator('form.link-form .combobox').nth(1); // URL field is second combobox
  40 |     const input = combobox.locator('.combobox-input');
  41 |     const list = combobox.locator('.combobox-list');
  42 | 
> 43 |     await input.click();
     |                 ^ Error: locator.click: Target page, context or browser has been closed
  44 |     await expect(list).toBeVisible();
  45 |     const createItem = list.locator('.combobox-create');
  46 |     await input.fill('kontakt');
  47 |     await expect(createItem).toContainText('"/kontakt"');
  48 |     await createItem.click();
  49 |     await expect(input).toHaveValue('/kontakt');
  50 |   });
  51 | 
  52 |   test('footer column_key combobox gating remains unchanged', async ({ page }) => {
  53 |     await page.goto('/admin/settings/footer');
  54 |     const combobox = page.locator('form.link-form .combobox').first(); // column_key field
  55 |     const input = combobox.locator('.combobox-input');
  56 |     const list = combobox.locator('.combobox-list');
  57 | 
  58 |     await input.click();
  59 |     await expect(list).toBeVisible();
  60 |     const createItem = list.locator('.combobox-create');
  61 |     await expect(createItem).toBeHidden(); // Empty input, no create item
  62 |     await input.fill('custom_col');
  63 |     await expect(createItem).toBeVisible();
  64 |   });
  65 | });
  66 | 
```