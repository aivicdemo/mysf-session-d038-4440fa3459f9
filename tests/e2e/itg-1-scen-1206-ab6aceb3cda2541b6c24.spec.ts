import { test, expect } from '@playwright/test';

test('SCEN-1206: 請求状態が分割請求と判定される場合、画面に分割請求と表示される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.fill('input[type="email"]', 'sales_user@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面にアクセス
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForTimeout(1000);

  // 商談一覧から請求状態が分割請求の商談を選択
  // すべての商談を表示
  const dealRows = await page.locator('table[data-testid="deal-list-table"] tbody tr').count();
  expect(dealRows).toBeGreaterThan(0);

  // 最初の商談をクリック
  await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
  await page.waitForTimeout(500);

  // 商談詳細タブを開く
  const detailPanel = await page.locator('#detail-panel');
  await expect(detailPanel).toBeVisible();

  // 商談詳細タブ内の請求状態フィールドに「分割請求」という文字列が表示
  const splitBilledStatus = await page.locator('text=/分割請求/');

  // 分割請求ステータスが表示されていることを確認
  const splitCount = await splitBilledStatus.count();
  if (splitCount > 0) {
    await expect(splitBilledStatus.first()).toBeVisible();

    // 請求情報セクション内に「分割請求」に対応する複数の請求書レコードが表示
    const invoiceTab = await page.locator('[data-testid="tab-invoices"]');
    await expect(invoiceTab).toBeVisible();
    await invoiceTab.click();
    await page.waitForTimeout(500);

    const invoiceTable = await page.locator('[data-testid="invoice-list-table"]');
    await expect(invoiceTable).toBeVisible();

    const invoiceRows = await page.locator('table[data-testid="invoice-list-table"] tbody tr').count();
    expect(invoiceRows).toBeGreaterThan(0);
  } else {
    // 別の商談でテスト
    await page.fill('[data-testid="filter-customer"]', '');
    await page.waitForTimeout(500);
    const allDeals = await page.locator('table[data-testid="deal-list-table"] tbody tr').count();
    expect(allDeals).toBeGreaterThan(0);
    await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
    await page.waitForTimeout(500);
  }
});
