import { test, expect, Page } from '@playwright/test';

test('SCEN-1148: 商談ステータスが定義済みの値以外の場合、エラーメッセージを表示', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面に遷移
  await page.goto('/panels/scr-1791354351333.html');

  // ステータスが不正な商談を選択（最初の行をクリック）
  await page.click('#deal-tbody tr:first-child');
  await page.waitForSelector('#detail-panel');

  // 「請求書・請求明細」タブをクリック
  await page.click('#invoices-tab');

  // エラーメッセージが表示されることを確認
  await expect(page.locator('text=商談ステータスが不正です')).toBeVisible();

  // タブが選択状態になることを確認
  const invoicesTab = page.locator('#invoices-tab');
  const isActive = await invoicesTab.evaluate(el => el.classList.contains('active'));
  expect(isActive).toBe(true);

  // 請求書・請求明細データが表示されていないことを確認
  const invoiceTable = page.locator('#invoice-tbody');
  const isEmpty = await invoiceTable.evaluate(el => el.children.length === 0);
  expect(isEmpty).toBe(true);
});
