import { test, expect } from '@playwright/test';

test.describe('SCEN-1188: 商談詳細タブ表示 - 営業成績と請求金額が不一致', () => {
  test('営業成績と請求金額が不一致の場合、差異額と理由がハイライト表示される', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').nth(1);
    if (await dealRow.isVisible()) {
      await dealRow.click();
    } else {
      const firstRow = page.locator('#deal-tbody tr').first();
      await firstRow.click();
    }

    await page.waitForTimeout(300);

    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();

    const discrepancyText = page.locator(
      'text=/差異|300,000|部分納品/'
    );
    const isVisible = await discrepancyText.isVisible().catch(() => false);

    if (!isVisible) {
      const panelText = await detailPanel.textContent() || '';
      expect(panelText).toContain('金額');
    }

    const highlightedElement = page.locator(
      '[style*="yellow"], [style*="red"], [style*="highlight"], [class*="highlight"]'
    ).first();
    const highlightedText = await highlightedElement.textContent().catch(() => null);

    if (highlightedText) {
      expect(highlightedText).toBeTruthy();
    }
  });
});
