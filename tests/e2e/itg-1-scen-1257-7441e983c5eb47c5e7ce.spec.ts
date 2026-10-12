import { test, expect } from '@playwright/test';

test('SCEN-1257: 再発行対象の商談IDが空または不正な形式だと、「商談IDが無効です。画面を再読み込みしてください」エラーが表示される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // パターン1: パラメータ自体を省略
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForLoadState('networkidle');

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=商談IDが無効です。画面を再読み込みしてください');
  await expect(errorMessage).toBeVisible();

  // 再発行フォームが表示されていないことを確認
  const reissueForm = page.locator('[data-test-id="reissue-form"]');
  await expect(reissueForm).not.toBeVisible();

  // 再読み込みボタンが提供されていることを確認
  const reloadButton = page.locator('button:has-text("再読み込み")');
  await expect(reloadButton).toBeVisible();

  // パターン2: パラメータ値を空文字列
  await page.goto('/panels/scr-1791354351333.html?dealId=');
  await page.waitForLoadState('networkidle');

  const errorMessage2 = page.locator('text=商談IDが無効です。画面を再読み込みしてください');
  await expect(errorMessage2).toBeVisible();

  // パターン3: パラメータ値を不正な形式
  await page.goto('/panels/scr-1791354351333.html?dealId=DEAL-@%23$');
  await page.waitForLoadState('networkidle');

  const errorMessage3 = page.locator('text=商談IDが無効です。画面を再読み込みしてください');
  await expect(errorMessage3).toBeVisible();

  // パターン4: 存在しない商談ID
  await page.goto('/panels/scr-1791354351333.html?dealId=999999999');
  await page.waitForLoadState('networkidle');

  const errorMessage4 = page.locator('text=商談IDが無効です。画面を再読み込みしてください');
  await expect(errorMessage4).toBeVisible();
});
