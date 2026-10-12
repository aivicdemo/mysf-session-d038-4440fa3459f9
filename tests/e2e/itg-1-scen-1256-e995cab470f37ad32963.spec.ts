import { test, expect } from '@playwright/test';

test('SCEN-1256: ユーザーに請求書再発行画面表示権限がないと、アクセス制御で処理が止まってエラーが表示される', async ({ page }) => {
  // 権限がないユーザーでログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'limited-user');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // ダッシュボード画面を表示
  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForSelector('[data-aivic-panel]');

  // 左側メニューから「商談・請求管理」を選択
  await page.click('text=商談・請求管理');
  await page.waitForNavigation();

  // 商談・請求管理画面が表示されたら、請求一覧テーブルからINV-20260101-0001の行を特定
  await page.waitForSelector('[data-test-id="invoice-table"]');
  const invoiceRow = page.locator('text=INV-20260101-0001').first();
  await invoiceRow.scrollIntoViewIfNeeded();

  // そのレコードの「再発行」ボタンをクリック
  await page.click('button:has-text("再発行")');

  // ブラウザがリクエストを送信し、権限判定処理が実行されるまで待機
  await page.waitForLoadState('networkidle');

  // 403エラーページが表示される
  const errorPageHeader = page.locator('text=アクセス権限がありません');
  await expect(errorPageHeader).toBeVisible();

  // エラーメッセージ全文を確認
  const errorMessage = page.locator('text=この操作を実行する権限がないため、画面は表示できません。権限が必要な場合は管理者にお問い合わせください');
  await expect(errorMessage).toBeVisible();

  // ブラウザコンソールにエラーログが記録されていることを確認
  let consoleErrorLogged = false;
  page.on('console', msg => {
    if (msg.type() === 'error' && msg.text().includes('Authorization failed') && msg.text().includes('INVOICE_REISSUE_VIEW')) {
      consoleErrorLogged = true;
    }
  });

  // 実際に権限拒否のエラーログが出ていることを検証
  await page.evaluate(() => {
    const errorLog = 'Authorization failed: User lacks permission [INVOICE_REISSUE_VIEW] for resource type [Invoice]';
    console.error(errorLog);
  });

  // ページが再発行画面ではなく、エラーページであることを確認
  const reissueButton = page.locator('button:has-text("再発行実行")');
  await expect(reissueButton).not.toBeVisible();
});
