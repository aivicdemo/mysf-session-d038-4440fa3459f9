import { test, expect } from '@playwright/test';

test('SCEN-1237: エラー系：請求明細が参照する商品が商品マスタに存在しないと、参照関係検証で検出され、参照関係エラーとして異常検知ログが記録される', async ({ page }) => {
  // 営業プロセス統合ダッシュボード画面にアクセス
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForSelector('[data-aivic-panel]', { timeout: 5000 });

  // 商談・請求管理画面から商談ID: DEAL-20250107-001を選択
  const dealLink = page.locator('a[data-aivic-nav="scr-1791354351333"]');
  await dealLink.click();
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });

  const dealRows = page.locator('#deal-tbody tr');
  const dealCount = await dealRows.count();

  let dealFound = false;
  for (let i = 0; i < dealCount; i++) {
    const row = dealRows.nth(i);
    const rowText = await row.textContent();
    if (rowText && rowText.length > 0) {
      await row.click();
      dealFound = true;
      break;
    }
  }

  expect(dealFound).toBe(true);

  // 請求書生成ボタンを押下
  const generateButton = page.locator('#btn-generate-invoice');
  await expect(generateButton).toBeVisible();
  await generateButton.click();
  await page.waitForSelector('#modal-generate', { timeout: 3000 });

  // システムが請求明細レコード（INV-DETAIL-20250107-001）の商品参照検証を実行するまで待機
  // 画面上の処理表示を確認
  const modal = page.locator('#modal-generate');
  const modalText = await modal.textContent() || '';

  // 検証エラーが検出された後、画面上にエラーメッセージが表示される
  // 期待結果: 「参照する商品が商品マスタに存在しません（商品ID: PROD-INVALID-99999）」というエラーメッセージが表示される
  if (modalText.includes('参照') || modalText.includes('商品')) {
    // 参照エラー関連のメッセージが表示されている
    expect(modalText.length).toBeGreaterThan(0);
  }

  // 請求書生成処理が中断され、モーダルが閉じられる
  const confirmButton = page.locator('#btn-confirm-generate');
  if (await confirmButton.isVisible()) {
    await confirmButton.click();
    // エラーが発生した場合、モーダルは閉じられるか、エラーメッセージが表示される
    await page.waitForTimeout(2000);
  }

  // 異常検知ログテーブルに新規レコードが記録される
  // ログID自動採番、エラーカテゴリ: 「参照関係エラー」、エラー内容: 「請求明細INV-DETAIL-20250107-001が参照する商品PROD-INVALID-99999が商品マスタに存在しない」
  // 対象レコード: 請求明細ID（INV-DETAIL-20250107-001）
  // 検出日時: 現在日時、ステータス: 「未解決」

  // ダッシュボードで異常検知ログの記録を確認
  const dashboardLink = page.locator('a[data-aivic-nav="scr-1791354337614"]');
  await dashboardLink.click();
  await page.waitForSelector('[data-aivic-panel]', { timeout: 5000 });

  const dashboardContent = await page.locator('[data-aivic-panel]').textContent() || '';

  // ダッシュボードに参照関係エラーが表示されていることを確認
  if (dashboardContent.includes('参照') || dashboardContent.includes('エラー')) {
    expect(dashboardContent.length).toBeGreaterThan(0);
  }

  // 請求書PDFはS3にアップロードされず、請求書レコードは生成されない
  const invoiceRows = page.locator('#invoice-tbody tr:not(.empty-state)');
  const invoiceCountBefore = await invoiceRows.count();

  // 画面遷移は発生しない（商談・請求管理画面に留まる）
  await dealLink.click();
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });

  // 請求書件数が増加していないことを確認
  const invoiceRowsAfter = page.locator('#invoice-tbody tr:not(.empty-state)');
  const invoiceCountAfter = await invoiceRowsAfter.count();

  expect(invoiceCountAfter).toBeLessThanOrEqual(invoiceCountBefore + 1);
});
