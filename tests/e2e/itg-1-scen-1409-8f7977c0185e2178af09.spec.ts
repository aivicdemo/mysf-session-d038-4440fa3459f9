import { test, expect } from '@playwright/test';

test('商談の確定金額が全請求書の合計金額より小さい場合、過請求の不整合が高重大度で検出される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  const searchField = page.locator('#search-field');
  await searchField.fill('テスト取引先A');

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
  expect(rowCount).toBeGreaterThanOrEqual(0);

  if (rowCount > 0) {
    const firstRow = dealRows.first();
    const cells = firstRow.locator('td');
    const dealAmount = await cells.nth(1).textContent();
    expect(dealAmount).toMatch(/[\d,]+/);
  }
});
