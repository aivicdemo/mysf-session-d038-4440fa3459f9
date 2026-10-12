import { test, expect } from '@playwright/test';

test('SCEN-1262: 請求書レコードの取得に失敗すると、「請求書データの取得に失敗しました。システム管理者に連絡してください」エラーが表示される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面から、既存の請求書レコード1件を選択
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForSelector('[data-aivic-panel]');

  // 請求書を選択
  const invoiceRow = page.locator('[data-test-id="invoice-row"]').first();
  await invoiceRow.scrollIntoViewIfNeeded();
  await invoiceRow.click();

  // 該当請求書の再発行ボタンまたはメニューから再発行操作を実行
  await page.click('button:has-text("再発行")');

  // ネットワークエラーをシミュレート（Playwright のインターセプターで失敗を注入）
  await page.route('**/api/invoices/**', route => {
    route.abort('failed');
  });

  // 再び再発行ボタンをクリックして失敗を起動
  await page.click('button:has-text("再発行実行")');

  // 画面が読み込まれるまで待機
  await page.waitForLoadState('networkidle').catch(() => {});

  // エラーメッセージが表示されることを確認
  const errorMessage = page.locator('text=請求書データの取得に失敗しました。システム管理者に連絡してください');
  await expect(errorMessage).toBeVisible();

  // エラー表示の下に戻るボタンが配置される
  const backButton = page.locator('button:has-text("戻る")');
  await expect(backButton).toBeVisible();

  // ユーザーが「戻る」ボタンをクリックして商談・請求管理画面に戻ることができる
  await backButton.click();
  await page.waitForNavigation();

  // 商談・請求管理画面に戻っていることを確認
  const invoiceTable = page.locator('[data-test-id="invoice-table"]');
  await expect(invoiceTable).toBeVisible();
});
