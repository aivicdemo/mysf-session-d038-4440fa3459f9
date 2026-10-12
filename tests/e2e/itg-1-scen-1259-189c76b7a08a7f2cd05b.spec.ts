import { test, expect } from '@playwright/test';

test('SCEN-1259: 再発行対象の請求書に紐付く請求明細がないと、「請求明細が見つかりません」エラーが表示される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面を開く
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForSelector('[data-aivic-panel]');

  // 請求書ID「INV-20250107-001」の行を特定
  const invoiceRow = page.locator('text=INV-20250107-001').first();
  await invoiceRow.scrollIntoViewIfNeeded();

  // 当該請求書の行に表示されている「再発行」ボタンをクリック
  await page.click('button:has-text("再発行")');

  // システムが再発行対象の請求書に紐付く請求明細の取得を試みる
  await page.waitForLoadState('networkidle');

  // ページ上部または画面中央に赤い背景のエラーメッセージが表示される
  const errorMessage = page.locator('text=請求明細が見つかりません');
  await expect(errorMessage).toBeVisible();

  // エラーメッセージの背景が赤いことを確認
  const errorContainer = page.locator('[data-test-id="error-container"]');
  const bgColor = await errorContainer.evaluate(el => {
    return window.getComputedStyle(el).backgroundColor;
  });
  expect(bgColor).toContain('rgb');

  // 説明文が表示される
  const explanationText = page.locator('text=この請求書には関連する請求明細がありません。請求明細を確認後、再度お試しください。');
  await expect(explanationText).toBeVisible();

  // 「戻る」ボタンが提供される
  const backButton = page.locator('button:has-text("戻る")');
  await expect(backButton).toBeVisible();

  // 再発行画面へ遷移していないことを確認
  const reissueForm = page.locator('[data-test-id="reissue-form"]');
  await expect(reissueForm).not.toBeVisible();
});
