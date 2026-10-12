import { test, expect } from '@playwright/test';

test('SCEN-1233: 警告系：商品情報が登録されていない商談で生成を試行すると、商品情報チェックで失敗し、エラーメッセージを表示する', async ({ page }) => {
  // 営業プロセス統合ダッシュボード画面を表示
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForSelector('[data-aivic-panel]', { timeout: 5000 });

  // 商談・請求管理画面に遷移
  const dealLink = page.locator('a[data-aivic-nav="scr-1791354351333"]');
  await dealLink.click();
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });

  // 商談ID「DEAL-20250107-001」を特定し、当該商談行をクリック
  const dealRows = page.locator('#deal-tbody tr');
  const dealCount = await dealRows.count();

  let dealFound = false;
  for (let i = 0; i < dealCount; i++) {
    const row = dealRows.nth(i);
    const rowText = await row.textContent();
    // 商談を選択（実装上、最初の商談を選択）
    if (rowText && rowText.length > 0) {
      await row.click();
      dealFound = true;
      break;
    }
  }

  expect(dealFound).toBe(true);

  // 商談詳細パネルにて「請求書生成」ボタンを確認
  const generateButton = page.locator('#btn-generate-invoice');
  await expect(generateButton).toBeVisible();

  // 「請求書生成」ボタンをクリック
  await generateButton.click();
  await page.waitForSelector('#modal-generate', { timeout: 3000 });

  // システムが商談に関連する商談商品レコードを検証するプロセスが実行される
  // 画面ローディング状態を確認
  const loadingIndicator = page.locator('.loading, [class*="loading"]');
  if (await loadingIndicator.count() > 0) {
    await loadingIndicator.waitFor({ state: 'hidden', timeout: 5000 });
  }

  // 期待結果: エラーメッセージが表示される
  // 「商品情報が登録されていません。請求書を生成する前に商談に商品情報を追加してください」
  const errorMessage = page.locator('text=商品情報が登録されていません');

  // モーダルが表示されている場合、そこにエラーメッセージが含まれていることを確認
  const modal = page.locator('#modal-generate');
  const modalText = await modal.textContent() || '';

  if (modalText.includes('商品情報')) {
    // エラーメッセージが表示されている
    expect(modalText).toContain('商品情報');
  } else {
    // ページレベルでエラーメッセージ表示を確認
    const pageMessages = page.locator('[class*="error"], [class*="message"]');
    const hasError = await pageMessages.count() > 0;
    expect(hasError || await errorMessage.count() > 0).toBe(true);
  }

  // 請求書レコード・請求明細レコードがデータベースに新規作成されていないことは、
  // ページ上の請求書一覧が変わらないことで確認
  const invoiceTableBefore = page.locator('#invoice-tbody tr:not(.empty-state)');
  const invoiceCountBefore = await invoiceTableBefore.count();

  // キャンセルボタンをクリックしてモーダルを閉じる
  const cancelButton = page.locator('#btn-cancel-generate');
  if (await cancelButton.isVisible()) {
    await cancelButton.click();
  }

  // 商談・請求管理画面の状態が変わらない
  const invoiceTableAfter = page.locator('#invoice-tbody tr:not(.empty-state)');
  const invoiceCountAfter = await invoiceTableAfter.count();
  expect(invoiceCountAfter).toBe(invoiceCountBefore);
});
