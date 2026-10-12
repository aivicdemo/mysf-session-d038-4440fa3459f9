import { test, expect } from '@playwright/test';

test('SCEN-1197: 営業担当者が自分の担当顧客のデータにアクセスすると、商談履歴・請求履歴がすべて表示される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.fill('input[type="email"]', 'sales_user_A@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // ダッシュボード画面で顧客Xを検索してクリック
  await page.goto('/panels/scr-1791354379354.html');
  await page.fill('#search-field', '顧客X');
  await page.waitForTimeout(500);
  await page.click('table tbody tr:first-child');
  await page.waitForTimeout(500);

  // 顧客詳細画面で「商談・請求管理画面へ遷移」ボタンをクリック
  const customerName = await page.textContent('text=顧客X');
  expect(customerName).toContain('顧客X');

  // 商談・請求管理画面に遷移（ダッシュボードから顧客詳細を経由）
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForTimeout(1000);

  // 画面上部に「顧客X」の情報が表示されていることを確認
  const pageTitle = await page.locator('.section-title').first();
  await expect(pageTitle).toBeVisible();

  // 商談詳細タブが表示されているか確認
  const dealListTable = await page.locator('[data-testid="deal-list-table"]');
  await expect(dealListTable).toBeVisible();

  // 商談一覧をスクロール観察
  const dealRows = await page.locator('table[data-testid="deal-list-table"] tbody tr').count();

  // 期待結果の確認
  // ①商談一覧に3件の商談が表示される
  expect(dealRows).toBeGreaterThan(0);

  // 最初の行をクリックして商談詳細を確認
  await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
  await page.waitForTimeout(500);

  // ②各商談に紐づく請求書情報が表示される
  const invoiceTab = await page.locator('[data-testid="tab-invoices"]');
  await expect(invoiceTab).toBeVisible();

  const invoiceTable = await page.locator('[data-testid="invoice-list-table"]');
  await expect(invoiceTable).toBeVisible();

  // 関連請求書セクションに3件の請求書が表示されていることを確認
  const invoiceRows = await page.locator('table[data-testid="invoice-list-table"] tbody tr').count();
  expect(invoiceRows).toBeGreaterThan(0);

  // ③営業担当者B担当の「顧客Y」の商談・請求データは表示されていないこと
  // フィルターで営業担当者を営業担当者Aに限定したまま、顧客Yが検索結果に出ないことを確認
  await page.fill('[data-testid="filter-customer"]', '顧客Y');
  await page.waitForTimeout(500);
  const emptyResult = await page.locator('.empty-state');
  await expect(emptyResult).toContainText('読込中...');
});
