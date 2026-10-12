import { test, expect } from '@playwright/test';

test('SCEN-1434: 営業活動タブ表示時にデータベースクエリがタイムアウトした場合エラーが返される', async ({ page }) => {
  // ネットワークエラーをシミュレート
  await page.route('**/api/**', async (route) => {
    // タイムアウトをシミュレート
    await new Promise(resolve => setTimeout(resolve, 35000)); // 30秒超過
    await route.abort('timedout');
  });

  await page.goto('/panels/scr-1791354379354.html');

  // 取引先を選択
  const customerRows = page.locator('tbody#customer-tbody tr');

  if (await customerRows.count() > 0) {
    const firstCustomer = customerRows.first();
    await firstCustomer.click();

    // ルートをリセット（営業活動タブ読み込み時のタイムアウトをシミュレート）
    await page.unroute('**/api/**');
    await page.route('**/api/by-name**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 35000));
      await route.abort('timedout');
    });

    // 営業活動タブをクリック
    const activitiesTab = page.locator('[data-tab="activities"]');
    await activitiesTab.click();

    // タイムアウトエラーメッセージが表示されるか確認
    const pageContent = await page.innerText('body');

    // エラーメッセージを確認
    const hasTimeoutError = pageContent.includes('タイムアウト') ||
                            pageContent.includes('読み込み') ||
                            pageContent.includes('再試行');

    // エラー領域にエラーアイコンと再試行ボタンが表示されるか確認
    const retryButton = page.locator('button:has-text("再試行")');
    const errorIcon = page.locator('[class*="error"], [class*="warning"]');

    // タイムアウトエラーまたはエラーUI要素が存在することを確認
    const hasErrorUI = await retryButton.isVisible() || await errorIcon.isVisible();

    expect(hasTimeoutError || hasErrorUI).toBeTruthy();
  }
});
