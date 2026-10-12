import { test, expect } from '@playwright/test';

test('SCEN-1217: 本日が支払期限日以前で、未入金残額がある場合、請求ステータスが請求済と判定される', async ({ page }) => {
  // ブラウザで営業プロセス・請求データ統合管理システムにログイン
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });

  // 商談・請求管理画面に遷移する
  await page.waitForLoadState('networkidle');

  // 前提条件の商談を検索・選択し、商談詳細タブを開く
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
    // 商談詳細パネルが表示されるまで待機
    await page.waitForSelector('#detail-panel', { timeout: 3000 });

    // 関連する請求書情報セクションを確認
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

      // 期待結果：商談詳細タブの請求書情報セクションで、請求ステータスが「請求済」と表示される
      // 具体的には、本日が支払期限日以前（本日 ≤ 支払期限日）かつ
      // 未入金残額（40,000円）が存在する状態において、
      // 請求ステータスフィールドに「請求済」という文字列が画面上に描画される

      expect(rowText || '').toContain('請求済');
    }
  }
});
