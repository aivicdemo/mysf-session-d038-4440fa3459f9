import { test, expect } from '@playwright/test';

test('SCEN-1323: 参照先の商品マスタが見つからないとき、警告が表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354351333.html');

  // ナビゲーションの確認
  const navItem = page.locator('[data-aivic-nav="scr-1791354351333"]');
  await expect(navItem).toHaveClass(/aivic-active/);

  // 削除済み商品に紐づく請求書を特定するため、フィルターを使用して請求書を検索
  // テストデータから削除済み商品に紐づく請求書が表示されることを想定
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });

  // 商談を選択
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

  // 警告ダイアログまたはメッセージが表示される
  const warning = page.locator('text=参照先の商品マスタが見つかりません。商品マスタを確認してください');
  await expect(warning).toBeVisible();

  // 請求書のステータスが「再発行確定」状態に遷移していないことを確認
  // (警告が表示されたため処理は中止)
  const invoiceStatus = page.locator('text=発行済|未送付|送付済');
  await expect(invoiceStatus).toBeVisible();
});
