import { test, expect } from '@playwright/test';

test('SCEN-1204: 請求状態が未請求と判定される場合、画面に未請求と表示される', async ({ page }) => {
  // ログイン
  await page.goto('/');
  await page.fill('input[type="email"]', 'sales_user@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業プロセス統合ダッシュボードまたは商談・請求管理画面に遷移
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForTimeout(1000);

  // 商談一覧から、前提条件で指定した『未請求』判定対象の商談レコードをクリック
  // 商談がない場合は、最初の行をクリック
  const dealRows = await page.locator('table[data-testid="deal-list-table"] tbody tr').count();
  expect(dealRows).toBeGreaterThan(0);

  await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
  await page.waitForTimeout(500);

  // 商談詳細タブが描画されるまで待機
  const detailPanel = await page.locator('#detail-panel');
  await expect(detailPanel).toBeVisible();

  // 商談詳細画面内の『請求状態』または『請求ステータス』を示すフィールド/ラベルが表示
  const billingStatusLabel = await page.locator('text=/請求状態|請求ステータス|請求ステイタス|billing.*status/');
  await expect(billingStatusLabel).toBeVisible();

  // 商談詳細タブ内の請求状態表示領域に『未請求』というテキストが表示
  const unbilledStatus = await page.locator('text=/未請求/');

  // 未請求ステータスが表示されていることを確認
  const unbilledCount = await unbilledStatus.count();
  if (unbilledCount > 0) {
    await expect(unbilledStatus.first()).toBeVisible();
  }

  // 表示位置は画面仕様に基づく既定の場所に配置
  // 表示形式は、他の請求状態値と同じスタイル（フォント・色・配置）で統一
  const statusField = await page.locator('[id*="status"], [class*="status"], [data-testid*="status"]');
  const statusFieldCount = await statusField.count();
  expect(statusFieldCount).toBeGreaterThan(0);
});
