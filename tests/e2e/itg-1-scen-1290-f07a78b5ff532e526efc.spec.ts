import { test, expect } from '@playwright/test';

test('SCEN-1290: 請求明細が見つからない参照関係の破損を検出', async ({ page }) => {
  // Setup: 商談・請求管理画面に移動
  await page.goto('/panels/scr-1791354351333.html');

  // 商談DEAL-9999を検索・選択
  // 画面の検索フィルターで商談IDを入力
  await page.waitForSelector('[id="deal-tbody"]', { timeout: 5000 });

  // 商談リストから DEAL-9999 を選択
  const dealRow = page.locator('[id="deal-tbody"] tr').filter({ hasText: 'DEAL-9999' }).first();
  await dealRow.click({ timeout: 5000 });

  // 右側に詳細パネルが表示されることを確認
  await page.waitForSelector('[id="detail-panel"]', { timeout: 5000 });

  // 関連請求書タブを確認し、INV-5555を選択
  const invoicesTab = page.locator('[id="invoices-tab"]');
  await invoicesTab.click();

  await page.waitForSelector('[id="invoice-tbody"]', { timeout: 5000 });

  const invoiceRow = page.locator('[id="invoice-tbody"] tr').filter({ hasText: 'INV-5555' }).first();
  await invoiceRow.click({ timeout: 5000 });

  // 請求書詳細パネルの確定ボタンをクリック
  // 確定ボタンを探して実行（詳細パネル内のボタン）
  const confirmButton = page.locator('[id="detail-panel"] button').filter({ hasText: '確定' }).first();

  // 確定ボタンが見つかるまで待機
  await expect(confirmButton).toBeVisible({ timeout: 5000 });

  // ボタンをクリックしてエラーが表示されるのを待つ
  await confirmButton.click();

  // エラーメッセージが赤背景で表示されることを確認
  // 期待されるエラーメッセージテキスト
  const expectedErrorMsg = '請求書に紐付く請求明細データが見つかりません。データの整合性に問題があります。管理者に連絡してください。';

  // エラーメッセージの表示を確認
  const errorMessage = page.locator('div').filter({ hasText: expectedErrorMsg }).first();
  await expect(errorMessage).toBeVisible({ timeout: 5000 });

  // エラーメッセージが赤背景であることを確認（スタイル確認）
  const errorBgColor = await errorMessage.evaluate((el) => {
    const style = window.getComputedStyle(el);
    return style.backgroundColor;
  });

  // 赤色系の背景であることを確認（RGB値で赤成分が高い）
  expect(errorBgColor).toMatch(/rgb\(\s*\d+,\s*[0-9]{1,2},\s*[0-9]{1,2}\s*\)|rgba\(\s*\d+,\s*[0-9]{1,2},\s*[0-9]{1,2}/);

  // 請求書ステータスが「確定待ち」のままであることを確認
  // 詳細パネル内のステータスフィールドを確認
  const statusField = page.locator('[id="detail-panel"]').locator('text="確定待ち"').first();
  await expect(statusField).toBeVisible({ timeout: 5000 });

  // ページ内にある請求書ステータスが更新されていないことを確認
  const invoiceStatus = page.locator('[id="invoice-tbody"] tr').filter({ hasText: 'INV-5555' }).locator('td').filter({ hasText: '確定待ち' }).first();
  await expect(invoiceStatus).toBeVisible({ timeout: 5000 });
});
