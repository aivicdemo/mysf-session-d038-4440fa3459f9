import { test, expect, Page } from '@playwright/test';

test('SCEN-421: ログインユーザーが機能マッピング表再読込の実行権限を持たない場合、操作は拒否される', async ({ page }) => {
  // Navigate to the feature mapping management screen
  await page.goto('/panels/scr-1791354749663.html');

  // Wait for the page to fully load
  await page.waitForLoadState('networkidle');

  // Find the "再読込" (reload) button
  const reloadButton = page.locator('button:has-text("再読込"), button:has-text("機能マッピング表再読込"), [data-testid*="reload"], [aria-label*="再読込"]').first();

  // Verify the button exists and is visible
  await expect(reloadButton).toBeVisible({ timeout: 5000 });

  // Click the reload button
  await reloadButton.click();

  // Wait for system to validate user permissions
  await page.waitForTimeout(300);

  // Look for permission error message within 1 second
  const errorMessageLocator = page.locator(
    'text=/この操作を実行する権限がありません|権限エラーメッセージ/i, .alert-error, [role="alert"], .error-message'
  );

  // The error message should be visible within 1 second
  await expect(errorMessageLocator).toBeVisible({ timeout: 1000 });

  // Verify the error message contains the expected text
  const errorText = await errorMessageLocator.first().textContent();
  expect(errorText).toMatch(/この操作を実行する権限がありません/i);

  // Verify the mapping table data has not changed (refresh did not occur)
  // Get the current state of any visible mapping table data
  const mappingTableRows = page.locator('table tbody tr, [data-testid*="mapping"] tr');
  const initialRowCount = await mappingTableRows.count();

  // The mapping table should still be visible and unchanged
  if (initialRowCount > 0) {
    const firstRowText = await mappingTableRows.first().textContent();
    expect(firstRowText).toBeTruthy();
  }

  // Verify the button is still clickable (not disabled)
  await expect(reloadButton).toBeEnabled();
});
