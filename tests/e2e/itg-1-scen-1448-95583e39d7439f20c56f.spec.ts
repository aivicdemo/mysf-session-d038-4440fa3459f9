import { test, expect } from '@playwright/test';

test.describe('SCEN-1448: 請求書レコード取得時にデータベース接続が失敗した場合', () => {
  test('エラーメッセージが表示され、タブ表示が中止される', async ({ page }) => {
    // ログイン画面にアクセス
    await page.goto('/login.html');
    await page.fill('[name="username"]', 'test_user');
    await page.fill('[name="password"]', 'test_password');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('/panels/scr-1791354337614.html');

    // 営業プロセス統合ダッシュボードから「顧客・取引先管理画面」に遷移
    await page.click('[data-aivic-nav="scr-1791354379354"]');
    await page.waitForURL('/panels/scr-1791354379354.html');

    // 取引先一覧から任意の取引先レコードを選択
    await page.click('#customer-tbody tr:first-child');
    await page.waitForSelector('#detail-container');

    // データベース接続エラーをシミュレート
    await page.route('**/api/**', route => {
      route.abort('failed');
    });

    // 「取引先請求タブ」をクリック
    await page.click('[data-tab="invoices"]');

    // エラーメッセージが表示されることを確認
    const errorMsg = page.locator('text=/請求書情報の取得に失敗しました|データベース接続エラー/');
    await expect(errorMsg).toBeVisible();
    await expect(errorMsg).toHaveCSS('background-color', /rgb\(.*\d+.*\d+.*\d+.*\)/);

    // タブコンテンツ領域が空白であることを確認
    const invoicesTab = page.locator('#invoices-tab');
    const tbody = invoicesTab.locator('tbody');
    await expect(tbody).toBeVisible();
    const rows = await tbody.locator('tr').count();
    expect(rows).toBeLessThanOrEqual(1);

    // 「再試行」ボタンが表示されていることを確認
    const retryBtn = page.locator('button:has-text("再試行")');
    await expect(retryBtn).toBeVisible();
    await expect(retryBtn).toBeEnabled();

    // その他のタブ操作が可能であることを確認
    await page.click('[data-tab="deals"]');
    await expect(page.locator('#deals-tab')).toHaveClass(/active/);
  });
});
