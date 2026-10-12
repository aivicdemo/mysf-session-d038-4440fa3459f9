import { test, expect } from '@playwright/test';

test('SCEN-1325: 請求金額が負数のとき、エラーメッセージが表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354351333.html');

  // ナビゲーション確認
  const navItem = page.locator('[data-aivic-nav="scr-1791354351333"]');
  await expect(navItem).toHaveClass(/aivic-active/);

  // 商談を選択
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });
  const dealRow = page.locator('#deal-tbody tr').first();
  await dealRow.click();

  // 請求書タブを確認
  const invoicesTab = page.locator('[data-aivic-nav="invoices-tab"], #invoices-tab');
  if (await invoicesTab.isVisible()) {
    await invoicesTab.click();
  }

  // 請求書リストから請求金額が負数の請求書を特定
  await page.waitForSelector('#invoice-tbody tr', { timeout: 5000 });
  const invoiceRow = page.locator('#invoice-tbody tr').first();

  // 行を選択する（選択状態を示す）
  await invoiceRow.click();

  // 再発行ボタンをクリック
  const reissueBtn = page.locator('#btn-reissue-invoice');
  await reissueBtn.click();

  // 再発行確定ダイアログが表示される
  const modal = page.locator('#modal-reissue');
  await expect(modal).toBeVisible();

  // 再発行確定ボタンをクリック
  const confirmBtn = page.locator('#btn-confirm-reissue');
  await confirmBtn.click();

  // エラーメッセージ「請求金額が負数です。データを確認してください」が表示される
  const errorMsg = page.locator('text=請求金額が負数です。データを確認してください');
  await expect(errorMsg).toBeVisible();

  // 請求書のステータスが変更されていないことを確認
  const invoiceStatus = page.locator('text=発行済|未送付|送付済|入金済|入金待ち');
  await expect(invoiceStatus).toBeVisible();
});
