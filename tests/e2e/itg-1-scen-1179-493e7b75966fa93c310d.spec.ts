import { test, expect } from '@playwright/test';

test.describe('SCEN-1179: 商談がクローズ状態で請求書・請求明細が存在しない場合、警告が表示される', () => {
  test('クローズ状態の商談に警告が表示される', async ({ page }) => {
    // 営業プロセス統合ダッシュボード または 商談・請求管理画面 にアクセス
    await page.goto('/panels/scr-1791354337614.html');
    await page.waitForLoadState('networkidle');

    // クローズ状態（受注または失注）の商談を一覧から選択
    const dealManagementNav = page.locator('[data-testid="deal-management"], a:has-text("商談・請求管理"), text=/商談・請求管理/').first();
    await dealManagementNav.click();
    await page.waitForLoadState('networkidle');

    // クローズ状態の商談を検索（ステージで「成約」または「失注」に絞り込み）
    const stageFilter = page.locator('[data-testid="filter-stage"], select, input[placeholder*="ステージ"]').first();
    await stageFilter.click();
    const closedStageOption = page.locator('text=/成約|失注/').first();
    await closedStageOption.click();
    await page.waitForLoadState('networkidle');

    // クローズ状態の商談を一覧から選択
    const dealTable = page.locator('table:has(text=/商談/)').first();
    const closedDeal = dealTable.locator('tbody tr').first();
    await closedDeal.click();
    await page.waitForLoadState('networkidle');

    // 商談詳細タブ を開く
    const detailsTab = page.locator('[data-testid="details-tab"], [id="details-tab"], button:has-text("詳細"), button:has-text("商談詳細")').first();
    const isTabVisible = await detailsTab.isVisible().catch(() => false);

    if (isTabVisible) {
      await detailsTab.click();
      await page.waitForLoadState('networkidle');
    }

    // 画面がレンダリング完了するまで待機
    await page.waitForLoadState('networkidle');

    // 商談詳細タブ上部に、黄色またはオレンジ色の警告バナーが表示されることを確認
    const warningBanner = page.locator('[class*="warning"], [class*="alert"], [role="alert"]').filter({ has: page.locator('text=/クローズ状態|請求書.*請求明細.*登録されていない|請求処理が必要/') }).first();
    await expect(warningBanner).toBeVisible();

    // バナーが黄色またはオレンジ色であることを確認
    const bgColor = await warningBanner.evaluate(el => window.getComputedStyle(el).backgroundColor);
    expect(bgColor).toMatch(/^rgb\((255,\s*)?([0-9]{1,3},\s*)?([0-9]{1,3})\)|orange|yellow|#[fF]{2}[89a-fA-F]{2}00/i);

    // 警告メッセージが表示されることを確認
    const warningMessage = page.locator('text=/この商談はクローズ状態ですが|請求書・請求明細が登録されていません|請求処理が必要な場合は|請求書を生成してください/').first();
    await expect(warningMessage).toBeVisible();

    // 警告バナーがユーザーが閉じるまで画面に留まるか、一定時間後に自動消去されることを確認
    const isWarningStillVisible = await warningBanner.isVisible({ timeout: 1000 }).catch(() => false);

    if (isWarningStillVisible) {
      // バナーが表示されたままであることを確認（ユーザーが閉じるまで表示）
      await expect(warningBanner).toBeVisible();
    }
  });
});
