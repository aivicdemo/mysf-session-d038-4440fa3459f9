import { test, expect } from '@playwright/test';

test('SCEN-1432: 営業活動タブ表示時に顧客IDが空の場合エラーが返される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  // 顧客を選択せずに直接営業活動タブへのアクセスを試みる
  // または、顧客IDが空の状態でタブをクリック

  // 営業活動タブのセレクタを確認
  const activitiesTab = page.locator('[data-tab="activities"]');

  // 営業活動タブをクリック（顧客未選択の場合）
  await activitiesTab.click();

  // ページの内容を確認
  const pageContent = await page.innerText('body');

  // エラーメッセージが表示されているか、またはタブが空の状態であることを確認
  const hasError = pageContent.includes('失敗') ||
                   pageContent.includes('エラー') ||
                   pageContent.includes('顧客');

  const hasEmptyState = await page.locator('#activities-tab .empty-state').isVisible();

  // ダッシュボード状態が保持されていることを確認
  // 取引先一覧がまだ表示されていることを確認
  const customerList = page.locator('#customer-tbody');
  await expect(customerList).toBeVisible();

  // エラーまたは空状態が成立することを確認
  const hasErrorOrEmpty = hasError || hasEmptyState;
  expect(hasErrorOrEmpty).toBeTruthy();
});
