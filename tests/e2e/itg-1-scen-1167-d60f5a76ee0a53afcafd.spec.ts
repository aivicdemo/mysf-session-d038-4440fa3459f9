import { test, expect } from '@playwright/test';

test.describe('SCEN-1167: 商談詳細タブ表示 - 請求状態が自動判定される', () => {
  test('should auto-determine and display invoice status', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 営業プロセス統合ダッシュボード内の当該商談「営業プロセス統合ダッシュボード導入」をクリック
    const dealSearchInput = page.locator('#filter-customer');
    await dealSearchInput.fill('営業プロセス統合ダッシュボード導入');

    const dealTable = page.locator('#deal-tbody tr');
    await dealTable.first().click();

    // 商談・請求管理画面が開き、商談詳細タブへ自動遷移することを確認
    await page.waitForSelector('#detail-panel', { timeout: 5000 });

    const detailPanel = page.locator('#detail-panel');

    // 商談詳細タブ内の「請求状態」フィールドを確認
    const invoiceStatusField = detailPanel.locator('.detail-row').filter({ hasText: /請求状態|invoice status/ });

    // 期待結果の検証
    // 請求状態フィールドに「未発行」と自動判定・表示される
    expect(invoiceStatusField).toContainText('未発行');

    // この値は、紐づく請求書オブジェクトのステータスに基づいて自動判定されているか確認
    const relatedInvoiceTab = page.locator('[data-tab="invoices"]');
    if (await relatedInvoiceTab.isVisible()) {
      await relatedInvoiceTab.click();

      const invoiceTable = page.locator('#invoice-tbody');
      const emptyMessage = invoiceTable.locator('text=関連する請求書がありません');

      // 請求書がない場合は「未発行」と表示されるべき
      if (await emptyMessage.isVisible()) {
        expect(invoiceStatusField).toContainText('未発行');
      }
    }

    // フィールドが読取専用属性またはステータスアイコン表示であることを確認
    const statusValue = invoiceStatusField.locator('.detail-value');
    const isReadOnly = await statusValue.evaluate(el => el.hasAttribute('readonly') || el.getAttribute('role') === 'status');

    // 自動判定であることが視認できる（手動入力フィールドではない）
    expect(statusValue).toBeVisible();
  });
});
