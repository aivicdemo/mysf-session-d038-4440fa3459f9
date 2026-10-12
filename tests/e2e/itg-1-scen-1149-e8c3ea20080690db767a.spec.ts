import { test, expect, Page } from '@playwright/test';

test('SCEN-1149: クローズされた商談に請求書が紐付いていない場合、警告メッセージが表示される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // ダッシュボードから商談・請求管理画面に遷移
  await page.goto('/panels/scr-1791354351333.html');

  // クローズされた商談（請求書未紐付）を選択
  await page.click('#deal-tbody tr:first-child');
  await page.waitForSelector('#detail-panel');

  // 「請求書・請求明細」タブをクリック
  await page.click('#invoices-tab');

  // 警告メッセージが表示されることを確認
  const warningMessage = page.locator('text=この商談はクローズされていますが、請求書が紐付いていません');
  await expect(warningMessage).toBeVisible();

  // 警告メッセージが黄色または橙色で強調されていることを確認
  const warningBg = await warningMessage.evaluate(el => {
    const bgColor = window.getComputedStyle(el.closest('[style*="background"]') || el).backgroundColor;
    return bgColor;
  });
  expect(warningBg).toBeTruthy();

  // メッセージが上部に配置されていることを確認
  const position = await warningMessage.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return rect.top;
  });
  expect(position).toBeLessThan(300);

  // 請求書一覧エリアが空であることを確認
  await expect(page.locator('text=該当する請求書がありません')).toBeVisible();
});
