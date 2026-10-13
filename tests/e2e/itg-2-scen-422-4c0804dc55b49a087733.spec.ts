import { test, expect, Page } from '@playwright/test';

test('SCEN-422: プロジェクトコンテキストの解決に失敗した場合、エラーメッセージが表示される', async ({ page }) => {
  // Navigate to the feature mapping management screen
  await page.goto('/panels/scr-1791354749663.html');

  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');

  // Verify the feature mapping table is displayed
  const mappingTable = page.locator('table, [data-testid*="mapping"]').first();
  await expect(mappingTable).toBeVisible({ timeout: 5000 });

  // Find the "再読込" (reload) button
  const reloadButton = page.locator('button:has-text("再読込"), button:has-text("機能マッピング表再読込"), [data-testid*="reload"], [aria-label*="再読込"]').first();

  // Verify the button exists and is visible
  await expect(reloadButton).toBeVisible({ timeout: 5000 });

  // Click the reload button to initiate the sync process
  await reloadButton.click();

  // Wait for the project context resolution and metadata sync to begin
  await page.waitForTimeout(500);

  // Wait for the system to attempt metadata synchronization and fail
  // The error message should appear on the screen
  const errorMessageLocator = page.locator(
    'text=/移行対象システムのメタデータ取得に失敗しました。前回同期時点のデータを表示しています。/i, .alert-error, [role="alert"], .error-message'
  );

  // The error message should be visible
  await expect(errorMessageLocator).toBeVisible({ timeout: 10000 });

  // Verify the exact error message is displayed
  const errorText = await errorMessageLocator.first().textContent();
  expect(errorText).toContain('移行対象システムのメタデータ取得に失敗しました');
  expect(errorText).toContain('前回同期時点のデータを表示しています');

  // Verify the mapping table still displays previous sync data
  const tableData = await mappingTable.locator('tbody').locator('tr').count();
  expect(tableData).toBeGreaterThan(0);

  // Verify the table was not cleared
  const tableText = await mappingTable.textContent();
  expect(tableText).toBeTruthy();
  expect(tableText?.length).toBeGreaterThan(0);

  // Verify the reload button is still clickable (operation can be retried)
  await expect(reloadButton).toBeEnabled();
});
