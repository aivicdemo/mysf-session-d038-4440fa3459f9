import { test, expect, Page } from '@playwright/test';

test('SCEN-1147: 商談IDが指定されていない場合、エラーメッセージを表示', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面に遷移
  await page.goto('/panels/scr-1791354351333.html');

  // 商談を選択しない状態で「請求書・請求明細」タブをクリック
  await page.click('#invoices-tab');

  // エラーメッセージが表示されることを確認
  await expect(page.locator('text=商談IDが指定されていません')).toBeVisible();

  // タブが遷移していないことを確認（前のタブが選択されたままの状態）
  const invoicesTab = page.locator('#invoices-tab');
  const isActive = await invoicesTab.evaluate(el => el.classList.contains('active'));
  expect(isActive).toBe(false);
});
