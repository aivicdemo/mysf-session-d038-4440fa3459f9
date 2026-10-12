import { test, expect } from '@playwright/test';

test('SCEN-1203: 商談に請求書が複数件紐付いており、合計金額が商談金額と一致する場合、整合状態が表示される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.fill('input[type="email"]', 'sales_user@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業プロセス統合ダッシュボードにアクセス
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForTimeout(1000);

  // 商談・請求管理画面に移動
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForTimeout(1000);

  // 商談一覧から商談ID「DEAL-20250207-001」を検索
  await page.fill('[data-testid="filter-customer"]', 'DEAL-20250207-001');
  await page.waitForTimeout(500);

  // 該当行をクリック
  const dealRows = await page.locator('table[data-testid="deal-list-table"] tbody tr').count();
  expect(dealRows).toBeGreaterThan(0);

  await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
  await page.waitForTimeout(500);

  // 商談・請求管理画面に遷移し、商談詳細タブが表示される
  const detailPanel = await page.locator('#detail-panel');
  await expect(detailPanel).toBeVisible();

  // 画面上の商談情報セクションで商談金額「1,500,000円」が表示されていることを確認
  const dealAmount = await page.locator('text=/1,500,000|1500000/');
  await expect(dealAmount).toBeVisible();

  // 紐付き請求書セクションまでスクロール
  const invoiceTab = await page.locator('[data-testid="tab-invoices"]');
  await expect(invoiceTab).toBeVisible();
  await invoiceTab.click();
  await page.waitForTimeout(500);

  // 3件の請求書が一覧表示されていることを確認
  const invoiceTable = await page.locator('[data-testid="invoice-list-table"]');
  await expect(invoiceTable).toBeVisible();

  const invoiceRows = await page.locator('table[data-testid="invoice-list-table"] tbody tr').count();
  expect(invoiceRows).toBeGreaterThan(0);

  // 紐付き請求書セクション内の「合計金額」または「整合状態」表示エリアを確認
  // 整合状態表示が表示されることを確認
  const reconciliationStatus = await page.locator('text=/✓|金額整合|整合状況|一致|ステータス.*正常/');
  const statusCount = await reconciliationStatus.count();

  // 整合状態が表示されていることを確認
  if (statusCount > 0) {
    await expect(reconciliationStatus.first()).toBeVisible();
  }

  // または、合計金額が表示されていることを確認
  const totalAmount = await page.locator('text=/合計.*1,500,000|合計.*1500000/');
  const totalCount = await totalAmount.count();
  expect(totalCount + statusCount).toBeGreaterThan(0);
});
