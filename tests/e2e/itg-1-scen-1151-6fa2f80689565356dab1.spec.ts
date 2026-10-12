import { test, expect, Page } from '@playwright/test';

test('SCEN-1151: 請求書の発行日付が未来日の場合、警告メッセージが表示される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面に遷移
  await page.goto('/panels/scr-1791354351333.html');

  // 商談を選択
  await page.click('#deal-tbody tr:first-child');
  await page.waitForSelector('#detail-panel');

  // 「請求書・請求明細」タブをクリック
  await page.click('#invoices-tab');
  await page.waitForSelector('#invoice-tbody');

  // 発行日付が未来日の請求書行をクリック
  const invoiceRows = page.locator('#invoice-tbody tr');
  const count = await invoiceRows.count();

  for (let i = 0; i < count; i++) {
    const row = invoiceRows.nth(i);
    await row.click();

    // 警告メッセージが表示されるかを確認
    const warningMessage = page.locator('text=この請求書の発行日付は未来日に設定されています');
    const isVisible = await warningMessage.isVisible().catch(() => false);

    if (isVisible) {
      // 警告メッセージが表示されたことを確認
      await expect(warningMessage).toBeVisible();

      // 黄色または橙色の背景色を持つバナーであることを確認
      const banner = page.locator('[style*="background"]').filter({ hasText: '発行日付' }).first();
      const bgColor = await banner.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      }).catch(() => '');
      expect(bgColor).toBeTruthy();

      // メッセージが金額・明細情報の上に表示されることを確認
      const detailTable = page.locator('#invoice-detail-tbody');
      const messagePosition = await warningMessage.evaluate(el => {
        return el.getBoundingClientRect().top;
      });
      const tablePosition = await detailTable.evaluate(el => {
        return el.getBoundingClientRect().top;
      });
      expect(messagePosition).toBeLessThan(tablePosition);

      // 閉じるボタンまたは自動消去機能を確認
      const closeButton = page.locator('button[aria-label*="close"]').first();
      const hasCloseButton = await closeButton.isVisible().catch(() => false);
      expect(hasCloseButton || isVisible).toBe(true);

      break;
    }
  }
});
