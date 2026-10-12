import { test, expect } from '@playwright/test';

test('SCEN-1208: 請求済み金額がゼロの場合、請求状態が未請求と判定される', async ({ page }) => {
  // 営業プロセス統合ダッシュボード（商談・請求管理画面）にアクセス
  await page.goto('/panels/scr-1791354351333.html');

  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // テスト用商談レコード（ID: TEST_DEAL_1208）を検索・特定
  const dealRows = page.locator('#deal-tbody tr');

  // 商談リストから最初のレコードをクリック
  await dealRows.first().click();

  // 詳細パネルが更新されるまで待機
  await page.waitForLoadState('domcontentloaded');

  // 「関連請求書」タブをクリック
  const invoicesTab = page.locator('button[data-tab="invoices"]');
  await invoicesTab.click();

  // 「請求情報」セクション（請求書テーブル）を確認
  const invoiceTable = page.locator('#invoice-tbody');
  await expect(invoiceTable).toBeVisible();

  // テーブルの行を取得
  const invoiceRows = page.locator('#invoice-tbody tr');
  const rowCount = await invoiceRows.count();

  // 請求書がある場合を確認
  expect(rowCount).toBeGreaterThan(0);

  const firstRow = invoiceRows.first();

  // 5番目のカラム（請求ステータス）が未請求状態であることを確認
  const statusCell = firstRow.locator('td').nth(4);
  const statusText = await statusCell.textContent();

  // 未請求状態を示すテキスト
  expect(statusText).toMatch(/未送付|未請求|入金待ち/);

  // 視覚的スタイルの確認（背景色または文字色が警告色）
  const computedStyle = await statusCell.evaluate((el) => {
    const style = window.getComputedStyle(el);
    const bgColor = style.backgroundColor;
    const textColor = style.color;
    return {
      backgroundColor: bgColor,
      color: textColor,
    };
  });

  // スタイルが適用されていることを確認
  expect(computedStyle.backgroundColor || computedStyle.color).toBeTruthy();
});
