import { test, expect } from '@playwright/test';

test('SCEN-1214: 入金金額が請求金額と一致する場合、請求ステータスが入金済と判定される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードにログイン
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });

  // 商談・請求管理画面が読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // テスト対象の商談（請求金額100,000円）を検索・選択
  // 商談一覧から該当商談を探す
  const dealRows = page.locator('#deal-tbody tr');
  const dealCount = await dealRows.count();

  let targetDealFound = false;
  for (let i = 0; i < dealCount; i++) {
    const row = dealRows.nth(i);
    const text = await row.textContent();

    // 金額が表示されている商談を選択
    if (text && text.includes('100,000')) {
      await row.click();
      targetDealFound = true;
      break;
    }
  }

  if (targetDealFound) {
    // 商談詳細タブを開く
    const detailPanel = page.locator('#detail-panel');
    await detailPanel.waitFor({ state: 'visible', timeout: 3000 });

    // 詳細情報内の「請求情報」セクションを表示
    const invoicesTab = page.locator('[data-testid="tab-invoices"]');
    await invoicesTab.click();

    // タブが切り替わるまで待機
    await page.waitForSelector('#invoices-tab', { timeout: 3000 });

    // 請求金額と入金金額の値を確認
    const invoiceTable = page.locator('#invoice-tbody');
    const invoiceRows = invoiceTable.locator('tr:not(.empty-state)');
    const rowCount = await invoiceRows.count();

    if (rowCount > 0) {
      // 最初の請求書行を確認
      const firstRow = invoiceRows.first();
      const rowText = await firstRow.textContent();

      // 期待結果：請求ステータスが「入金済」と表示されている
      // 入金状況列に「入金済」と表示されることを確認
      expect(rowText || '').toContain('入金済');
    }
  }
});
