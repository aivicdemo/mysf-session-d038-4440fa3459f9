import { test, expect } from '@playwright/test';

test('商談タブ表示時に商談ステージマスタの定義が読み込まれ、ステージ選択肢が画面に反映される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  const searchField = page.locator('#search-field');
  await searchField.fill('株式会社テスト顧客');

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

  const firstRow = dealRows.first();
  const stageCells = firstRow.locator('td');

  const stageText = await stageCells.nth(2).textContent();
  expect(stageText).toMatch(/初期接触|ニーズ分析|提案|交渉|受注|失注|保留|再開/);
});
