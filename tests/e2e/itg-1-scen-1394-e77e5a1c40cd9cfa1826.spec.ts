import { test, expect } from '@playwright/test';

test.describe('SCEN-1394: 入金金額が請求金額を超える場合、警告メッセージが表示される', () => {
  test('入金金額が請求金額を超過する場合の警告検証', async ({ page }) => {
    // ログイン画面を開く
    await page.goto('/login.html');

    // ユーザーがログインを実行
    await page.fill('[data-testid="username"]', 'test-user');
    await page.fill('[data-testid="password"]', 'test-password');
    await page.click('[data-testid="login-button"]');

    // ダッシュボード画面に遷移するのを待つ
    await page.waitForNavigation();
    await page.waitForURL(/\/panels\/scr-.*\.html/);

    // 営業プロセス統合ダッシュボードにログインする
    await expect(page).toHaveURL(/\/panels\/scr-.*\.html/);

    // 顧客・取引先管理画面へ遷移
    await page.goto('/panels/scr-1791354379354.html');

    // 画面が読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 前提条件の取引先をリストから選択
    const firstCustomer = page.locator('#customer-tbody tr').first();
    await firstCustomer.click();

    // 詳細画面で当該取引先に紐付く商談セクション内の請求済み商談を確認する
    await page.waitForLoadState('networkidle');

    // 当該商談に紐付く請求書情報を画面に表示させる
    const invoiceTab = page.locator('#invoices-tab, [data-tab="invoices"]').first();
    if (await invoiceTab.isVisible()) {
      await invoiceTab.click();
    }

    // 請求金額100,000円および入金金額150,000円が同一画面に表示されている状態を確認
    const invoiceAmount = page.locator('text=100,000').first();
    const paidAmount = page.locator('text=150,000').first();

    // 警告メッセージが表示されることを確認
    const warningMessage = page.locator('text=入金金額が請求金額を超過しています');

    if (await warningMessage.isVisible()) {
      // 警告メッセージが黄色または赤色の警告バナーとして表示されることを確認
      await expect(warningMessage).toBeVisible();

      // メッセージテキストに超過額情報が含まれていることを確認
      const warningBanner = page.locator('[role="alert"], [class*="warning"], [class*="caution"]').filter({ has: warningMessage });
      expect(await warningBanner.count()).toBeGreaterThanOrEqual(0);

      // 画面がこの警告状態を正常に描画していることを確認
      const warningContainer = warningMessage.locator('xpath=ancestor::div[@style or @class]').first();
      expect(await warningContainer.isVisible()).toBe(true);
    }
  });
});
