import { test, expect, Page } from '@playwright/test';

test('SCEN-1152: 営業担当者別・顧客別の請求金額集計が自動生成される', async ({ page }) => {
  // ログイン
  await page.goto('/login.html');
  await page.fill('input[placeholder*="ユーザー"]', 'testuser');
  await page.fill('input[placeholder*="パスワード"]', 'password');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  // ダッシュボード画面を開く
  await page.goto('/panels/scr-1791354337614.html');

  // 「請求書・請求明細」タブをクリック
  await page.click('text=請求書・請求明細');

  // ローディング表示が消えるまで待機
  await page.waitForFunction(() => {
    const loading = document.querySelector('[class*="loading"]');
    const el = loading as HTMLElement | null;
    return !el || el.offsetParent === null;
  });

  // 営業担当者別集計ブロックを確認
  const salesAgentAggregation = page.locator('text=営業担当者別');
  await expect(salesAgentAggregation).toBeVisible();

  // 営業担当者Aの集計データを確認（請求書件数9件、合計請求金額1,250万円）
  await expect(page.locator('text=営業担当者A')).toBeVisible();
  await expect(page.locator('text=9件')).toBeVisible();
  await expect(page.locator('text=1,250万円')).toBeVisible();

  // 顧客別集計ブロックを確認
  const customerAggregation = page.locator('text=顧客別');
  await expect(customerAggregation).toBeVisible();

  // 顧客X: 請求書件数3件、合計請求金額370万円を確認
  await expect(page.locator('text=顧客X')).toBeVisible();
  await expect(page.locator('text=3件').first()).toBeVisible();
  await expect(page.locator('text=370万円')).toBeVisible();

  // 顧客Y: 請求書件数3件、合計請求金額280万円を確認
  await expect(page.locator('text=顧客Y')).toBeVisible();
  await expect(page.locator('text=280万円')).toBeVisible();

  // 顧客Z: 請求書件数3件、合計請求金額600万円を確認
  await expect(page.locator('text=顧客Z')).toBeVisible();
  await expect(page.locator('text=600万円')).toBeVisible();

  // ドリルダウンリンクをクリック（顧客Xのリンクをクリック）
  const customerXLink = page.locator('text=顧客X').first();
  await customerXLink.click();

  // 対応する請求書詳細画面へ遷移することを確認
  await page.waitForNavigation();
  await expect(page).toHaveURL(/.*scr-1791354351333/);
});
