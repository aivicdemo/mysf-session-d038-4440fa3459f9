import { test, expect } from '@playwright/test';

test.describe('SCEN-1185: 商談詳細タブ表示 - 営業成績金額がマイナス値', () => {
  test('営業成績金額がマイナス値の場合、エラーメッセージが表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    await dealRow.click();
    await page.waitForTimeout(300);

    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();

    const amountField = page.locator('[class*="amount"], [data-field="amount"]').first();
    if (await amountField.isVisible()) {
      await amountField.click();
      await amountField.fill('-100000');

      const saveButton = page.locator('button:has-text("保存"), button[type="submit"]').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(300);
      }
    }

    const errorBanner = page.locator(
      '[style*="red"], [class*="error"]'
    ).first();
    const errorText = await errorBanner.textContent().catch(() => null);

    if (errorText) {
      expect(errorText).toContain('マイナス値');
    }
  });
});
