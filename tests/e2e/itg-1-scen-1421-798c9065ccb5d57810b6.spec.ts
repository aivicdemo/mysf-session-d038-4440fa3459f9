import { test, expect } from '@playwright/test';

test.describe('SCEN-1421: 営業活動レコードが存在しないときの警告表示', () => {
  test('営業活動が1件も存在しない場合、警告メッセージが表示される', async ({ page }) => {
    // 顧客・取引先管理画面を開く
    await page.goto('/panels/scr-1791354379354.html');
    await page.waitForLoadState('networkidle');

    // 営業活動レコードが存在しない取引先を選択
    // テスト用: 全取引先から営業活動がない取引先を検索または選択
    const customerRows = page.locator('table tbody tr');
    let selectedRow = null;

    for (let i = 0; i < Math.min(3, await customerRows.count()); i++) {
      const row = customerRows.nth(i);
      await row.click();
      await page.waitForTimeout(300);

      // 営業活動タブを確認
      const activitiesTab = page.locator('button, [role="tab"]', { hasText: /営業活動|activities/ });
      if (await activitiesTab.count() > 0) {
        await activitiesTab.first().click();
        await page.waitForTimeout(300);

        // 営業活動がないか確認
        const emptyState = page.locator('[class*="empty"], text=営業活動がありません, text=データなし');
        if (await emptyState.count() > 0) {
          selectedRow = row;
          break;
        }
      }
    }

    // 選択した取引先が見つからない場合は、最初の取引先を選択
    if (!selectedRow && await customerRows.count() > 0) {
      selectedRow = customerRows.first();
      await selectedRow.click();
      await page.waitForTimeout(500);
    }

    // 取引先詳細画面内の『取引先商談タブ』をクリック
    const dealsTab = page.locator('button, [role="tab"]', { hasText: /関連商談|商談|deals/ });
    if (await dealsTab.count() > 0) {
      await dealsTab.first().click();
      await page.waitForTimeout(500);
    }

    // 取引先商談タブの表示領域を確認
    const tabContent = page.locator('[id*="deals-tab"], [class*="tab-content"]').first();
    if (await tabContent.count() > 0) {
      await expect(tabContent).toBeVisible();
    }

    // ページを再度チェック：営業活動タブに移動
    const activitiesTab = page.locator('button, [role="tab"]', { hasText: /営業活動|activities/ });
    if (await activitiesTab.count() > 0) {
      await activitiesTab.first().click();
      await page.waitForTimeout(500);
    }

    // 警告メッセージ「営業活動が記録されていません。活動を入力してください」が表示されることを確認
    const warningMessage = page.locator('text=営業活動が記録されていません。活動を入力してください');
    await expect(warningMessage).toBeVisible({ timeout: 3000 });

    // 警告メッセージが黄色（警告色）で表示される
    const warningElement = warningMessage.locator('..');
    const textColor = await warningElement.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.color;
    });
    const bgColor = await warningElement.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });

    // 警告色が適用されていれば OK
    const hasWarningColor = bgColor.toLowerCase().match(/yellow|orange|#ff|rgb\(255/) ||
      textColor.toLowerCase().match(/yellow|orange|#ff|rgb\(255/);
    expect(!!hasWarningColor).toBeTruthy();

    // 商談一覧の本体コンテンツは表示されず、警告メッセージのみが表示
    const activityTable = page.locator('[data-testid="activity-history-table"], table');
    const tableRows = activityTable.locator('tbody tr').filter({ has: page.locator(':not([class*="empty"])')});

    if (await activityTable.count() > 0) {
      const dataRows = await tableRows.count();
      // テーブルが空またはデータなし状態
      expect(dataRows).toBeLessThanOrEqual(0);
    }
  });
});
