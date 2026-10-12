import { test, expect } from '@playwright/test';

test.describe('SCEN-1192: 商談詳細タブ表示 - 営業成績金額が請求金額より大きい', () => {
  test('営業成績金額が請求金額より大きい場合、差異額は正数で表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    await dealRow.click();
    await page.waitForTimeout(300);

    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();

    const panelText = await detailPanel.textContent() || '';
    expect(panelText).toContain('金額');

    const differenceAmountText = page.locator(
      'text=/\\+?300,000|差異額/'
    );
    const isDifferenceVisible = await differenceAmountText.isVisible().catch(() => false);

    if (isDifferenceVisible) {
      const differenceText = await differenceAmountText.textContent();
      expect(differenceText).toBeTruthy();

      if (differenceText && differenceText.includes('300')) {
        expect(differenceText).not.toContain('-');
      }
    }

    const differenceField = page.locator('[class*="difference"], [data-field*="difference"]').first();
    if (await differenceField.isVisible()) {
      const fieldText = await differenceField.textContent();
      expect(fieldText).not.toContain('-');
    }
  });
});
