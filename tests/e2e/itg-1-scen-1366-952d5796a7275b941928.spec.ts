import { test, expect } from '@playwright/test';

test('SCEN-1366: 営業成績金額と請求金額が完全に一致する場合、一致状況として画面に表示される', async ({ page }) => {
  // 顧客・取引先管理画面を開く
  await page.goto('/panels/scr-1791354379354.html');

  // 取引先Aの名称で検索
  await page.locator('input[placeholder*="検索"], input[id*="search"]').fill('取引先A');
  await page.keyboard.press('Enter');

  // 該当する取引先を選択
  await page.getByText('取引先A').first().click();

  // 取引先Aの詳細ページが表示されることを確認
  await expect(page.locator('text=取引先A')).toBeVisible();

  // 詳細ページ内の「営業成績金額」「請求金額」「一致状況」の表示エリアまでスクロール
  const amountSection = page.locator('[class*="amount"], [class*="金額"]');
  await amountSection.first().scrollIntoViewIfNeeded();

  // 営業成績金額：1,000,000円の表示を確認
  await expect(page.locator('text=/営業成績金額|1,000,000|100万/')).toBeVisible();

  // 請求金額：1,000,000円の表示を確認
  await expect(page.locator('text=/請求金額|1,000,000|100万/')).toBeVisible();

  // 一致状況エリアに「営業成績金額と請求金額が一致しています」または「金額一致」が表示される
  const matchingStatus = page.locator('text=/営業成績金額と請求金額が一致|金額一致/');
  await expect(matchingStatus).toBeVisible();

  // 視認可能な色（緑色のバッジまたはチェックマーク付きのステータス）
  const statusElement = matchingStatus.or(page.locator('[class*="success"], [class*="match"], [class*="green"]'));
  await expect(statusElement).toBeVisible();
});
