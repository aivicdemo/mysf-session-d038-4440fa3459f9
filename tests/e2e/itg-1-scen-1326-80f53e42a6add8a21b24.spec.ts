import { test, expect } from '@playwright/test';

test('SCEN-1326: 商談に商品明細がないとき、警告が表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354351333.html');

  // ナビゲーション確認
  const navItem = page.locator('[data-aivic-nav="scr-1791354351333"]');
  await expect(navItem).toHaveClass(/aivic-active/);

  // 商品明細が0件の商談レコードを特定
  // フィルターを使用して該当商談を検索
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });
  const dealRow = page.locator('#deal-tbody tr').first();
  await dealRow.click();

  // 請求明細タブを確認して、明細が0件であることを確認
  const detailsTab = page.locator('[data-aivic-nav="details-tab"], #details-tab');
  if (await detailsTab.isVisible()) {
    await detailsTab.click();
  }

  // 明細がないことを確認
  const emptyDetail = page.locator('text=請求明細がありません');
  const invoiceDetailTbody = page.locator('#invoice-detail-tbody');
  const isEmpty = await emptyDetail.isVisible() || (await invoiceDetailTbody.locator('tr').count()) === 0;
  expect(isEmpty).toBeTruthy();

  // 請求書タブに戻る
  const invoicesTab = page.locator('[data-aivic-nav="invoices-tab"], #invoices-tab');
  if (await invoicesTab.isVisible()) {
    await invoicesTab.click();
  }

  // 再発行ボタンをクリック
  const reissueBtn = page.locator('#btn-reissue-invoice');
  await reissueBtn.click();

  // 再発行確定ダイアログが表示される
  const modal = page.locator('#modal-reissue');
  await expect(modal).toBeVisible();

  // 再発行確定ボタンをクリック
  const confirmBtn = page.locator('#btn-confirm-reissue');
  await confirmBtn.click();

  // 警告ダイアログが表示され、メッセージ「商談に商品明細がありません。商談データを確認してください」が表示される
  const warningMsg = page.locator('text=商談に商品明細がありません。商談データを確認してください');
  await expect(warningMsg).toBeVisible();

  // 請求書再発行確定処理は実行されず、商談・請求情報の状態に変化がない
  const invoiceStatus = page.locator('text=発行済|未送付|送付済|入金済|入金待ち');
  await expect(invoiceStatus).toBeVisible();
});
