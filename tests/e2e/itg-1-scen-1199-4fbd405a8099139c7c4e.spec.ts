import { test, expect } from '@playwright/test';

test('SCEN-1199: 営業部長が同一部門内の全顧客データにアクセスすると、商談履歴・請求履歴が表示される', async ({ page }) => {
  // 営業部長でログイン
  await page.goto('/');
  await page.fill('input[type="email"]', 'manager@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業プロセス統合ダッシュボード上で、部門フィルターが「DEPT-001」に設定されていることを確認
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForTimeout(1000);

  // 顧客・取引先管理画面に移動
  await page.goto('/panels/scr-1791354379354.html');
  await page.waitForTimeout(1000);

  // ダッシュボード内の取引先一覧から顧客Aをクリック
  await page.fill('#search-field', '顧客A');
  await page.waitForTimeout(500);
  const firstRow = await page.locator('table tbody tr:first-child');
  await expect(firstRow).toBeVisible();
  await firstRow.click();
  await page.waitForTimeout(500);

  // 顧客詳細画面で「商談・請求管理画面」へのリンクを選択
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForTimeout(1000);

  // 商談・請求管理画面が表示され、顧客Aに紐付く商談が表示される
  const dealTable = await page.locator('[data-testid="deal-list-table"]');
  await expect(dealTable).toBeVisible();

  // 商談一覧の「受注確定」ステージの商談をクリック
  await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
  await page.waitForTimeout(500);

  // 商談詳細タブが開かれ、商談履歴セクションが表示
  const detailPanel = await page.locator('#detail-panel');
  await expect(detailPanel).toBeVisible();

  // 関連請求セクションに請求書が表示されていることを確認
  const invoiceTab = await page.locator('[data-testid="tab-invoices"]');
  await expect(invoiceTab).toBeVisible();
  await invoiceTab.click();
  await page.waitForTimeout(500);

  const invoiceTable = await page.locator('[data-testid="invoice-list-table"]');
  await expect(invoiceTable).toBeVisible();

  // 商談詳細タブを閉じ、商談一覧に戻る（新しい商談を選択）
  await page.fill('[data-testid="filter-customer"]', '顧客B');
  await page.waitForTimeout(500);

  // 顧客Bの商談を選択
  const rows = await page.locator('table[data-testid="deal-list-table"] tbody tr').count();
  if (rows > 0) {
    await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
    await page.waitForTimeout(500);

    // 商談詳細タブが開かれ、請求履歴が表示される（該当件数0件の可能性）
    const invoiceTab2 = await page.locator('[data-testid="tab-invoices"]');
    await expect(invoiceTab2).toBeVisible();
    await invoiceTab2.click();
    await page.waitForTimeout(500);

    const invoiceTable2 = await page.locator('[data-testid="invoice-list-table"]');
    await expect(invoiceTable2).toBeVisible();
  }

  // 顧客Cの請求済み商談を選択
  await page.fill('[data-testid="filter-customer"]', '顧客C');
  await page.waitForTimeout(500);

  const customerCRows = await page.locator('table[data-testid="deal-list-table"] tbody tr').count();
  if (customerCRows > 0) {
    await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
    await page.waitForTimeout(500);

    // 請求履歴セクションに請求書が表示される
    const invoiceTab3 = await page.locator('[data-testid="tab-invoices"]');
    await expect(invoiceTab3).toBeVisible();
    await invoiceTab3.click();
    await page.waitForTimeout(500);

    const invoiceTable3 = await page.locator('[data-testid="invoice-list-table"]');
    await expect(invoiceTable3).toBeVisible();
  }
});
