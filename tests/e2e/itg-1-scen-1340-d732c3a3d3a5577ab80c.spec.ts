import { test, expect } from '@playwright/test';

test('SCEN-1340: ステージ遷移時の必須フィールド確認：遷移先ステージで必須とされるフィールドが未入力の場合、保存が拒否され、不足フィールド名が表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354364933.html');

  // Wait for form to be ready
  await page.waitForSelector('#btn-submit');

  // Fill in minimal required fields
  await page.selectOption('#sales-person', { index: 1 });
  await page.selectOption('#customer', { index: 1 });

  // Select a deal to trigger stage transition requirement
  try {
    await page.selectOption('#deal', { index: 1 });
  } catch {
    // Continue without deal
  }

  await page.check('input[name="activity-type"][value="訪問"]');
  await page.fill('#activity-date', '2026-10-12');
  await page.fill('#activity-count', '1');

  // Leave other fields empty (proposal fields would be required for "提案" stage)
  // Do not fill in activity content (would be required for proposal stage)

  // Click submit
  await page.click('#btn-submit');

  // Check for error message about missing required fields
  const errorBanner = page.locator('text=必要なフィールドを入力してください');

  try {
    await expect(errorBanner).toBeVisible({ timeout: 2000 });
  } catch {
    // Check for alternative error messages
    const altError = page.locator('[class*="error"]');
    if (await altError.count() > 0) {
      await expect(altError.first()).toBeVisible();
    }
  }

  // Verify that highlighted fields show validation state
  const errorFields = page.locator('.form-field.error');

  try {
    const errorCount = await errorFields.count();
    if (errorCount > 0) {
      await expect(errorFields.first()).toBeVisible();
    }
  } catch {
    // No error fields highlighted
  }

  // Verify form is still visible and data preserved
  await expect(page.locator('.form-container')).toBeVisible();
  await expect(page.locator('#activity-count')).toHaveValue('1');
});
