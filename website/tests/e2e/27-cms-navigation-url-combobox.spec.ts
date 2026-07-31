import { test, expect } from '@playwright/test';

test.describe('CMS Navigation URL Combobox', () => {
  test('always shows "Add new" and handles URL normalization', async ({ page }) => {
    await page.goto('/admin/cms/navigation');
    const combobox = page.locator('form.nav-form .combobox').first();
    const input = combobox.locator('.combobox-input');
    const list = combobox.locator('.combobox-list');

    // 1. Empty input: "Add new" visible, clicking does nothing
    await input.click();
    await expect(list).toBeVisible();
    const createItem = list.locator('.combobox-create');
    await expect(createItem).toBeVisible();
    await expect(createItem).toHaveAttribute('aria-disabled', 'true');
    await createItem.click();
    await expect(input).toHaveValue('');

    // 2. Type "kontakt" -> shows "/kontakt", clicking sets it
    await input.fill('kontakt');
    await expect(createItem).toBeVisible();
    await expect(createItem).toContainText('"/kontakt"');
    await createItem.click();
    await expect(input).toHaveValue('/kontakt');

    // 3. Type "/kontakt" -> clicking sets it (no double slash)
    await input.fill('/kontakt');
    await createItem.click();
    await expect(input).toHaveValue('/kontakt');

    // 4. Type "https://example.com" -> clicking sets it unchanged
    await input.fill('https://example.com');
    await createItem.click();
    await expect(input).toHaveValue('https://example.com');
  });

  test('footer URL combobox also normalizes URLs', async ({ page }) => {
    await page.goto('/admin/settings/footer');
    const combobox = page.locator('form.link-form .combobox').nth(1); // URL field is second combobox
    const input = combobox.locator('.combobox-input');
    const list = combobox.locator('.combobox-list');

    await input.click();
    await expect(list).toBeVisible();
    const createItem = list.locator('.combobox-create');
    await input.fill('kontakt');
    await expect(createItem).toContainText('"/kontakt"');
    await createItem.click();
    await expect(input).toHaveValue('/kontakt');
  });

  test('footer column_key combobox gating remains unchanged', async ({ page }) => {
    await page.goto('/admin/settings/footer');
    const combobox = page.locator('form.link-form .combobox').first(); // column_key field
    const input = combobox.locator('.combobox-input');
    const list = combobox.locator('.combobox-list');

    await input.click();
    await expect(list).toBeVisible();
    const createItem = list.locator('.combobox-create');
    await expect(createItem).toBeHidden(); // Empty input, no create item
    await input.fill('custom_col');
    await expect(createItem).toBeVisible();
  });
});
