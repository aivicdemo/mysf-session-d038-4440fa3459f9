import { test, expect } from '@playwright/test';

test('SCEN-1425: 取引先活動タブをクリックして営業活動一覧が表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354379354.html');

  // 取引先を選択してアクティビティタブを表示
  const customerRows = page.locator('tbody#customer-tbody tr');
  const firstCustomer = customerRows.first();
  await firstCustomer.click();

  // 取引先活動（営業活動）タブをクリック
  const activitiesTab = page.locator('[data-tab="activities"]');
  await activitiesTab.click();

  // 営業活動タブがアクティブ状態に切り替わったことを確認
  await expect(activitiesTab).toHaveClass(/active/);

  // 営業活動一覧が表示されていることを確認（テーブルのヘッダーが表示される）
  const activitiesTableWrap = page.locator('#activities-tab .table-wrap');
  await expect(activitiesTableWrap).toBeVisible();

  // タブコンテンツが表示されていることを確認
  const tabContent = page.locator('#activities-tab');
  await expect(tabContent).toHaveClass(/active/);

  // 他のタブコンテンツは非表示であることを確認（最初に表示されていた商談タブなど）
  const dealsTab = page.locator('[data-tab="deals"]');
  await expect(dealsTab).not.toHaveClass(/active/);
});
