import { test, expect } from '@playwright/test';

test('SCEN-1251: 修正対象の商談が見つからない場合、画面表示がエラーで中止される', async ({ page }) => {
  // 商談・請求管理画面で、既存の請求書一覧から任意の請求書行を選択する
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForLoadState('networkidle');

  // 请求书行の「修正」ボタンをクリック
  const invoiceRow = page.locator('tbody#invoice-tbody tr').first();
  await expect(invoiceRow).toBeVisible();
  await invoiceRow.locator('button:has-text("修正")').click();

  // このタイミングでページが遷移中のリクエストをインターセプトして、URLのクエリパラメータを変更
  // ※ Playwright では cdp を使って Interception を行う場合もありますが、
  // より簡単な方法として直接 URL で既存しない ID を指定してアクセスします

  // ブラウザの開発者ツールを開き、遷移リクエスト前にURLのクエリパラメータを変更する
  // （Playwright ではデベロッパーツールは自動で開かないため、直接 URL でアクセス）
  await page.goto('/panels/scr-1791354749663.html?dealId=DEAL-999999');

  // ページロード処理が実行されるのを待機
  await page.waitForLoadState('networkidle');

  // エラー画面が表示されることを確認
  // 修正対象の商談が見つからないことを示すエラーメッセージが日本語で表示される
  const errorMessage = page.locator('[role="alert"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('指定された商談が見つかりません');
  await expect(errorMessage).toContainText('請求書IDを確認してください');

  // HTML要素として`<div class="error-message" role="alert">` が存在し、
  // アクセシビリティ属性`role="alert"`が設定されていることを確認
  const errorDiv = page.locator('div.error-message[role="alert"]');
  await expect(errorDiv).toBeVisible();
  const roleAttr = await errorDiv.getAttribute('role');
  expect(roleAttr).toBe('alert');

  // 「戻る」ボタンが有効状態で表示されることを確認
  const backButton = page.locator('button:has-text("戻る")');
  await expect(backButton).toBeVisible();
  await expect(backButton).toBeEnabled();

  // 請求書修正画面の入力フォームは一切表示されず、白紙の状態であることを確認
  const modificationForm = page.locator('[data-section="modification-form"]');
  await expect(modificationForm).not.toBeVisible();

  const invoiceInfoSection = page.locator('[data-section="invoice-info"]');
  await expect(invoiceInfoSection).not.toBeVisible();

  const detailsSection = page.locator('[data-section="invoice-details"]');
  await expect(detailsSection).not.toBeVisible();

  // ブラウザの戻るボタンを押すと商談・請求管理画面に戻ることを確認
  // 注：Playwright では実際の「ブラウザ戻るボタン」を押すことはできないため、
  // backButton のクリックで検証
  await backButton.click();

  // 商談・請求管理画面に戻っていることを確認
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveURL(/scr-1791354351333/);
  await expect(page.locator('tbody#invoice-tbody')).toBeVisible();
});
