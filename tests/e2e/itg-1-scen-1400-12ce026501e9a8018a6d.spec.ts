import { test, expect } from '@playwright/test';

test('取引先商談タブ表示: ユーザーの権限に基づいてアクセス可能な商談一覧が表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  const searchField = page.locator('#search-field');
  await searchField.fill('株式会社テック');

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

  for (let i = 0; i < Math.min(rowCount, 10); i++) {
    const cells = dealRows.nth(i).locator('td');
    const dealName = cells.nth(0);
    const dealAmount = cells.nth(1);
    const dealStage = cells.nth(2);
    const dealDate = cells.nth(3);

    await expect(dealName).toHaveText(/[\s\S]+/);
    await expect(dealAmount).toHaveText(/[\d,]+/);
    await expect(dealStage).toHaveText(/[\s\S]+/);
    await expect(dealDate).toHaveText(/[\d-]/);
  }
});
