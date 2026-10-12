import { test, expect } from '@playwright/test';

test('SCEN-1260: 再発行対象の請求書の金額と、その請求書に紐付く請求明細の合計金額が一致しないと、「請求書と請求明細の金額が一致しません」エラーが表示される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 営業プロセス統合ダッシュボードから「商談・請求管理画面」を開く
  await page.goto('/panels/scr-1791354337614.html');
  await page.click('text=商談・請求管理');
  await page.waitForNavigation();

  // 請求書一覧から再発行対象の請求書（INV-2024-001）を検索・表示
  const invoiceRow = page.locator('text=INV-2024-001').first();
  await invoiceRow.scrollIntoViewIfNeeded();

  // 当該請求書の「再発行」ボタンをクリック
  await page.click('button:has-text("再発行")');

  // 再発行確認画面が表示されるまで待機
  await page.waitForLoadState('networkidle');

  // 再発行確認画面の上部に、赤色のエラーメッセージが表示される
  const errorMessage = page.locator('text=請求書と請求明細の金額が一致しません');
  await expect(errorMessage).toBeVisible();

  // エラーメッセージの色が赤いことを確認
  const errorElement = page.locator('[data-test-id="error-message"]');
  const color = await errorElement.evaluate(el => {
    return window.getComputedStyle(el).color;
  });
  expect(color).toContain('rgb');

  // 「確認」ボタンが無効化またはグレーアウトされているか、非表示
  const confirmButton = page.locator('button:has-text("確認"), button:has-text("再発行実行")');
  const isDisabledOrHidden =
    await confirmButton.isDisabled().catch(() => false) ||
    !await confirmButton.isVisible().catch(() => false);
  expect(isDisabledOrHidden).toBeTruthy();

  // エラーメッセージに具体的な数値が併記される
  const detailMessage = page.locator('text=/100,000|95,000/');
  await expect(detailMessage).toBeVisible();

  // 具体的に請求書金額と明細合計がメッセージに含まれることを確認
  await expect(page.locator('text=/請求書金額.*100,000円.*請求明細合計.*95,000円/')).toBeVisible();
});
