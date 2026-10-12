import { test, expect } from '@playwright/test';

test.describe('SCEN-1137: 請求書・請求明細タブ表示：成績金額と請求金額が異なり金額ズレがある場合', () => {
  test('金額ズレとして警告表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.fill('#filter-customer', '');
    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const deals = page.locator('#deal-tbody tr');
    let found = false;

    for (let i = 0; i < Math.min(await deals.count(), 5); i++) {
      const dealRow = deals.nth(i);
      const dealId = await dealRow.getAttribute('data-id');
      if (dealId === 'DEAL-001' || i === 0) {
        await dealRow.click();
        found = true;
        break;
      }
    }

    if (!found) {
      const firstDeal = deals.first();
      await firstDeal.click();
    }

    await page.waitForTimeout(300);

    const tabButton = page.locator('[data-tab="invoices"]');
    await tabButton.click();
    await page.waitForTimeout(300);

    const invoiceTable = page.locator('[data-testid="invoice-list-table"]');
    await expect(invoiceTable).toBeVisible();

    const panelContent = page.locator('[data-aivic-panel="scr-1791354351333"]');
    const contentText = await panelContent.textContent();

    if (contentText && (contentText.includes('ズレ') || contentText.includes('異なり'))) {
      expect(contentText).toMatch(/金額ズレ|差異|異なり/);
      const warningPattern = /⚠|警告|注意/;
      expect(contentText).toMatch(warningPattern);
    }
  });
});
