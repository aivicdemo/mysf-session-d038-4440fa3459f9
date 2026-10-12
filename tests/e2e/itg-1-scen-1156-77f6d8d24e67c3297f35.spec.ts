import { test, expect, Page } from '@playwright/test';

test('SCEN-1156: 営業担当者IDが空または無効な場合、エラーメッセージを表示', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面内で「請求書・請求明細」タブをクリック
  await page.goto('/panels/scr-1791354351333.html');

  // 営業担当者IDが空の場合をシミュレート（ページのコンテキストで営業担当者IDをクリア）
  await page.evaluate(() => {
    window.localStorage.removeItem('salesPersonId');
    window.sessionStorage.removeItem('salesPersonId');
  });

  // タブクリック時に営業担当者IDをシステムに送信して検証処理が実行される
  await page.click('#invoices-tab');

  // エラーメッセージが表示されるまで待機
  await page.waitForTimeout(500);

  // 画面にエラーメッセージが表示されていることを確認
  const errorMessage = page.locator('text=営業担当者IDが指定されていません');
  await expect(errorMessage).toBeVisible();

  // 別のエラーメッセージ（同等の無効ID通知メッセージ）がないか確認
  const altErrorMessage = page.locator('text=管理者に連絡してください');
  const isAltVisible = await altErrorMessage.isVisible().catch(() => false);

  expect(errorMessage.isVisible() || isAltVisible).toBe(true);

  // 請求書・請求明細タブのコンテンツ領域が空のままであることを確認
  const invoiceTable = page.locator('#invoice-tbody');
  const isEmpty = await invoiceTable.evaluate(el => {
    const htmlEl = el as HTMLElement;
    return el.children.length === 0 || !htmlEl.offsetParent;
  }).catch(() => true);
  expect(isEmpty).toBe(true);

  // タブが切り替わらず、前の画面状態が保持されていることを確認
  const isTabActive = await page.locator('#invoices-tab').evaluate(el => el.classList.contains('active')).catch(() => false);
  expect(isTabActive).toBe(false);
});
