import { test, expect } from '@playwright/test';

test.describe('SCEN-1454: 集計期間内に商談が存在しない場合', () => {
  test('該当期間のデータがなく、集計結果に0件と表示される', async ({ page }) => {
    // 営業プロセス統合ダッシュボード画面にアクセス
    await page.goto('/login.html');
    await page.fill('[name="username"]', 'test_user');
    await page.fill('[name="password"]', 'test_password');
    await page.click('button:has-text("ログイン")');

    // 商談・請求管理画面に遷移
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');

    // 画面左側またはタブメニューから「取引先請求」タブをクリック
    const billingTab = page.locator('[data-testid="tab-invoices"], [data-tab="invoices"]');
    await billingTab.click();
    await page.waitForSelector('#invoices-tab.active, [class*="active"]');

    // 集計期間入力フィールドに「2026年1月1日」から「2026年1月31日」を入力
    const startDateField = page.locator('[name="start-date"], [placeholder*="開始日"], input[type="date"]').first();
    const endDateField = page.locator('[name="end-date"], [placeholder*="終了日"], input[type="date"]').last();

    if (await startDateField.isVisible()) {
      await startDateField.fill('2026-01-01');
    }
    if (await endDateField.isVisible()) {
      await endDateField.fill('2026-01-31');
    }

    // 取引先検索またはドロップダウンから取引先A（商談が存在しない取引先）を選択
    const customerDropdown = page.locator('select, [class*="dropdown"], [role="combobox"]').first();
    if (await customerDropdown.isVisible()) {
      await customerDropdown.click();
      await page.locator('text=/取引先A|CUST-001/').click();
    }

    // 「集計実行」ボタンをクリック
    const executeBtn = page.locator('button:has-text("集計実行"), button:has-text("検索"), button:has-text("実行")');
    await executeBtn.click();

    // 結果が表示されるまで待機
    await page.waitForTimeout(2000);

    // 「該当期間内の請求データ: 0件」と表示されることを確認
    const noDataMsg = page.locator('text=/該当期間内の請求データ.*0件|0件|データなし|該当する請求/');
    await expect(noDataMsg).toBeVisible();

    // 請求一覧テーブルが空白（ヘッダー行のみ）で表示されることを確認
    const invoiceTable = page.locator('[data-testid="invoice-list-table"], table').first();
    const bodyRows = invoiceTable.locator('tbody tr');
    const rowCount = await bodyRows.count();

    // ヘッダーのみで、データ行がないことを確認
    expect(rowCount).toBeLessThanOrEqual(1);

    // 空のテーブルメッセージまたは「データなし」メッセージが表示されることを確認
    const emptyMsg = invoiceTable.locator('text=/データなし|該当するデータ|空/');
    await expect(emptyMsg).toBeVisible();
  });
});
