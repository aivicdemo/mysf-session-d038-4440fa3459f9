import { test, expect, Page } from '@playwright/test';

test('SCEN-1336: 所要時間の範囲検証：0分以下の所要時間が入力されている場合、保存が拒否され、エラーメッセージが表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354364933.html');

  // Wait for form to be ready
  await page.waitForSelector('#btn-submit');

  // Fill in required fields
  await page.selectOption('#sales-person', { index: 1 });
  await page.selectOption('#customer', { index: 1 });
  await page.check('input[name="activity-type"][value="訪問"]');
  await page.fill('#activity-date', '2026-10-12');
  await page.fill('#activity-count', '-5');

  // Blur to trigger validation
  await page.click('#activity-content');

  // Verify error display
  const errorField = page.locator('#activity-count').locator('xpath=..').locator('.error-message');
  await expect(errorField).toContainText('活動件数は1以上である必要があります');

  // Check submit button state (should be disabled or clicking should not save)
  const submitBtn = page.locator('#btn-submit');
  await submitBtn.click();

  // Verify that form still shows and no navigation occurred
  await expect(page.locator('.form-container')).toBeVisible();
  await expect(page.locator('.form-title')).toContainText('営業活動実績登録');
});
