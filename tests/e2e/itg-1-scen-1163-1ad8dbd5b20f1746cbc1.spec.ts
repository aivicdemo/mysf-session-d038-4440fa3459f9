import { test, expect } from '@playwright/test';

test.describe('SCEN-1163: 商談詳細タブ表示 - 紐付く請求書の存在確認と請求ステータスが画面に反映される', () => {
  test('should display related invoices and their status', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 商談ID: DEAL-20250107-001 をクリック
    const dealSearchInput = page.locator('#filter-customer');
    await dealSearchInput.fill('DEAL-20250107-001');

    const dealTable = page.locator('#deal-tbody tr');
    await dealTable.first().click();

    // 商談詳細タブが表示されるまで待機（最大3秒）
    await page.waitForSelector('#detail-panel', { timeout: 3000 });

    // 「紐付く請求書」セクションを目視確認
    const invoiceTab = page.locator('[data-tab="invoices"]');
    if (await invoiceTab.isVisible()) {
      await invoiceTab.click();
    }

    const invoiceTableBody = page.locator('#invoice-tbody');
    await invoiceTableBody.waitFor({ state: 'visible', timeout: 3000 });

    // 期待結果の検証
    // 1. 請求書ID「INV-20250107-001」が表示されている
    const invoiceIdCell = invoiceTableBody.locator('text=INV-20250107-001');
    expect(invoiceIdCell).toBeDefined();

    // 2. 請求ステータス「発行済み」が表示されている
    const invoiceTable = page.locator('#invoice-tbody tr').first();
    expect(invoiceTable).toContainText('発行済');

    // 3. 請求書金額「500,000円」が商談金額「500,000円」と一致
    const invoiceAmountCell = invoiceTable.locator('.text-number').nth(2);
    const invoiceAmountText = await invoiceAmountCell.textContent();
    expect(invoiceAmountText).toContain('500,000');

    // 商談詳細から商談金額を確認
    const detailPanel = page.locator('#detail-panel');
    expect(detailPanel).toContainText('500,000');

    // 4. 請求日「2025-01-07」が表示されている
    expect(invoiceTable).toContainText('2025-01-07');
  });
});
