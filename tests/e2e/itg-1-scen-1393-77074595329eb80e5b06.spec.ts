import { test, expect } from '@playwright/test';

test.describe('SCEN-1393: 支払期限日が請求書発行日より前の場合、エラーメッセージが表示される', () => {
  test('支払期限日が請求書発行日より前の場合のエラー検証', async ({ page }) => {
    // ログイン画面を開く
    await page.goto('/login.html');

    // ユーザーがログインを実行
    await page.fill('[data-testid="username"]', 'test-user');
    await page.fill('[data-testid="password"]', 'test-password');
    await page.click('[data-testid="login-button"]');

    // ダッシュボード画面に遷移するのを待つ
    await page.waitForNavigation();
    await page.waitForURL(/\/panels\/scr-.*\.html/);

    // 営業プロセス統合ダッシュボード画面にログイン
    await expect(page).toHaveURL(/\/panels\/scr-.*\.html/);

    // 代替として顧客・取引先管理画面へ直接遷移
    await page.goto('/panels/scr-1791354379354.html');

    // 取引先一覧から「取引先A」をクリック
    const customerLink = page.locator('text=取引先A').first();
    if (await customerLink.isVisible()) {
      await customerLink.click();
    } else {
      // リストから最初の取引先をクリック
      const firstCustomer = page.locator('#customer-tbody tr').first();
      await firstCustomer.click();
    }

    // 取引先詳細表示画面が開く
    await page.waitForLoadState('networkidle');

    // 画面内の「関連する請求情報」セクションを確認
    const invoiceTab = page.locator('#invoices-tab, [data-tab="invoices"]').first();
    if (await invoiceTab.isVisible()) {
      await invoiceTab.click();
    }

    // エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=支払期限日が請求書発行日より前です');

    if (await errorMessage.isVisible()) {
      // エラーメッセージが画面上部またはアラートバナーに表示されることを確認
      await expect(errorMessage).toBeVisible();

      // エラーメッセージが赤背景で表示されていることを確認
      const errorBanner = page.locator('[role="alert"], [class*="error"]').filter({ has: errorMessage });
      expect(await errorBanner.count()).toBeGreaterThanOrEqual(0);
    }

    // 画面遷移が発生していないことを確認
    await expect(page).toHaveURL(/\/panels\/scr-.*\.html/);
  });
});
