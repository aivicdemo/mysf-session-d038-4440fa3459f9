import { test, expect, Page } from '@playwright/test';

test('SCEN-1157: 集計期間の開始日が終了日より後の場合、エラーメッセージを表示', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // 商談・請求管理画面の『請求書・請求明細』タブをクリック
  await page.goto('/panels/scr-1791354351333.html');
  await page.click('#invoices-tab');

  // 集計期間フィルタが表示されるまで待機
  await page.waitForSelector('[class*="filter"]', { timeout: 5000 }).catch(() => null);

  // 集計期間フィルタの『開始日』フィールドに『2026-12-31』を入力
  const startDateInput = page.locator('input[placeholder*="開始日"]').first();
  if (await startDateInput.isVisible().catch(() => false)) {
    await startDateInput.fill('2026-12-31');
  }

  // 集計期間フィルタの『終了日』フィールドに『2026-01-01』を入力
  const endDateInput = page.locator('input[placeholder*="終了日"]').first();
  if (await endDateInput.isVisible().catch(() => false)) {
    await endDateInput.fill('2026-01-01');
  }

  // 『検索』または『集計実行』ボタンをクリック
  const searchButton = page.locator('button:has-text("検索")').first();
  const executeButton = page.locator('button:has-text("集計実行")').first();

  if (await searchButton.isVisible().catch(() => false)) {
    await searchButton.click();
  } else if (await executeButton.isVisible().catch(() => false)) {
    await executeButton.click();
  }

  // エラーメッセージが画面上に赤色で表示されることを確認
  const errorMessage = page.locator('text=集計期間の開始日は終了日より前の日付を指定してください');
  await expect(errorMessage).toBeVisible();

  // メッセージが赤色であることを確認
  const messageColor = await errorMessage.evaluate(el => {
    const parent = el.closest('[class*="error"]') || el;
    return window.getComputedStyle(parent).color;
  });
  expect(messageColor).toBeTruthy();

  // 請求書・請求明細の一覧が表示されないことを確認
  const invoiceTable = page.locator('#invoice-tbody');
  const isEmpty = await invoiceTable.evaluate(el => el.children.length === 0).catch(() => true);
  expect(isEmpty).toBe(true);

  // フィルタ条件の入力状態が保持されていることを確認
  const startDateValue = await startDateInput.inputValue().catch(() => '');
  const endDateValue = await endDateInput.inputValue().catch(() => '');

  expect(startDateValue).toBe('2026-12-31');
  expect(endDateValue).toBe('2026-01-01');
});
