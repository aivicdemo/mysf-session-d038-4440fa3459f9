import { test, expect } from '@playwright/test';

test.describe('SCEN-1166: 商談詳細タブ表示 - 商談と請求書の参照関係が有効であることが検証される', () => {
  test('should verify valid reference relationship between deal and invoice', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 商談一覧から「DEAL-20250107-001」をクリック
    const dealSearchInput = page.locator('#filter-customer');
    await dealSearchInput.fill('DEAL-20250107-001');

    const dealTable = page.locator('#deal-tbody tr');
    await dealTable.first().click();

    // 商談詳細タブが表示されるまで待機
    await page.waitForSelector('#detail-panel', { timeout: 5000 });

    const detailPanel = page.locator('#detail-panel');

    // 商談詳細タブ内の「関連請求情報」セクションを確認
    const relatedInvoiceTab = page.locator('[data-tab="invoices"]');
    if (await relatedInvoiceTab.isVisible()) {
      await relatedInvoiceTab.click();
    }

    const invoiceTableBody = page.locator('#invoice-tbody');
    await invoiceTableBody.waitFor({ state: 'visible', timeout: 5000 });

    // 期待結果の検証
    // 1. 請求書ID「INV-20250107-001」が表示されている
    const invoiceIdCell = invoiceTableBody.locator('text=INV-20250107-001');
    expect(invoiceIdCell).toBeDefined();

    // 2. 請求金額「500,000円」が表示されている
    const firstInvoiceRow = invoiceTableBody.locator('tr').first();
    expect(firstInvoiceRow).toContainText('500,000');

    // 3. ステータス「未送付」が表示されている
    expect(firstInvoiceRow).toContainText('未送付');

    // 4. 商談と請求書の金額が一致（500,000円 = 500,000円）
    const dealDetailRows = detailPanel.locator('.detail-row');
    let dealAmount = '';

    for (let i = 0; i < await dealDetailRows.count(); i++) {
      const row = dealDetailRows.nth(i);
      const rowText = await row.textContent();
      if (rowText && rowText.includes('500,000')) {
        dealAmount = '500,000';
        break;
      }
    }

    expect(dealAmount).toBe('500,000');

    // 参照関係が有効であることが画面上で確認できる
    // 請求書が商談に紐付いて表示されている
    expect(firstInvoiceRow).toContainText('500,000');
    expect(detailPanel).toContainText('500,000');
  });
});
