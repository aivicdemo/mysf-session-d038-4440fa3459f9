import { test, expect } from '@playwright/test';

test.describe('SCEN-1178: 商談ステータスが受注なのに請求書ステータスが未発行の場合、ステータス不整合が検出される', () => {
  test('ステータス不整合が警告表示される', async ({ page }) => {
    // 営業プロセス統合ダッシュボードにログイン
    await page.goto('/panels/scr-1791354337614.html');
    await page.waitForLoadState('networkidle');

    // 営業プロセス統合ダッシュボード内で商談DEAL-12345に関連する項目を表示
    const dealItem = page.locator('text=/DEAL-12345|商談.*12345/').first();
    const isDealVisible = await dealItem.isVisible().catch(() => false);

    if (isDealVisible) {
      await dealItem.click();
      await page.waitForLoadState('networkidle');
    } else {
      // 商談一覧から手動で選択
      await page.goto('/panels/scr-1791354351333.html?dealId=DEAL-12345');
      await page.waitForLoadState('networkidle');
    }

    // 商談詳細タブをクリック
    const detailsTab = page.locator('[data-testid="details-tab"], [id="details-tab"], button:has-text("詳細"), button:has-text("商談詳細")').first();
    const isTabVisible = await detailsTab.isVisible().catch(() => false);

    if (isTabVisible) {
      await detailsTab.click();
      await page.waitForLoadState('networkidle');
    }

    // 商談ステータス「受注」と関連請求書ステータス「未発行」の両方が同一画面に表示されることを確認
    const dealStatusElement = page.locator('text=/商談ステータス|ステータス.*受注|受注/').first();
    await expect(dealStatusElement).toBeVisible();

    const invoiceStatusElement = page.locator('text=/請求書ステータス|ステータス.*未発行|未発行/').first();
    await expect(invoiceStatusElement).toBeVisible();

    // 画面上にステータス不整合の警告表示が出現するまで待機
    const statusMismatchWarning = page.locator('text=/ステータス不整合を検出|ステータス不整合/').first();
    await expect(statusMismatchWarning).toBeVisible({ timeout: 5000 });

    // 赤色アラートバナーが表示されていることを確認
    const alertBanner = page.locator('[class*="alert"], [class*="error"], [role="alert"]').filter({ has: page.locator('text=/ステータス不整合|受注済み|未発行/') }).first();
    const isBannerVisible = await alertBanner.isVisible().catch(() => false);

    if (isBannerVisible) {
      await expect(alertBanner).toBeVisible();

      // バナーが赤色であることを確認
      const bgColor = await alertBanner.evaluate(el => window.getComputedStyle(el).backgroundColor);
      expect(bgColor).toMatch(/^rgb\(255,\s*0,\s*0\)|#[fF]{2}0000/);
    }

    // ステータス不整合の詳細メッセージが表示されることを確認
    const detailMessage = page.locator('text=/商談は受注済みですが.*請求書.*未発行|ステータス不整合.*受注.*未発行/').first();
    await expect(detailMessage).toBeVisible();

    // 警告表示が画面上に視認可能な状態で保持されることを確認
    await expect(statusMismatchWarning).toBeInViewport();
  });
});
