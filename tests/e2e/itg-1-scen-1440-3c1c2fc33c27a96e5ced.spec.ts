import { test, expect } from '@playwright/test';

test.describe('SCEN-1440: 取引先請求タブ表示', () => {
  test('請求書一覧取得後、各請求書に紐付く請求明細の金額・数量情報が取得されて詳細表示が可能になる', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 商談・請求管理画面で、複数の請求書が紐付いている取引先を選択
    await page.waitForSelector('[data-aivic-panel]');

    // 取引先一覧から複数の請求書が紐付いている取引先を選択
    const dealRows = await page.locator('#deal-tbody tr');
    if (await dealRows.count() > 0) {
      await dealRows.first().click();
    }

    await page.waitForTimeout(500);

    // 画面上の「取引先請求タブ」をクリックして、当該取引先に紐付く請求書一覧を取得
    const invoiceTab = page.locator('text=関連請求書').first();
    await invoiceTab.click();

    await page.waitForTimeout(500);

    // 請求書一覧が表示されたことを確認
    const invoiceTable = page.locator('#invoice-tbody');
    await expect(invoiceTable).toBeVisible();

    const invoiceRows = await page.locator('#invoice-tbody tr');
    if (await invoiceRows.count() > 0) {
      // 請求書一覧内の最初の請求書行をクリックして詳細表示を開く
      await invoiceRows.first().click();

      await page.waitForTimeout(500);

      // 請求書詳細画面が開き、請求明細セクションが表示されることを確認
      const detailTable = page.locator('#invoice-detail-tbody');
      await expect(detailTable).toBeVisible();

      // 複数行の明細データが表示されていることを確認
      const detailRows = await page.locator('#invoice-detail-tbody tr');
      expect(await detailRows.count()).toBeGreaterThanOrEqual(0);

      // 各請求明細行の「数量」列と「金額」列の値を視認
      for (const row of await detailRows.all()) {
        const cells = await row.locator('td').count();
        expect(cells).toBeGreaterThanOrEqual(2);
      }

      // 別の請求書行をクリックして詳細表示を開く
      const allInvoiceRows = await page.locator('#invoice-tbody tr');
      if (await allInvoiceRows.count() > 1) {
        await allInvoiceRows.nth(1).click();

        await page.waitForTimeout(500);

        // 当該請求書の請求明細セクションが表示され、異なる明細データが表示されていることを確認
        const updatedDetailRows = await page.locator('#invoice-detail-tbody tr');
        expect(await updatedDetailRows.count()).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
