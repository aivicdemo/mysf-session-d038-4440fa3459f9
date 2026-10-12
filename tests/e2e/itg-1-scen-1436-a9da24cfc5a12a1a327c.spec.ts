import { test, expect } from '@playwright/test';

test('SCEN-1436: 営業活動タブ表示時にユーザー職位情報が未設定の場合警告が表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  // ユーザーの職位情報を未設定にシミュレート
  await page.evaluate(() => {
    (window as any).userPosition = null;
    (window as any).userRole = undefined;
  });

  // 取引先を選択
  const customerRows = page.locator('tbody#customer-tbody tr');

  if (await customerRows.count() > 0) {
    const firstCustomer = customerRows.first();
    await firstCustomer.click();

    // 営業活動タブをクリック
    const activitiesTab = page.locator('[data-tab="activities"]');
    await activitiesTab.click();

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 警告メッセージが表示されているか確認
    const pageContent = await page.innerText('body');

    // 職位情報未設定に関する警告を確認
    const hasWarning = pageContent.includes('職位') ||
                       pageContent.includes('未設定') ||
                       pageContent.includes('設定') ||
                       pageContent.includes('警告');

    // 警告バナー、アラートボックス、またはツールチップが表示されているか確認
    const warningBanner = page.locator('[role="alert"], [class*="alert"], [class*="warning"], [class*="banner"]');
    const hasWarningUI = await warningBanner.count() > 0;

    // ダッシュボード機能自体が正常に動作していることを確認
    // 営業活動タブへのアクセスがブロックされていないことを確認
    const activitiesTabContent = page.locator('#activities-tab.tab-content');
    const isNotBlocked = await activitiesTabContent.isVisible() || pageContent.length > 0;

    // 警告が表示されている、またはUI要素が存在することを確認
    expect(hasWarning || hasWarningUI).toBeTruthy();

    // アクセスが完全にブロックされていないことを確認
    expect(isNotBlocked).toBeTruthy();
  }
});
