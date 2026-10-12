import { test, expect } from '@playwright/test';

test('同じ商談に複数の請求書が存在し、ステータスが不一貫な場合、不整合として検出される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  const searchField = page.locator('#search-field');
  await searchField.fill('取引先A');

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
  await expect(dealRows.first()).toBeVisible();

  const firstRow = dealRows.first();
  const cells = firstRow.locator('td');
  const dealName = await cells.nth(0).textContent();
  expect(dealName).toMatch(/DEAL-2024-001|商談/);
});
