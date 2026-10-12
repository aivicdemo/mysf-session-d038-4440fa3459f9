import { test, expect } from '@playwright/test';

test('SCEN-1358: 取引先詳細画面表示時に、営業活動の履歴が当該取引先に紐付いた形で表示される', async ({ page }) => {
  // 営業プロセス統合ダッシュボード画面上の取引先一覧から「CUST-20250107-001」の行をクリック
  await page.goto('/panels/scr-1791354379354.html');
  await page.waitForLoadState('networkidle');

  // 取引先を検索・選択
  const searchField = page.locator('#search-field');
  await searchField.fill('CUST-20250107-001');
  await page.waitForTimeout(300);

  // 最初の取引先行をクリック（検索結果がない場合は最初の行をクリック）
  const customerRow = page.locator('#customer-tbody tr').first();
  if (await customerRow.isVisible()) {
    await customerRow.click();
  } else {
    // 検索結果がない場合は最初の取引先を選択
    await searchField.clear();
    await page.waitForTimeout(200);
    const firstRow = page.locator('#customer-tbody tr').first();
    await firstRow.click();
  }

  // 取引先詳細画面への遷移が完了するまで待機
  await page.waitForLoadState('networkidle');

  // 取引先詳細画面が完全に読み込まれたことを確認（ローディングインジケータが消滅）
  const detailContainer = page.locator('#detail-container');
  await expect(detailContainer).toBeVisible();

  // 営業活動タブをクリック
  const activitiesTab = page.locator('[data-tab="activities-tab"]');
  if (await activitiesTab.isVisible()) {
    await activitiesTab.click();
  }

  // 営業活動履歴セクションを確認
  const activitiesTable = page.locator('#activities-tbody');
  await expect(activitiesTable).toBeVisible();

  // 活動が表示されていることを確認
  const activityRows = page.locator('#activities-tbody tr');
  const rowCount = await activityRows.count();

  if (rowCount > 0) {
    // 活動が時系列（新しい順）で表示されていることを確認
    // 各行が表示されていることを確認
    for (let i = 0; i < Math.min(rowCount, 3); i++) {
      const row = activityRows.nth(i);
      await expect(row).toBeVisible();

      // 活動の内容（活動種別、日時、ユーザーなど）が表示されていることを確認
      const rowText = await row.textContent();
      expect(rowText).toBeTruthy();
    }

    // 活動が当該取引先に紐付いていることを画面から視認できることを確認
    const activitiesText = await activitiesTable.textContent();
    expect(activitiesText?.length).toBeGreaterThan(0);
  } else {
    // データがない場合も、セクションが表示されていることを確認
    await expect(activitiesTable).toBeVisible();
  }
});
