import { test, expect } from '@playwright/test';

test.describe('SCEN-1186: 商談詳細タブ表示 - 請求金額がマイナス値', () => {
  test('請求金額がマイナス値の場合、エラーメッセージが表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    await dealRow.click();
    await page.waitForTimeout(300);

    const tabButton = page.locator('[data-tab="invoices"], .tab').first();
    await tabButton.click();
    await page.waitForTimeout(300);

    const invoiceTable = page.locator('#invoice-tbody');
    await expect(invoiceTable).toBeVisible();

    const invoiceRow = page.locator('#invoice-tbody tr').first();
    if (await invoiceRow.isVisible()) {
      const amountCell = invoiceRow.locator('td').nth(3);
      await amountCell.click();

      const amountInput = page.locator('input[type="text"], input[type="number"]').first();
      if (await amountInput.isVisible()) {
        await amountInput.fill('-10000');
        await page.keyboard.press('Tab');
        await page.waitForTimeout(300);
      }
    }

    const errorMessage = page.locator(
      'text=/マイナス値|0以上の値/'
    );
    const isErrorVisible = await errorMessage.isVisible().catch(() => false);
    expect(isErrorVisible).toBeTruthy();

    const errorText = await errorMessage.textContent().catch(() => '');
    expect(errorText).toContain('マイナス値');

    const saveButton = page.locator('button:has-text("保存"), button[type="submit"]').first();
    if (await saveButton.isVisible()) {
      expect(await saveButton.getAttribute('disabled')).not.toBeNull();
    }
  });
});
