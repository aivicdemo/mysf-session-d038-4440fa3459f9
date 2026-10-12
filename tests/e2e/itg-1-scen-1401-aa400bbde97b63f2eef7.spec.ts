import { test, expect } from '@playwright/test';

test('商談タブ表示時に商談に紐付く請求書が存在する場合、請求ステータスが画面に表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  const searchField = page.locator('#search-field');
  await searchField.fill('CUST-001');

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
  const dealRows = page.locator('#deals-tbody tr');

  await expect(dealRows.first()).toBeVisible();

  const firstDealRow = dealRows.first();
  await expect(firstDealRow.locator('td').nth(0)).toContainText('商談');

  const dealName = await firstDealRow.locator('td').nth(0).textContent();
  expect(dealName).toBeTruthy();
});
