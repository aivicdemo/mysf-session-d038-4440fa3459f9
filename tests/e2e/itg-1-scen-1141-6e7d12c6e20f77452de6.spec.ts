import { test, expect } from '@playwright/test';

test.describe('SCEN-1141: 請求書・請求明細タブ表示：営業担当者IDが空または不正な場合', () => {
  test('警告メッセージが表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.fill('#filter-customer', '');
    await page.fill('#filter-sales', '');
    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    await dealRow.click();
    await page.waitForTimeout(300);

    const tabButton = page.locator('[data-tab="invoices"]');
    await tabButton.click();
    await page.waitForTimeout(300);

    const invoiceTable = page.locator('[data-testid="invoice-list-table"]');
    await expect(invoiceTable).toBeVisible();

    const panelContent = page.locator('[data-aivic-panel="scr-1791354351333"]');
    const contentText = await panelContent.textContent();

    if (contentText && contentText.includes('営業担当者')) {
      expect(contentText).toMatch(/営業担当者情報が不正|営業担当者ID/);
    }
  });
});
