import { test, expect } from '@playwright/test';

test('SCEN-1258: 再発行対象の商談に紐付く請求書がないと、「この商談に紐付く請求書が見つかりません」エラーが表示される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面を開く
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForSelector('[data-aivic-panel]');

  // 商談一覧から「DEAL-TEST-001」の行を選択
  const dealRow = page.locator('text=DEAL-TEST-001').first();
  await dealRow.scrollIntoViewIfNeeded();
  await dealRow.click();

  // 「請求書再発行」ボタンをクリック
  await page.click('button:has-text("請求書再発行")');

  // 請求書再発行画面への遷移が実行される
  await page.waitForLoadState('networkidle');

  // 画面上部に赤色の警告バナーが表示されることを確認
  const warningBanner = page.locator('[data-test-id="warning-banner"]');
  await expect(warningBanner).toBeVisible();

  // テキスト「この商談に紐付く請求書が見つかりません」が表示される
  const warningText = page.locator('text=この商談に紐付く請求書が見つかりません');
  await expect(warningText).toBeVisible();

  // 「再発行」ボタンが無効化（disabled状態）されていることを確認
  const reissueButton = page.locator('button:has-text("再発行")');
  await expect(reissueButton).toBeDisabled();

  // ユーザーが再発行操作を実行できないことを確認
  await expect(reissueButton).toHaveAttribute('disabled');
});
