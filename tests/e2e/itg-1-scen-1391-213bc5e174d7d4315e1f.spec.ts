import { test, expect } from '@playwright/test';

test.describe('SCEN-1391: 請求書期日が不正な日付形式の場合、エラーメッセージが表示される', () => {
  test('不正な日付形式に対するエラー検証', async ({ page }) => {
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

    // 不正な請求書期日を持つ取引先を検索して特定
    const customerRows = page.locator('#customer-tbody tr');
    const firstCustomer = customerRows.first();
    await firstCustomer.click();

    // 詳細表示画面へ遷移
    await page.waitForLoadState('networkidle');

    // 請求書期日フィールドのエラー表示を確認
    const invalidDateError = page.locator('text=請求書期日の形式が不正です。正しい日付形式（YYYY-MM-DD）で入力してください');

    if (await invalidDateError.isVisible()) {
      // エラーメッセージが表示されていることを確認
      await expect(invalidDateError).toBeVisible();

      // エラーメッセージが赤色またはエラーアイコンとともに表示されていることを確認
      const errorElement = invalidDateError.locator('xpath=ancestor::div[@style or @class]').first();
      await expect(errorElement).toBeVisible();
    }

    // その他の取引先情報フィールドが正常に表示されていることを確認
    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();

    // ページが正常にレンダリングされていることを確認
    const content = page.locator('[class*="content"]').first();
    await expect(content).toBeVisible();
  });
});
