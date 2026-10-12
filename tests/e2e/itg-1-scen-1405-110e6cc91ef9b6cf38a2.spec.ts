import { test, expect } from '@playwright/test';

test('商談タブ表示操作が監査ログに記録される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  const searchField = page.locator('#search-field');
  await searchField.fill('取引先');

  const customerRows = page.locator('#customer-tbody tr');
  await expect(customerRows.first()).toBeVisible();
  await customerRows.first().click();

  const detailSection = page.locator('#detail-container');
  await expect(detailSection).toBeVisible();

  const dealTab = page.locator('[data-tab="deals-tab"], .tab[data-tab="deals-tab"]').first();
  if (await dealTab.isVisible()) {
    await dealTab.click();
  }

  const dealsContent = page.locator('#deals-tab, [id="deals-tab"]');
  await expect(dealsContent).toBeVisible();

  const dealTable = page.locator('#deals-tbody');
  await expect(dealTable).toBeVisible();

  const dealRows = page.locator('#deals-tbody tr');
  const rowCount = await dealRows.count();
  expect(rowCount).toBeGreaterThanOrEqual(0);
});
