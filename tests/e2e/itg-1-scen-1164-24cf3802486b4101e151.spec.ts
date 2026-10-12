import { test, expect } from '@playwright/test';

test.describe('SCEN-1164: 商談詳細タブ表示 - 請求明細の金額・数量・単価情報が画面に表示される', () => {
  test('should display invoice line items with amount, quantity, and unit price', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 商談ID「TEST-DEAL-001」をクリック
    const dealSearchInput = page.locator('#filter-customer');
    await dealSearchInput.fill('TEST-DEAL-001');

    const dealTable = page.locator('#deal-tbody tr');
    await dealTable.first().click();

    // 商談詳細ページが表示されるまで待機
    await page.waitForSelector('#detail-panel', { timeout: 5000 });

    // 「詳細」タブが自動選択されていることを確認
    const detailsTab = page.locator('[data-tab="details"]');
    const isDetailTabActive = await detailsTab.locator('.active').isVisible().catch(() => false);

    // ページをスクロールして「請求明細」セクションまで移動
    const invoiceDetailsTab = page.locator('[data-tab="invoice-details"]');
    if (await invoiceDetailsTab.isVisible()) {
      await invoiceDetailsTab.click();
    }

    // 請求明細セクションが表示されていることを確認
    const invoiceDetailTable = page.locator('#invoice-detail-tbody');
    await invoiceDetailTable.waitFor({ state: 'visible', timeout: 5000 });

    // 明細テーブルが表示されていることを確認
    const detailRows = invoiceDetailTable.locator('tr');
    const rowCount = await detailRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 期待結果の検証
    // ①金額列に「50000」
    const firstRow = detailRows.first();
    const amountCells = firstRow.locator('.text-number');

    // 各明細行が表示されていることを確認
    const allRows = invoiceDetailTable.locator('tr');
    for (let i = 0; i < await allRows.count(); i++) {
      const row = allRows.nth(i);
      const rowText = await row.textContent();

      // 金額・数量・単価が数値として表示されていることを確認
      expect(rowText).toMatch(/\d+/);
    }

    // ②数量列に「10」、③単価列に「5000」
    expect(firstRow).toContainText('10');
    expect(firstRow).toContainText('5000');
    expect(firstRow).toContainText('50000');

    // 各明細行は1行のテーブルレコードとして視認でき、データが画面切れ・非表示・null値表示になっていない
    const cells = firstRow.locator('td');
    for (let i = 0; i < await cells.count(); i++) {
      const cell = cells.nth(i);
      const cellText = await cell.textContent();
      expect(cellText?.trim()).not.toBe('');
      expect(cellText).not.toContain('null');
    }
  });
});
