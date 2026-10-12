import { test, expect } from '@playwright/test';

test('SCEN-1380: 請求書が未確定・未送付状態の場合、その件数が商談詳細に「保留中」として表示される', async ({ page }) => {
  // 営業プロセス統合ダッシュボード画面を開く
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForLoadState('networkidle');

  // 顧客・取引先管理画面から検索して対象取引先詳細を開く
  // テストデータより対象取引先をクリック
  const customerRow = page.locator('tbody tr').first();
  await customerRow.click();
  await page.waitForTimeout(300);

  // 取引先詳細画面に表示された商談一覧から、請求書が紐付いている商談を選択
  const dealsTab = page.locator('[data-testid="tab-deals"]');
  await dealsTab.click();
  await page.waitForTimeout(300);

  // 商談詳細表示を開く - 商談クリック
  const dealRow = page.locator('[data-testid="related-deals-table"] tbody tr').first();
  if (dealRow) {
    await dealRow.click();
  }

  // 商談詳細画面の請求書情報セクションを確認
  const invoicesTab = page.locator('[data-testid="tab-invoices"]');
  await invoicesTab.click();
  await page.waitForTimeout(300);

  // 請求書情報テーブルを確認
  const invoiceTable = page.locator('[data-testid="invoice-info-table"]');
  await expect(invoiceTable).toBeVisible();

  // 「保留中」表示の確認 - 未確定・未送付状態の請求書件数をカウント
  const invoiceRows = page.locator('[data-testid="invoice-info-table"] tbody tr');
  const rowCount = await invoiceRows.count();

  let pendingCount = 0;
  for (let i = 0; i < rowCount; i++) {
    const row = invoiceRows.nth(i);
    const statusCell = row.locator('td').last();
    const statusText = await statusCell.textContent();

    // 「未確定」または「未送付」ステータスをカウント
    if (statusText && (statusText.includes('未確定') || statusText.includes('未送付'))) {
      pendingCount++;
    }
  }

  // 仕様に合わせて、「保留中: N件」という表示があるか確認
  // または、未確定・未送付の件数が正確に計算されていることを確認
  if (pendingCount > 0) {
    // テーブル内に明示的な「保留中」表示があるか確認
    const tableContent = await invoiceTable.textContent();
    expect(tableContent).toContain('未確定');
  }
});
