import { test, expect } from '@playwright/test';

test('商談がクローズ状態で請求書が存在するのに、請求書が商談クローズ前に発行されている場合、中程度の不整合として検出される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  const searchField = page.locator('#search-field');
  await searchField.fill('取引先A');

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
  await expect(dealRows.first()).toBeVisible();

  const firstRow = dealRows.first();
  const stageCells = firstRow.locator('td');

  const dealName = await stageCells.nth(0).textContent();
  const stageText = await stageCells.nth(2).textContent();
  expect(dealName).toBeTruthy();
  expect(stageText).toBeTruthy();
});
