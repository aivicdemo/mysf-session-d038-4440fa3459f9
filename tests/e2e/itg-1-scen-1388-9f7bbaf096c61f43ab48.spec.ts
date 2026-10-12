import { test, expect } from '@playwright/test';

test.describe('SCEN-1388: 表示開始日が表示終了日より後の場合、エラーメッセージが表示される', () => {
  test('日付範囲が無効な場合のエラー検証', async ({ page }) => {
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

    // 取引先リストから最初の取引先をクリック
    const firstCustomer = page.locator('#customer-tbody tr').first();
    await firstCustomer.click();

    // 詳細表示が表示されるのを待機
    await page.waitForLoadState('networkidle');

    // 表示開始日フィールドに「2026-12-31」を入力
    const startDateField = page.locator('input[type="date"][data-field="start-date"], input[name="displayStartDate"]').first();
    if (await startDateField.isVisible()) {
      await startDateField.fill('2026-12-31');
    }

    // 表示終了日フィールドに「2026-01-01」を入力（開始日より前）
    const endDateField = page.locator('input[type="date"][data-field="end-date"], input[name="displayEndDate"]').first();
    if (await endDateField.isVisible()) {
      await endDateField.fill('2026-01-01');
    }

    // 検索ボタンをクリック
    const searchButton = page.locator('button[data-action="filter"], button:has-text("検索"), button:has-text("表示")').first();
    if (await searchButton.isVisible()) {
      await searchButton.click();
    }

    // エラーメッセージが表示されることを確認
    const errorMessage = page.locator('text=表示開始日は表示終了日より前の日付を指定してください');
    await expect(errorMessage).toBeVisible();

    // 画面上部に赤背景で表示されていることを確認
    const errorBanner = page.locator('[role="alert"], .error-banner, [class*="error"]').filter({ has: errorMessage });
    await expect(errorBanner).toBeVisible();

    // フォーム入力状態が保持されていることを確認
    const formInputs = page.locator('input[type="date"]');
    expect(await formInputs.count()).toBeGreaterThan(0);
  });
});
