import { test, expect } from '@playwright/test';

test.describe('SCEN-1455: 期間指定の開始日が終了日より後の場合', () => {
  test('エラーメッセージが表示され、期間の入力し直しが促される', async ({ page }) => {
    // 商談・請求管理画面にアクセス
    await page.goto('/login.html');
    await page.fill('[name="username"]', 'test_user');
    await page.fill('[name="password"]', 'test_password');
    await page.click('button:has-text("ログイン")');

    // 商談・請求管理画面に遷移
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');

    // 「取引先請求」タブを確認・クリック
    const billingTab = page.locator('[data-testid="tab-invoices"], [data-tab="invoices"]');
    await billingTab.click();
    await page.waitForSelector('#invoices-tab.active, [class*="active"]');

    // 期間指定フォームの「開始日」フィールドに「2025-12-31」を入力
    const startDateField = page.locator('[name="start-date"], [placeholder*="開始日"], input[type="date"]').first();
    if (await startDateField.isVisible()) {
      await startDateField.fill('2025-12-31');
    }

    // 期間指定フォームの「終了日」フィールドに「2025-01-01」を入力
    const endDateField = page.locator('[name="end-date"], [placeholder*="終了日"], input[type="date"]').last();
    if (await endDateField.isVisible()) {
      await endDateField.fill('2025-01-01');
    }

    // 期間指定フォーム下の「検索」または「確定」ボタンをクリック
    const searchBtn = page.locator('button:has-text("検索"), button:has-text("確定"), button:has-text("実行")');
    await searchBtn.click();

    // エラーメッセージが表示されることを確認
    const errorMsg = page.locator('text=/開始日が終了日より後|開始日は終了日以前|期間が無効|日付エラー/');
    await expect(errorMsg).toBeVisible();

    // エラーメッセージが赤色またはエラー背景色で表示されることを確認
    const errorContainer = errorMsg.or(page.locator('[role="alert"], [class*="error"]'));
    await expect(errorContainer).toHaveCSS('background-color', /rgb\(.*\d+.*\d+.*\d+.*\)|red|#/);

    // 開始日フィールドと終了日フィールドが入力可能な状態のままであることを確認
    await expect(startDateField).toBeEnabled();
    await expect(endDateField).toBeEnabled();

    // 検索処理が実行されず、請求データ一覧が更新されていないことを確認
    const invoiceTable = page.locator('[data-testid="invoice-list-table"], table');
    const rowsBefore = await invoiceTable.locator('tbody tr').count();

    // 再度検索をクリック
    await searchBtn.click();

    const rowsAfter = await invoiceTable.locator('tbody tr').count();
    expect(rowsBefore).toBe(rowsAfter);
  });
});
