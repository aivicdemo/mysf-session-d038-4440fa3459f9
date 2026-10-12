import { test, expect } from '@playwright/test';

test('SCEN-1433: 営業活動タブ表示時にアクセス権限がない場合エラーが返される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  // アクセス権限がない状態をシミュレート
  // ユーザーの権限を制限する
  await page.evaluate(() => {
    (window as any).userPermissions = [];
  });

  // 取引先を選択
  const customerRows = page.locator('tbody#customer-tbody tr');

  if (await customerRows.count() > 0) {
    const firstCustomer = customerRows.first();
    await firstCustomer.click();

    // 営業活動タブをクリック
    const activitiesTab = page.locator('[data-tab="activities"]');
    await activitiesTab.click();

    // エラーメッセージが表示されるかを確認
    const pageContent = await page.innerText('body');

    // 権限エラーメッセージを確認
    const hasPermissionError = pageContent.includes('権限') ||
                               pageContent.includes('アクセス') ||
                               pageContent.includes('403') ||
                               pageContent.includes('Forbidden');

    // タブの内容が表示されていないことを確認
    const activitiesTable = page.locator('#activities-tab .table-wrap');
    const isTableHidden = !await activitiesTable.isVisible();

    // 権限有り範囲の表示状態を確認
    // ダッシュボードは権限あり範囲の表示を維持
    const customerList = page.locator('#customer-tbody');
    await expect(customerList).toBeVisible();

    // 権限エラーまたはテーブル非表示が成立することを確認
    expect(hasPermissionError || isTableHidden).toBeTruthy();
  }
});
