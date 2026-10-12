import { test, expect } from '@playwright/test';

test.describe('SCEN-1177: 請求合計が商談金額と一致しない場合、金額ズレが検出される', () => {
  test('請求合計と商談金額のズレが検出される', async ({ page }) => {
    // 営業プロセス統合ダッシュボード画面を開く
    await page.goto('/panels/scr-1791354337614.html');
    await page.waitForLoadState('networkidle');

    // 商談・請求管理画面に遷移する
    const dealManagementNav = page.locator('[data-testid="deal-management"], a:has-text("商談・請求管理"), text=/商談・請求管理/').first();
    await dealManagementNav.click();
    await page.waitForLoadState('networkidle');

    // 前提条件で作成した商談レコードを検索・選択
    // 商談ID（例：前提条件に記載される商談）を検索
    const dealTable = page.locator('table:has(text=/商談ID|商談/)').first();
    const targetDeal = dealTable.locator('tbody tr').first();
    await targetDeal.click();
    await page.waitForLoadState('networkidle');

    // 商談詳細タブを開く
    const detailsTab = page.locator('[data-testid="details-tab"], [id="details-tab"], button:has-text("詳細"), button:has-text("商談詳細")').first();
    const isTabVisible = await detailsTab.isVisible().catch(() => false);

    if (isTabVisible) {
      await detailsTab.click();
      await page.waitForLoadState('networkidle');
    }

    // 商談詳細タブ内で「請求情報」セクションまでスクロール・表示を待つ
    const invoiceInfoSection = page.locator('text=/請求情報|関連請求情報|請求書情報/').first();
    await invoiceInfoSection.scrollIntoViewIfNeeded();
    await page.waitForLoadState('networkidle');

    // 『金額ズレ検出』のバナーまたはアラートが表示されることを確認
    const amountDiscrepancyBanner = page.locator('text=/金額ズレ検出|金額ズレが検出されました/').first();
    await expect(amountDiscrepancyBanner).toBeVisible();

    // 「商談金額: 500,000円 / 請求合計: 480,000円 / ズレ額: -20,000円」が具体的に表示されることを確認
    const dealAmount = page.locator('text=/商談金額.*500,000|500,000.*円/').first();
    await expect(dealAmount).toBeVisible();

    const invoiceTotal = page.locator('text=/請求合計.*480,000|480,000.*円/').first();
    await expect(invoiceTotal).toBeVisible();

    const discrepancy = page.locator('text=/ズレ額.*-20,000|-20,000.*円|ズレ.*20,000/').first();
    await expect(discrepancy).toBeVisible();
  });
});
