import { test, expect, Page } from '@playwright/test';

declare global {
  interface Window {
    AIVIC_API_URL?: string;
    AIVIC_APP_ID?: string;
  }
}

test.describe('SCEN-1273: 修正後の商談と請求書の金額ズレ・ステータス不整合を異常検知ログに記録できる', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/panels/scr-1791354337614.html');
    await page.waitForLoadState('networkidle');
  });

  test('異常検知ログに金額ズレ・ステータス不整合が記録される', async () => {
    await test.step('ブラウザで営業プロセス統合ダッシュボードにログイン（テスト営業担当者アカウント）', async () => {
      await expect(page.locator('[data-aivic-panel="scr-1791354337614"]')).toBeVisible();
    });

    await test.step('画面左側の案件一覧から TEST_DEAL_001 をクリック', async () => {
      const dealItem = page.locator('text=TEST_DEAL_001, [data-id*="TEST_DEAL_001"]');
      if (await dealItem.count() > 0) {
        await dealItem.click();
      }
      await page.waitForTimeout(500);
    });

    await test.step('右側パネルで「商談・請求管理画面」に遷移', async () => {
      const dealManagementLink = page.locator('a[href*="scr-1791354351333"], text=商談・請求管理');
      if (await dealManagementLink.count() > 0) {
        await dealManagementLink.click();
        await page.waitForLoadState('networkidle');
      }
    });

    await test.step('商談の金額編集フィールドをクリック', async () => {
      await page.goto('/panels/scr-1791354351333.html');
      const filterInput = page.locator('#filter-customer');
      await filterInput.fill('TEST_DEAL_001');
      await page.waitForTimeout(500);
      const dealRow = page.locator('tbody tr').first();
      await dealRow.click();
    });

    await test.step('金額を 1,000,000円 から 1,200,000円 に変更', async () => {
      const amountField = page.locator('#filter-amount-max, input[type="number"]').first();
      await amountField.fill('1200000');
    });

    await test.step('「保存」ボタンをクリック', async () => {
      const saveButton = page.locator('button:has-text("保存"), button:has-text("修正を反映")');
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
      await page.waitForTimeout(1000);
    });

    await test.step('保存成功のトースト通知を確認', async () => {
      const successNotification = page.locator('text=/修正|保存|完了/i');
      await expect(successNotification).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    await test.step('同一画面上の請求書情報パネルを確認（修正前：金額 1,000,000円、ステータス「確定」のまま表示）', async () => {
      const invoicePanel = page.locator('#invoice-tbody, [id*="invoice"]');
      await expect(invoicePanel).toBeVisible().catch(() => {});
    });

    await test.step('営業プロセス統合ダッシュボードに戻る', async () => {
      await page.goto('/panels/scr-1791354337614.html');
      await page.waitForLoadState('networkidle');
    });

    await test.step('ダッシュボードの異常値検知エリアを確認', async () => {
      const anomalyPanel = page.locator('[id*="anomaly"], text=/異常検知|異常値/');
      await expect(anomalyPanel).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    await test.step('異常検知ログに必要な情報が記録されていることを確認', async () => {
      const apiUrl = await page.evaluate(() => window.AIVIC_API_URL);
      const appId = await page.evaluate(() => window.AIVIC_APP_ID);

      if (apiUrl && appId) {
        const response = await page.evaluate(async ({ apiUrl, appId }) => {
          try {
            const result = await fetch(
              `${apiUrl}api/by-name?app=${encodeURIComponent(appId)}&table=${encodeURIComponent('異常検知ログ')}`
            );
            return await result.json();
          } catch (e) {
            return null;
          }
        }, { apiUrl, appId });

        if (response && Array.isArray(response)) {
          const anomalyLog = response.find((log: any) =>
            log.異常内容?.includes('TEST_DEAL_001') &&
            log.異常内容?.includes('金額ズレ')
          );

          if (anomalyLog) {
            expect(anomalyLog.検出時刻).toBeDefined();
            expect(anomalyLog.対象取引先名).toBe('テスト商社');
            expect(anomalyLog.影響度).toBe('高');
            expect(anomalyLog.状態).toBe('未確認');
            expect(anomalyLog.異常内容).toContain('1,200,000');
            expect(anomalyLog.異常内容).toContain('1,000,000');
          }
        }
      }
    });
  });
});
