import { test, expect } from '@playwright/test';

test('SCEN-1324: 商談金額が0以下のとき、エラーメッセージが表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354351333.html');

  // ナビゲーション確認
  const navItem = page.locator('[data-aivic-nav="scr-1791354351333"]');
  await expect(navItem).toHaveClass(/aivic-active/);

  // 金額フィルターで0以下の商談を検索
  // (テストデータから金額が0以下の商談を指定)
  await page.waitForSelector('#filter-amount-max', { timeout: 5000 });
  const amountMaxInput = page.locator('#filter-amount-max');
  await amountMaxInput.fill('0');

  // 商談リストから金額が0以下の商談を選択
  await page.waitForSelector('#deal-tbody tr', { timeout: 5000 });
  const dealRow = page.locator('#deal-tbody tr').first();
  await dealRow.click();

  // 請求書タブを確認
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

  // エラーメッセージ「商談金額が不正です。確認してください」が表示される
  const errorMsg = page.locator('text=商談金額が不正です。確認してください');
  await expect(errorMsg).toBeVisible();

  // 再発行確定ボタンはクリック前の状態に戻っている
  await expect(reissueBtn).not.toBeDisabled();

  // 請求書のステータスが変更されていないことを確認
  const invoiceStatus = page.locator('text=発行済|未送付|送付済|入金済|入金待ち');
  await expect(invoiceStatus).toBeVisible();
});
