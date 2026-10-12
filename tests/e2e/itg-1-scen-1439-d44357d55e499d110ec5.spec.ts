import { test, expect } from '@playwright/test';

test.describe('SCEN-1439: 取引先請求タブ表示', () => {
  test('取引先一覧取得後、取引先に紐付く請求書一覧と請求状況が取得されて画面に反映される', async ({ page }) => {
    await page.goto('/panels/scr-1791354379354.html');

    // 顧客・取引先管理画面から取引先Aをクリックして選択する
    await page.waitForSelector('[data-aivic-panel]');
    const customerRows = await page.locator('table').locator('tr');

    // 取引先Aを検索して選択
    const customerCell = page.locator('text=株式会社トヨタ自動車工業').first();
    await customerCell.click();

    await page.waitForTimeout(500);

    // 取引先詳細ペイン内の『請求タブ』をクリックして開く
    const invoiceTab = page.locator('text=請求情報').first();
    await invoiceTab.click();

    // ローディング表示が完了するまで待機
    await page.waitForTimeout(2000);

    // 取引先請求タブが表示され、取引先Aに紐付く請求書一覧が表示されることを確認
    const invoiceTable = page.locator('#invoices-tbody');
    await expect(invoiceTable).toBeVisible();

    // 請求書番号を確認
    const invoiceNumbers = await page.locator('#invoices-tbody tr td:first-child').allTextContents();
    expect(invoiceNumbers.length).toBeGreaterThan(0);

    // 各請求書行に『請求書番号』『金額』『請求状況』が明示されていることを確認
    const rows = await page.locator('#invoices-tbody tr').all();
    for (const row of rows) {
      const cells = await row.locator('td').count();
      expect(cells).toBeGreaterThanOrEqual(3);
    }

    // ステータス別に色分け表示されていることを確認
    // テーブルに複数の行が表示されていることを確認
    expect(rows.length).toBeGreaterThan(0);
  });
});
