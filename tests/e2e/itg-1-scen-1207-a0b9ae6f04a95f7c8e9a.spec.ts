import { test, expect } from '@playwright/test';

test('SCEN-1207: 請求状態が全額請求済みと判定される場合、画面に全額請求済みと表示される', async ({ page }) => {
  // 営業担当者ユーザーで営業プロセス統合ダッシュボードにアクセス
  await page.goto('/');
  await page.fill('input[type="email"]', 'sales_user@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button:has-text("ログイン")');
  await page.waitForNavigation();

  await page.goto('/panels/scr-1791354337614.html');
  await page.waitForTimeout(1000);

  // 商談・請求管理画面に遷移
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForTimeout(1000);

  // 商談一覧から請求状態が「全額請求済み」に判定された商談のリンクをクリック
  const dealRows = await page.locator('table[data-testid="deal-list-table"] tbody tr').count();
  expect(dealRows).toBeGreaterThan(0);

  await page.click('table[data-testid="deal-list-table"] tbody tr:first-child');
  await page.waitForTimeout(500);

  // 商談・請求管理画面の商談詳細タブが表示されるまで待機（タブ読み込み完了まで最大5秒）
  const detailPanel = await page.locator('#detail-panel');
  await expect(detailPanel).toBeVisible({ timeout: 5000 });

  // 商談詳細タブ内の請求状態を表示するUIコンポーネント（ステータスバッジまたはステータスフィールド）が描画
  const fullyBilledStatus = await page.locator('text=/全額請求済み/');

  // 請求状態表示領域に「全額請求済み」というテキストが日本語で表示
  const fullyBilledCount = await fullyBilledStatus.count();
  if (fullyBilledCount > 0) {
    await expect(fullyBilledStatus.first()).toBeVisible();

    // ステータスの背景色が請求完了を示す色（例：緑色）で描画されていることが画面上で視認
    const statusBadge = await page.locator('[class*="status"], [data-testid*="status"], .badge, .badge-success, .badge-completed');
    const badgeCount = await statusBadge.count();
    expect(badgeCount).toBeGreaterThan(0);
  } else {
    // 別の形式で確認
    const panelText = await detailPanel.textContent();
    expect(panelText).toContain('全額請求済み');
  }
});
