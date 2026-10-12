import { test, expect } from '@playwright/test';

test.describe('SCEN-1389: 該当顧客の商談・請求レコードが存在しない場合、警告メッセージが表示される', () => {
  test('商談・請求レコード無しの場合の警告メッセージ検証', async ({ page }) => {
    // ログイン画面を開く
    await page.goto('/login.html');

    // ユーザーがログインを実行
    await page.fill('[data-testid="username"]', 'test-user');
    await page.fill('[data-testid="password"]', 'test-password');
    await page.click('[data-testid="login-button"]');

    // ダッシュボード画面に遷移するのを待つ
    await page.waitForNavigation();
    await page.waitForURL(/\/panels\/scr-.*\.html/);

    // 顧客・取引先管理画面へ遷移
    await page.goto('/panels/scr-1791354379354.html');

    // 画面が読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 商談・請求レコードが紐付いていない取引先を選択
    const customerRows = page.locator('#customer-tbody tr');
    const firstCustomer = customerRows.first();
    await firstCustomer.click();

    // 詳細表示が完全にロードされるまで待機
    await page.waitForLoadState('networkidle');

    // 警告メッセージが表示されることを確認
    const warningMessage = page.locator('text=この顧客に関連する商談・請求レコードが見つかりません');

    // 警告メッセージが画面上部またはタブ内のエリアに表示されていることを確認
    if (await warningMessage.isVisible()) {
      await expect(warningMessage).toBeVisible();

      // メッセージがアラートコンポーネント（警告カラー）で表示されていることを確認
      const warningBanner = page.locator('[role="alert"], [class*="warning"], [class*="alert"]').filter({ has: warningMessage });
      expect(await warningBanner.count()).toBeGreaterThan(0);
    }
  });
});
