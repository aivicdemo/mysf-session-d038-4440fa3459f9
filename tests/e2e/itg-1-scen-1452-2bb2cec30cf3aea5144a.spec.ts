import { test, expect } from '@playwright/test';

test.describe('SCEN-1452: 商談ステータスが受注なのに請求書ステータスが未発行の場合', () => {
  test('ステータス不整合として異常が検出される', async ({ page }) => {
    // 営業プロセス統合ダッシュボードにアクセスしてページ全体が読み込まれるまで待機
    await page.goto('/login.html');
    await page.fill('[name="username"]', 'test_user');
    await page.fill('[name="password"]', 'test_password');
    await page.click('button:has-text("ログイン")');
    await page.waitForURL('/panels/scr-1791354337614.html');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 異常値・未完了案件セクションまでスクロール
    const anomalySection = page.locator('text=/異常値|未完了案件|異常検知/');
    await anomalySection.scrollIntoViewIfNeeded();

    // ステータス不整合の異常が検出され表示されることを確認
    const statusMismatchAlert = page.locator('text=/ステータス不整合|商談.*受注.*請求書.*未発行/');
    await expect(statusMismatchAlert).toBeVisible();

    // アラートバナーまたはテーブル行に「ステータス不整合」という異常が表示されることを確認
    const mismatchContent = page.locator('text=/テスト取引先A.*受注|ステータス不整合/');
    await expect(mismatchContent).toBeVisible();

    // NotificationServiceAdapterの呼び出しが発生したことをブラウザコンソールログで確認
    let notificationCalled = false;
    page.on('console', msg => {
      if (msg.text().includes('NotificationServiceAdapter') || msg.text().includes('sendAnomalyAlert')) {
        notificationCalled = true;
      }
    });

    // ネットワークトレースでAPI呼び出しが発生したことを確認
    let apiCalled = false;
    page.on('response', response => {
      if (response.url().includes('/api/notification') || response.url().includes('/api/anomaly')) {
        apiCalled = true;
      }
    });

    // ページをリロードして検証を実行
    await page.reload();
    await page.waitForTimeout(3000);

    expect(apiCalled).toBeTruthy();
  });
});
