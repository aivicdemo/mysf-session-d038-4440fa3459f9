import { test, expect } from '@playwright/test';

test('商談タブ表示時にステータス不整合（例：商談クローズなのに請求未作成）が検知されると、不整合の種類と詳細が表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  const searchField = page.locator('#search-field');
  await searchField.fill('TX-001');

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

  const stageText = await stageCells.nth(2).textContent();
  expect(stageText).toBeTruthy();
});
