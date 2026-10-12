import { test, expect } from '@playwright/test';

test.describe('SCEN-1176: 請求書と請求明細の金額が一致しない場合、金額ズレが検出される', () => {
  test('金額ズレが検出される', async ({ page }) => {
    // 営業プロセス統合ダッシュボード画面へ遷移
    await page.goto('/panels/scr-1791354337614.html');

    // ダッシュボード画面上で『データ整合性自動検証』処理が実行されるまで待機
    // ブラウザをリロードまたはダッシュボード画面を再表示
    await page.reload();
    await page.waitForLoadState('networkidle');

    // ダッシュボード画面上の『異常値・未完了案件』表示エリアを確認
    const anomalySection = page.locator('[data-testid="anomaly-panel"], text=/異常値|未完了案件|自動検知/').first();
    await expect(anomalySection).toBeVisible();

    // 『異常値・未完了案件』エリアに表示された警告メッセージをクリックして詳細を確認
    const warningMessage = page.locator('text=/商談.*請求書.*請求明細.*金額ズレ|金額ズレを検出/').first();
    await expect(warningMessage).toBeVisible();
    await warningMessage.click();
    await page.waitForLoadState('networkidle');

    // 詳細表示から『商談詳細タブ表示』へ遷移
    const transitionLink = page.locator('a, button').filter({ has: page.locator('text=詳細を表示') }).or(page.locator('a, button').filter({ has: page.locator('text=詳細を確認') })).first();
    const isTransitionLinkVisible = await transitionLink.isVisible().catch(() => false);

    if (isTransitionLinkVisible) {
      await transitionLink.click();
      await page.waitForLoadState('networkidle');
    } else {
      // リンクが無い場合は、直接商談・請求管理画面を開く
      await page.goto('/panels/scr-1791354351333.html?dealId=DEAL-20250107-001');
      await page.waitForLoadState('networkidle');
    }

    // 商談・請求管理画面上の『請求書情報』セクションで請求書金額『1,500,000円』が表示されていることを確認
    const invoiceAmountSection = page.locator('text=請求書情報').or(page.locator('text=請求金額')).first();
    await expect(invoiceAmountSection).toBeVisible();

    const invoiceAmount = page.locator('text=1,500,000').first();
    await expect(invoiceAmount).toBeVisible();

    // 同一画面の『請求明細一覧』セクションで請求明細書合計金額『1,450,000円』が表示されていることを確認
    const lineItemsSection = page.locator('text=/請求明細|明細一覧|請求明細一覧/').first();
    await expect(lineItemsSection).toBeVisible();

    const lineItemsAmount = page.locator('text=1,450,000').first();
    await expect(lineItemsAmount).toBeVisible();

    // ダッシュボード画面の『異常値・未完了案件の自動検知』エリアに『商談DEAL-20250107-001：請求書と請求明細の金額ズレを検出（差分：50,000円）』警告が表示される
    await page.goto('/panels/scr-1791354337614.html');
    await page.waitForLoadState('networkidle');

    const discrepancyWarning = page.locator('text=/商談DEAL-20250107-001.*金額ズレ.*50,000|金額ズレを検出.*50,000/').first();
    await expect(discrepancyWarning).toBeVisible();
  });
});
