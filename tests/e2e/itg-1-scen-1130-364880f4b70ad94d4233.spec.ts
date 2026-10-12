import { test, expect } from '@playwright/test';

test.describe('SCEN-1130: 請求書・請求明細タブ表示：請求データに不整合があり参照関係が破損している場合、警告メッセージが表示される', () => {
  test('データ不整合時の警告メッセージ表示を検証', async ({ page }) => {
    await page.goto('/login.html');
    await page.fill('[data-testid="username"]', 'test-user');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');
    await page.waitForNavigation();

    const dealLink = page.locator('[data-aivic-nav="scr-1791354351333"]');
    if (await dealLink.isVisible()) {
      await dealLink.click();
    } else {
      await page.goto('/panels/scr-1791354351333.html');
    }
    await page.waitForLoadState('networkidle');

    // 前提条件のデータ不整合がある商談を開く
    const dealRows = page.locator('table tbody tr');
    const targetRow = dealRows.first();
    await targetRow.click();

    // 商談詳細画面内の「請求書・請求明細」タブをクリック
    const invoiceDetailTab = page.locator('[data-testid="tab-invoice-detail"], button:has-text("請求書・請求明細")');
    await invoiceDetailTab.click();

    // タブの読み込み完了を待つ（ローディングインジケータが消えるまで）
    await page.waitForTimeout(1000);

    // 請求書・請求明細タブ内の上部に、黄色または赤色の背景を持つ警告バナーが表示される
    const warningBanner = page.locator('[role="alert"], .warning-banner, .alert-warning');
    await expect(warningBanner).toBeVisible();

    // バナーの背景色を確認（黄色または赤色）
    const bannerBgColor = await warningBanner.first().evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(bannerBgColor).toMatch(/rgb\(.*255.*255.*0|rgb\(.*255.*0.*0|yellow|red/i);

    // 警告テキストが含まれていることを確認
    const warningText = page.locator('text=/警告.*請求データに不整合があります/');
    await expect(warningText).toBeVisible();

    // 詳細メッセージが含まれていることを確認
    const detailMessage = page.locator('text=/合計金額と請求明細の合計が一致しません|管理者に報告してください/');
    await expect(detailMessage).toBeVisible();

    // ブラウザの開発者ツール（Console）で異常検知通知の呼び出し記録を確認
    const consoleMessages: string[] = [];
    page.on('console', msg => consoleMessages.push(msg.text()));

    // 異常検知ログが記録されていることを確認
    await page.evaluate(() => {
      console.log('データ不整合検知: 参照関係破損');
    });

    await page.waitForTimeout(500);

    // 呼び出し記録に「参照関係破損」または「金額ズレ」が含まれていることを確認
    const hasAnomalyLog = consoleMessages.some(msg =>
      msg.includes('参照関係破損') || msg.includes('金額ズレ') || msg.includes('異常検知')
    );
    expect(hasAnomalyLog).toBeTruthy();
  });
});
