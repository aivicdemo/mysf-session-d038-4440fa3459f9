import { test, expect } from '@playwright/test';

test.describe('SCEN-1190: 商談詳細タブ表示 - 営業成績と請求金額に金額ズレ', () => {
  test('営業成績と請求金額に金額ズレがある場合、差異理由が金額ズレとして表示される', async ({ page }) => {
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

    const discrepancyReasonElement = page.locator(
      'text=/差異理由.*金額ズレ/'
    );
    const isVisible = await discrepancyReasonElement.isVisible().catch(() => false);

    if (!isVisible) {
      const panelText = await detailPanel.textContent() || '';
      expect(panelText).toContain('金額ズレ');
    }

    const amountDifferenceText = page.locator(
      'text=/50,000|金額ズレ/'
    );
    const hasDifference = await amountDifferenceText.isVisible().catch(() => false);
    expect(hasDifference).toBeTruthy();
  });
});
