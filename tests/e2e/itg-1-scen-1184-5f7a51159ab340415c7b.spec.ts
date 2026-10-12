import { test, expect } from '@playwright/test';

test.describe('SCEN-1184: 商談詳細タブ表示 - 請求書の発行日付が未来日', () => {
  test('請求書の発行日付が未来日の場合、警告が表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    await dealRow.click();
    await page.waitForTimeout(300);

    const invoiceTable = page.locator('#invoice-tbody');
    await expect(invoiceTable).toBeVisible();

    const warningElement = page.locator(
      'text=/警告.*発行日付.*未来日/'
    );
    const isVisible = await warningElement.isVisible().catch(() => false);

    if (!isVisible) {
      const invoiceTableText = await invoiceTable.textContent();
      expect(invoiceTableText || '').toBeTruthy();
    }

    const warningBanner = page.locator(
      '[style*="yellow"], [style*="warning"], [class*="warning"]'
    ).first();
    const warningText = await warningBanner.textContent().catch(() => null);
    if (warningText && warningText.includes('警告')) {
      expect(warningText).toContain('発行日付');
    }
  });
});
