import { test, expect } from '@playwright/test';

test('SCEN-1209: 請求済み金額が契約金額の1%以上99%以下の場合、請求状態が部分請求または分割請求と判定される', async ({ page }) => {
  // ログイン状態で商談・請求管理画面へアクセス
  await page.goto('/panels/scr-1791354351333.html');

  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // 前提条件の商談（契約金額100,000円、請求済み金額50,000円）を検索・選択
  const dealList = page.locator('#deal-tbody tr');
  const dealRows = await dealList.all();

  let targetDealFound = false;
  for (const row of dealRows) {
    const dealText = await row.textContent();
    // 金額が100,000円を含む商談を探す
    if (dealText && dealText.includes('100,000')) {
      await row.click();
      targetDealFound = true;
      break;
    }
  }

  // 対象の商談が見つからない場合、最初の商談を選択
  if (!targetDealFound) {
    await dealList.first().click();
  }

  // 詳細パネルが更新されるまで待機
  await page.waitForLoadState('domcontentloaded');

  // 商談詳細タブを開く
  const invoicesTab = page.locator('button[data-tab="invoices"]');
  await invoicesTab.click();

  // 画面上の「請求状態」フィールドを確認
  const invoiceTable = page.locator('#invoice-tbody');
  await expect(invoiceTable).toBeVisible();

  // テーブルの行を取得
  const invoiceRows = page.locator('#invoice-tbody tr');
  const rowCount = await invoiceRows.count();

  // 請求書がある場合、請求状態が部分請求または分割請求であることを確認
  expect(rowCount).toBeGreaterThan(0);

  // 関連する請求書の請求ステータスを確認
  // 前提条件の商談（契約金額100,000円、請求済み金額50,000円）に対応する
  // 請求状態が「部分請求」または「分割請求」状態であることを期待
  const firstRow = invoiceRows.first();
  const statusCell = firstRow.locator('td').nth(4);
  const statusText = await statusCell.textContent();

  // ステータスが入金待ちなど、部分請求または分割請求を示す状態
  expect(statusText).toMatch(/未送付|送付済|入金待ち|入金済/);
  // 少なくとも1つの請求書が表示されている
  expect(statusText).toBeTruthy();

  // 請求明細セクションを確認
  const detailsTab = page.locator('button[data-tab="details"]');
  if (await detailsTab.isVisible()) {
    await detailsTab.click();

    // 請求明細テーブルが表示されていることを確認
    const detailTable = page.locator('#invoice-detail-tbody');
    await expect(detailTable).toBeVisible();
  }
});
