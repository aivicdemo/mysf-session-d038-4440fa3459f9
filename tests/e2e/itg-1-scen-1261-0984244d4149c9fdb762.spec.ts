import { test, expect } from '@playwright/test';

test('SCEN-1261: 再発行対象の請求書の合計金額が商談の契約金額と一致しないと、「請求合計が商談金額と一致しません」エラーが表示される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面を開く
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForSelector('[data-aivic-panel]');

  // ステータス「発行済み」の請求書の行にある「再発行」ボタンをクリック
  const publishedInvoiceRow = page.locator('text=発行済み').first();
  await publishedInvoiceRow.scrollIntoViewIfNeeded();
  const parentRow = publishedInvoiceRow.locator('..');
  await parentRow.locator('button:has-text("再発行")').click();

  // 請求書再発行画面が表示される
  await page.waitForLoadState('networkidle');

  // 再発行対象の請求書の詳細情報を確認（請求合計 480,000円が表示される）
  const invoiceTotalAmount = page.locator('text=480,000');
  await expect(invoiceTotalAmount).toBeVisible();

  // 再発行確認ボタンをクリック
  await page.click('button:has-text("再発行確認"), button:has-text("確認")');

  // ボタンクリック後、エラーメッセージが表示されることを確認
  await page.waitForSelector('[data-test-id="error-area"]');

  // 画面上部のエラーエリアに「請求合計が商談金額と一致しません」というエラーメッセージが赤背景で表示
  const errorArea = page.locator('[data-test-id="error-area"]');
  await expect(errorArea).toBeVisible();

  const errorMessage = page.locator('text=請求合計が商談金額と一致しません');
  await expect(errorMessage).toBeVisible();

  // エラー背景が赤いことを確認
  const bgColor = await errorArea.evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  expect(bgColor).toContain('rgb');

  // 請求書再発行処理は実行されないことを確認
  // 画面は請求書再発行画面のままで、遷移が発生していない
  const reissueForm = page.locator('[data-test-id="reissue-form"]');
  await expect(reissueForm).toBeVisible();

  // 成功メッセージや完了ダイアログが表示されていないことを確認
  const successMessage = page.locator('text=再発行完了, text=成功');
  await expect(successMessage).not.toBeVisible();
});
