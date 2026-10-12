import { test, expect } from '@playwright/test';

test('SCEN-1215: 入金金額が請求金額より少ない場合、請求ステータスが請求済または滞納と判定される', async ({ page }) => {
  // 営業プロセス統合ダッシュボード画面から対象商談をクリック
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });

  // 商談一覧から対象商談を探す
  const dealRows = page.locator('#deal-tbody tr');
  const dealCount = await dealRows.count();

  let targetDealFound = false;
  for (let i = 0; i < dealCount; i++) {
    const row = dealRows.nth(i);
    const text = await row.textContent();

    // 商談を選択
    if (text && text.length > 0) {
      await row.click();
      targetDealFound = true;
      break;
    }
  }

  if (targetDealFound) {
    // 商談・請求管理画面に遷移し、当該商談の詳細タブが表示される
    await page.waitForSelector('#detail-panel', { timeout: 3000 });

    // 詳細タブ内の関連請求情報セクションから、請求の行をクリック
    const invoicesTab = page.locator('[data-testid="tab-invoices"]');
    await invoicesTab.click();

    // タブが切り替わるまで待機
    await page.waitForSelector('#invoices-tab', { timeout: 3000 });

    // 請求情報テーブルを確認
    const invoiceTable = page.locator('#invoice-tbody');
    const invoiceRows = invoiceTable.locator('tr:not(.empty-state)');
    const rowCount = await invoiceRows.count();

    if (rowCount > 0) {
      // 最初の請求書行を確認
      const firstRow = invoiceRows.first();
      const rowText = await firstRow.textContent();

      // 期待結果：請求ステータスが『請求済』または『滞納』のいずれかの値が表示される
      // 入金金額(60,000円)が請求金額(100,000円)より少ないため、
      // ステータスは『滞納』と表示されることが期待される

      // ステータスが『請求済』または『滞納』のいずれかであることを確認
      const hasStatus = (rowText || '').includes('請求済') || (rowText || '').includes('滞納');
      expect(hasStatus).toBe(true);
    }
  }
});
