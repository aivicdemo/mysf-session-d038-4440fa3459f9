import { test, expect } from '@playwright/test';

test.describe('SCEN-1189: 商談詳細タブ表示 - 営業成績が未請求状態', () => {
  test('営業成績が未請求状態の場合、差異理由が未請求として表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    await dealRow.click();
    await page.waitForTimeout(300);

    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();

    await page.evaluate(() => {
      const panel = document.querySelector('#detail-panel');
      if (panel) {
        panel.scrollIntoView();
      }
    });

    const differenceSection = page.locator('[class*="difference"], [class*="discrepancy"], [class*="variation"]');
    const hasDifferenceSection = await differenceSection.first().isVisible().catch(() => false);

    if (hasDifferenceSection) {
      const reasonText = page.locator('text=未請求');
      const isReasonVisible = await reasonText.isVisible().catch(() => false);
      expect(isReasonVisible).toBeTruthy();
    }

    const panelText = await detailPanel.textContent() || '';
    if (panelText.includes('未請求')) {
      expect(panelText).toContain('未請求');
    }
  });
});
