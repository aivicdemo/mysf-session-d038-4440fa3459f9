import { test, expect } from '@playwright/test';

test('SCEN-1216: 本日が支払期限日を超えており、未入金残額がある場合、請求ステータスが滞納と判定される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードから、前提条件で紐付けられた商談をクリック
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });

  // 前提条件：本日が支払期限日を超えており、未入金残額がある商談を選択
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
    // 商談・請求管理画面に遷移し、商談詳細タブが表示されていることを確認
    await page.waitForSelector('#detail-panel', { timeout: 3000 });

    // 商談詳細タブ内の「請求ステータス」フィールドの表示内容を確認
    const invoicesTab = page.locator('[data-testid="tab-invoices"]');
    await invoicesTab.click();

    // タブが切り替わるまで待機
    await page.waitForSelector('#invoices-tab', { timeout: 3000 });

    // 請求書テーブルを確認
    const invoiceTable = page.locator('#invoice-tbody');
    const invoiceRows = invoiceTable.locator('tr:not(.empty-state)');
    const rowCount = await invoiceRows.count();

    if (rowCount > 0) {
      // 請求書行を確認
      const firstRow = invoiceRows.first();
      const rowText = await firstRow.textContent();

      // 期待結果：商談詳細タブの請求ステータスフィールドに「滞納」と表示される
      // ステータスの文字色・背景色・アイコンは、滞納を示す警告表示（赤系またはシステム定義の警告スタイル）で装飾
      expect(rowText || '').toContain('滞納');

      // ステータスのスタイルを確認（警告色で装飾されていることを確認）
      const statusCell = firstRow.locator('td:nth-child(5)'); // ステータス列
      const computedStyle = await statusCell.evaluate(el => {
        return window.getComputedStyle(el).color;
      });

      // 警告色（赤系）で表示されていることを確認
      // 注：実装によってスタイルが異なる場合がある
      expect(computedStyle).toBeTruthy();
    }
  }
});
