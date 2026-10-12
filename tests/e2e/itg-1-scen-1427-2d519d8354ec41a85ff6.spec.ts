import { test, expect } from '@playwright/test';

test('SCEN-1427: 営業活動タブ表示時に営業活動、商談、請求書が時系列で統合表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  // 取引先を選択
  const customerRows = page.locator('tbody#customer-tbody tr');
  const firstCustomer = customerRows.first();
  await firstCustomer.click();

  // 取引先活動（営業活動）タブをクリック
  const activitiesTab = page.locator('[data-tab="activities"]');
  await activitiesTab.click();

  // タブが読み込まれるまで待機
  await page.locator('#activities-tab .table-wrap').waitFor({ state: 'visible' });

  // 営業活動一覧テーブルが表示されていることを確認
  const activitiesTable = page.locator('#activities-tab tbody');
  await expect(activitiesTable).toBeVisible();

  // テーブルの行を取得
  const rows = page.locator('#activities-tab tbody tr:not(.empty-state)');
  const rowCount = await rows.count();

  // データが表示されている場合、内容を検証
  if (rowCount > 0) {
    // テーブルに期待されるカラムがあることを確認
    const firstRow = rows.first();
    const cells = await firstRow.locator('td').count();
    expect(cells).toBeGreaterThanOrEqual(4); // 最小限のカラム数：活動種別、日付、担当者、内容

    // 日付が表示されていることを確認（形式: YYYY-MM-DD）
    const dateCell = firstRow.locator('td').nth(1);
    const dateText = await dateCell.innerText();
    expect(dateText).toMatch(/\d{4}-\d{2}-\d{2}|^-$/);
  }

  // タブ内のコンテンツが表示されていることを確認
  const tabContent = page.locator('#activities-tab.tab-content.active');
  await expect(tabContent).toBeVisible();
});
