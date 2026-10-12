import { test, expect } from '@playwright/test';

test.describe('SCEN-1451: 請求書が存在しても請求明細が紐付かない場合', () => {
  test('参照関係の破損として警告が検出される', async ({ page }) => {
    // 営業プロセス統合ダッシュボードにアクセス
    await page.goto('/login.html');
    await page.fill('[name="username"]', 'test_user');
    await page.fill('[name="password"]', 'test_password');
    await page.click('button:has-text("ログイン")');

    // 顧客A（取引先）の行を特定
    await page.goto('/panels/scr-1791354379354.html');

    const customerSearch = page.locator('#search-field');
    await customerSearch.fill('顧客A');

    const customerRow = page.locator('#customer-tbody tr').first();
    await customerRow.click();

    // 「取引先請求タブ表示」リンクを選択
    await page.click('[data-tab="invoices"]');
    await page.waitForSelector('#invoices-tab.active');

    // 商談・請求管理画面が開き、顧客Aの請求書一覧が表示されるまで待機
    // テストデータとして参照関係の破損を確認
    const invoiceTable = page.locator('[data-testid="invoice-info-table"]');
    const invRow = invoiceTable.locator('tbody tr').filter({ has: page.locator('text=INV-2024-001') });

    // 「参照関係の破損」という警告ラベルが表示されることを確認
    const warningLabel = page.locator('text=/参照関係の破損|破損/');
    await expect(warningLabel).toBeVisible();

    // 警告内容として「請求書INV-2024-001：請求明細が紐付かれていません」というテキストが表示されることを確認
    const warningText = page.locator('text=/請求書INV-2024-001.*請求明細が紐付かれていません|請求明細が紐付かれていません/');
    await expect(warningText).toBeVisible();

    // ブラウザのネットワークトレースで異常検知通知API呼び出しが記録されたことを確認
    // ネットワークログをインターセプト
    let anomalyApiCalled = false;
    page.on('response', response => {
      if (response.url().includes('/api/anomaly') || response.url().includes('/notify')) {
        anomalyApiCalled = true;
      }
    });

    // ページをリロードしてAPI呼び出しを確認
    await page.reload();
    await page.waitForTimeout(2000);
    expect(anomalyApiCalled).toBeTruthy();
  });
});
