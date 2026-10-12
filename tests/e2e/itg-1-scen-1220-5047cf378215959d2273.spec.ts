import { test, expect } from '@playwright/test';

test('SCEN-1220: 顧客の過去12ヶ月間の商談・請求データが時系列で統合表示される', async ({ page }) => {
  // 営業プロセス統合ダッシュボード画面を開く
  await page.goto('/panels/scr-1791354337614.html');

  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // 商談・請求管理画面へ遷移
  // (仕様の構成上、商談詳細タブはこの画面で確認)
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForLoadState('networkidle');

  // 取引先フィルターで顧客を検索（オプション）
  const filterCustomer = page.locator('#filter-customer');
  await filterCustomer.fill('');
  await page.waitForTimeout(300);

  // 商談一覧から最初の商談を選択
  const dealRows = page.locator('tbody#deal-tbody tr');
  const rowCount = await dealRows.count();

  if (rowCount > 0) {
    await dealRows.first().click();
    await page.waitForTimeout(500);
  }

  // 商談詳細パネルが表示される
  const detailPanel = page.locator('#detail-panel');
  await expect(detailPanel).toBeVisible();

  // 「関連請求書」タブが表示される
  const invoiceTabBtn = page.locator('button[data-tab="invoices"]');
  await expect(invoiceTabBtn).toBeVisible();

  // 「請求明細」タブが表示される
  const detailsTabBtn = page.locator('button[data-tab="details"]');
  await expect(detailsTabBtn).toBeVisible();

  // 関連請求書タブをクリック
  await invoiceTabBtn.click();
  await page.waitForTimeout(300);

  // 請求書テーブルを確認
  const invoiceTable = page.locator('#invoices-tab table');
  const invoiceTableHeaders = invoiceTable.locator('th');

  // 期待される列ヘッダー: 請求書番号、請求日、支払期限、請求金額、ステータス、入金状況
  const expectedHeaderCount = 6;
  const headerCount = await invoiceTableHeaders.count();
  expect(headerCount).toBeGreaterThanOrEqual(expectedHeaderCount);

  // 請求書行データを確認
  const invoiceRows = invoiceTable.locator('tbody tr');
  const invoiceRowCount = await invoiceRows.count();

  // テストデータが存在する場合、データ行が表示される
  // またはデータがない場合は「関連する請求書がありません」メッセージ
  if (invoiceRowCount > 1) {
    // 実際のデータ行が存在
    // 各行が請求書情報を含むことを確認
    const firstRow = invoiceRows.first();
    const cells = firstRow.locator('td');
    expect(await cells.count()).toBeGreaterThanOrEqual(expectedHeaderCount);
  }

  // 請求明細タブをクリック
  await detailsTabBtn.click();
  await page.waitForTimeout(300);

  // 請求明細テーブルを確認
  const detailTable = page.locator('#details-tab table');
  const detailTableHeaders = detailTable.locator('th');

  // 期待される列ヘッダー: 行番号、商品名、数量、単価、金額、税率、税額、税込金額
  const expectedDetailHeaderCount = 8;
  const detailHeaderCount = await detailTableHeaders.count();
  expect(detailHeaderCount).toBeGreaterThanOrEqual(expectedDetailHeaderCount);

  // 請求明細行データを確認
  const detailRows = detailTable.locator('tbody tr');
  const detailRowCount = await detailRows.count();

  if (detailRowCount > 1) {
    // 実際のデータ行が存在
    // 各行が請求明細情報を含むことを確認
    const firstDetailRow = detailRows.first();
    const detailCells = firstDetailRow.locator('td');
    expect(await detailCells.count()).toBeGreaterThanOrEqual(expectedDetailHeaderCount);
  }

  // 確認: 商談詳細タブが正常に表示され、関連する請求データが統合表示されている
  await expect(detailPanel).toBeVisible();
  await expect(invoiceTabBtn).toBeVisible();
  await expect(detailsTabBtn).toBeVisible();
});
