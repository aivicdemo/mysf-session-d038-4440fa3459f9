import { test, expect } from '@playwright/test';

test('SCEN-1327: 請求書に明細がないとき、警告が表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354351333.html');

  // ナビゲーション確認
  const navItem = page.locator('[data-aivic-nav="scr-1791354351333"]');
  await expect(navItem).toHaveClass(/aivic-active/);

  // 営業担当者が商談・請求管理画面にアクセス
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });

  // 明細が登録されていない請求書を選択
  const dealRow = page.locator('#deal-tbody tr').first();
  await dealRow.click();

  // 請求書タブを確認
  const invoicesTab = page.locator('[data-aivic-nav="invoices-tab"], #invoices-tab');
  if (await invoicesTab.isVisible()) {
    await invoicesTab.click();
  }

  // 請求書を選択
  await page.waitForSelector('#invoice-tbody tr', { timeout: 5000 });
  const invoiceRow = page.locator('#invoice-tbody tr').first();
  await invoiceRow.click();

  // 請求明細を確認して、明細が0件であることを確認
  const detailsTab = page.locator('[data-aivic-nav="details-tab"], #details-tab');
  if (await detailsTab.isVisible()) {
    await detailsTab.click();
  }

  const emptyDetail = page.locator('text=請求明細がありません');
  const invoiceDetailTbody = page.locator('#invoice-detail-tbody');
  const isEmpty = await emptyDetail.isVisible() || (await invoiceDetailTbody.locator('tr').count()) === 0;
  expect(isEmpty).toBeTruthy();

  // 請求書タブに戻る
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

  // 商談・請求管理画面上に警告メッセージ「請求書に明細がありません。請求書データを確認してください」が表示される
  const warningMsg = page.locator('text=請求書に明細がありません。請求書データを確認してください');
  await expect(warningMsg).toBeVisible();

  // 再発行処理は実行されず、請求書のステータスは「発行済み」のままで変化しない
  const invoiceStatus = page.locator('text=発行済');
  await expect(invoiceStatus).toBeVisible();
});
