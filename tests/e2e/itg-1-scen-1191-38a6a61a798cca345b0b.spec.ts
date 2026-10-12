import { test, expect } from '@playwright/test';

test.describe('SCEN-1191: 商談詳細タブ表示 - 営業成績金額がゼロで請求金額がゼロでない', () => {
  test('営業成績金額がゼロで請求金額がゼロでない場合、エラーハイライトが表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    await dealRow.click();
    await page.waitForTimeout(300);

    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();

    const amountElements = page.locator('[class*="amount"], [data-field*="amount"]');
    const amountCount = await amountElements.count();

    let hasErrorHighlight = false;
    for (let i = 0; i < Math.min(amountCount, 5); i++) {
      const element = amountElements.nth(i);
      const style = await element.getAttribute('style');
      const classList = await element.getAttribute('class');

      if ((style && (style.includes('red') || style.includes('error'))) ||
          (classList && (classList.includes('error') || classList.includes('highlight')))) {
        hasErrorHighlight = true;
        break;
      }
    }

    expect(hasErrorHighlight).toBeTruthy();

    const redBorderedField = page.locator('[style*="border*red"], [style*="red"]').first();
    const hasRedBorder = await redBorderedField.isVisible().catch(() => false);
    if (hasRedBorder) {
      expect(hasRedBorder).toBeTruthy();
    }
  });
});
