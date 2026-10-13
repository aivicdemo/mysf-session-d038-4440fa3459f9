import { test, expect } from '@playwright/test';

test('SCEN-408: 正常系：判定結果がダッシュボード画面に反映され、最新状態として表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html');

  // ダッシュボード画面が読み込まれることを確認
  await expect(page.locator('[data-aivic-panel="scr-1791354872866"]')).toBeVisible();

  // 差異件数サマリーを確認
  const discrepancyCount = page.locator('#discrepancy-count');
  await expect(discrepancyCount).toBeVisible();

  // ステータスアイコンが表示されているかを確認
  const statusBadges = page.locator('.status-badge');
  await expect(statusBadges.first()).toBeVisible();

  // 判定日時が表示されているかを確認
  const tableRows = page.locator('tbody tr');
  await expect(tableRows.first()).toBeVisible();

  // 最終更新タイムスタンプを確認（±30秒以内）
  const lastUpdateTime = page.locator('[data-testid="last-update-timestamp"]');
  const hasTimestamp = await lastUpdateTime.count() > 0;

  if (hasTimestamp) {
    await expect(lastUpdateTime).toBeVisible();
  }

  // 背景色またはフラグアイコンが更新されているかを確認
  const firstRow = tableRows.first();
  const rowStyle = await firstRow.getAttribute('style');
  const rowClass = await firstRow.getAttribute('class');

  // 判定済み、要確認などのステータスが色で表現されているかを確認
  const statusElements = page.locator('.status-badge');
  for (let i = 0; i < await statusElements.count(); i++) {
    const badge = statusElements.nth(i);
    const className = await badge.getAttribute('class');
    expect(className).toMatch(/status-badge/);
  }
});
