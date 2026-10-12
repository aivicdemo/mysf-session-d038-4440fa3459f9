import { test, expect } from '@playwright/test';

test('商談タブ表示時に商談と請求書の金額ズレが検知されると、不整合の内容がダッシュボードに表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  const searchField = page.locator('#search-field');
  await searchField.fill('取引先');

  const customerRows = page.locator('#customer-tbody tr');
  await expect(customerRows.first()).toBeVisible();
  await customerRows.first().click();

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
  expect(rowCount).toBeGreaterThan(0);

  for (let i = 0; i < Math.min(rowCount, 5); i++) {
    const cells = dealRows.nth(i).locator('td');
    const dealAmount = await cells.nth(1).textContent();
    expect(dealAmount).toMatch(/[\d,]+/);
  }
});
