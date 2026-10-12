import { test, expect } from '@playwright/test';

test.describe('SCEN-1187: 商談詳細タブ表示 - 営業成績と請求金額が一致', () => {
  test('営業成績と請求金額が一致する場合、差異が検出されない', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    await page.waitForTimeout(500);

    const dealRows = await page.locator('#deal-tbody tr').count();
    expect(dealRows).toBeGreaterThan(0);

    const dealRow = page.locator('#deal-tbody tr').first();
    await dealRow.click();
    await page.waitForTimeout(300);

    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();

    const panelText = await detailPanel.textContent();
    expect(panelText).toBeTruthy();

    const discrepancyBanner = page.locator(
      'text=/金額ズレ|差異検出|異常通知/'
    );
    const isDiscrepancyVisible = await discrepancyBanner.isVisible().catch(() => false);
    expect(isDiscrepancyVisible).toBeFalsy();

    const warningIcon = page.locator('[class*="warning"], [class*="error"], [class*="alert"]').first();
    const hasWarning = await warningIcon.isVisible().catch(() => false);
    expect(hasWarning).toBeFalsy();
  });
});
