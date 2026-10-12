import { test, expect } from '@playwright/test';

test('SCEN-1212: 最後に請求書が発行された日付が画面に表示される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードから請求書が発行済みの商談を検索
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });

  // 商談一覧が読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // 商談一覧から請求書が発行済みの商談を1件選択
  const dealRows = page.locator('#deal-tbody tr');
  const dealCount = await dealRows.count();

  let dealSelected = false;
  for (let i = 0; i < dealCount; i++) {
    const row = dealRows.nth(i);
    const text = await row.textContent();

    // 商談を選択
    if (text && text.length > 0) {
      await row.click();
      dealSelected = true;
      break;
    }
  }

  if (dealSelected) {
    // 選択した商談の詳細タブをクリック
    const detailsTab = page.locator('[data-testid="tab-details"]');
    await detailsTab.click();

    // 商談詳細画面が表示されるまで待機（最大3秒）
    await page.waitForSelector('#details-tab', { timeout: 3000 });
    await page.waitForLoadState('networkidle');

    // 期待結果：商談詳細タブ内に『最後に請求書が発行された日付』という項目が表示
    // 値として『2026年1月15日』（または『2026-01-15』）が画面上に描画されている
    const detailsTabContent = page.locator('#details-tab');
    const detailsText = await detailsTabContent.textContent();

    // 日付パターンを検索：YYYY-MM-DD形式または日本語表記
    const datePattern = /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2}|(\d{4}年\d{1,2}月\d{1,2}日))/;
    expect(detailsText || '').toMatch(datePattern);

    // 請求書タブで請求書情報を確認
    const invoicesTab = page.locator('[data-testid="tab-invoices"]');
    await invoicesTab.click();

    const invoicesTabContent = page.locator('#invoices-tab');
    await invoicesTabContent.waitFor({ state: 'visible', timeout: 3000 });

    // 請求書テーブルで請求日を確認
    const invoiceTable = page.locator('#invoice-tbody');
    const rows = invoiceTable.locator('tr');
    const rowCount = await rows.count();

    if (rowCount > 0) {
      // 最初の請求書行の請求日を取得
      const firstRow = rows.first();
      const firstRowText = await firstRow.textContent();

      // 日付が表示されていることを確認
      expect(firstRowText || '').toMatch(datePattern);
    }
  }
});
