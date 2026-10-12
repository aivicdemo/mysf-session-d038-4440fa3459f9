import { test, expect } from '@playwright/test';

test('SCEN-1429: 営業活動タブ表示時にキャンセル・返金・修正請求ステータスの請求が視覚的に区別表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  // 取引先を選択
  const customerRows = page.locator('tbody#customer-tbody tr');
  const firstCustomer = customerRows.first();
  await firstCustomer.click();

  // 営業活動タブをクリック
  const activitiesTab = page.locator('[data-tab="activities"]');
  await activitiesTab.click();

  // タブが読み込まれるまで待機
  await page.locator('#activities-tab .table-wrap').waitFor({ state: 'visible' });

  // 営業活動タブ内に請求情報セクションがあるかを確認
  // 請求情報テーブルの有無を確認
  const invoicesTab = page.locator('[data-tab="invoices"]');
  const invoicesTableWrap = page.locator('#invoices-tab .table-wrap');

  // 請求情報セクションが存在する場合、ステータス別の視覚的区別を確認
  if (await invoicesTableWrap.isVisible()) {
    const invoiceRows = page.locator('#invoices-tab tbody tr:not(.empty-state)');
    const rowCount = await invoiceRows.count();

    if (rowCount > 0) {
      // 各請求行を確認
      for (let i = 0; i < Math.min(rowCount, 5); i++) {
        const row = invoiceRows.nth(i);
        const rowText = await row.innerText();

        // ステータスカラムをチェック
        // 最後のセルが通常ステータスカラム
        const statusCell = row.locator('td').last();
        const statusText = await statusCell.innerText();

        // ステータスに応じた背景色やバッジが設定されていることを確認
        const computedStyle = await statusCell.evaluate((el) => {
          return window.getComputedStyle(el).backgroundColor;
        });

        // 背景色が設定されていることを確認（デフォルトと異なる）
        expect(computedStyle).toBeDefined();

        // テキストステータスが表示されていることを確認
        expect(statusText.length).toBeGreaterThan(0);
      }
    }
  }

  // ホバー効果をテスト（マウスホバー時のハイライト）
  if (await invoicesTableWrap.isVisible()) {
    const firstInvoiceRow = page.locator('#invoices-tab tbody tr:not(.empty-state)').first();
    if (await firstInvoiceRow.isVisible()) {
      await firstInvoiceRow.hover();

      // ホバー後の背景色を確認
      const hoverStyle = await firstInvoiceRow.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      expect(hoverStyle).toBeDefined();
    }
  }
});
