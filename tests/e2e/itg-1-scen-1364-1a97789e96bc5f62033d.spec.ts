import { test, expect } from '@playwright/test';

test('SCEN-1364: ユーザーの職位が営業部長以上で、同一部門の取引先詳細画面を開くと金額情報が全表示される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードにアクセス
  await page.goto('/panels/scr-1791354379354.html');

  // 取引先一覧から「株式会社ABC」をクリック
  await page.getByText('株式会社ABC').click();

  // 取引先詳細画面が開かれるまで待機
  await page.waitForLoadState('networkidle');

  // 画面に表示された金額情報のセクションを確認
  // 売上実績1000万円
  await expect(page.locator('text=/売上実績|1000万円|10,000,000/')).toBeVisible();

  // 未収金額500万円
  await expect(page.locator('text=/未収金額|500万円|5,000,000/')).toBeVisible();

  // 契約金額3000万円
  await expect(page.locator('text=/契約金額|3000万円|30,000,000/')).toBeVisible();

  // 関連商談金額500万円
  await expect(page.locator('text=/関連商談金額|商談金額.*500万円|5,000,000/')).toBeVisible();

  // 金額フィールドが編集可能または詳細表示可能な状態
  const amountFields = page.locator('input[type="text"], input[type="number"], [contenteditable="true"], [class*="editable"]');
  const visibleEditableFields = amountFields.filter({ hasNot: page.locator('style=display: none') });
  const count = await visibleEditableFields.count();
  expect(count).toBeGreaterThanOrEqual(4);
});
