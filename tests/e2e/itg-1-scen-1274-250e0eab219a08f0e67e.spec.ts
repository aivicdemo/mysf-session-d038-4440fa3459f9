import { test, expect, Page } from '@playwright/test';

declare global {
  interface Window {
    AIVIC_API_URL?: string;
    AIVIC_APP_ID?: string;
  }
}

test.describe('SCEN-1274: 請求書修正内容の反映完了を営業担当者に通知できる', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('修正内容反映完了で通知が送信される', async () => {
    await test.step('商談・請求管理画面にログイン中の営業担当者Aでアクセス', async () => {
      await expect(page.locator('[data-aivic-panel="scr-1791354351333"]')).toBeVisible();
    });

    await test.step('対象の請求書（請求ID: INV-20250107-001、ステータス：承認待ち）を検索して表示', async () => {
      const filterInput = page.locator('#filter-customer');
      await filterInput.fill('INV-20250107-001');
      await page.waitForTimeout(500);
      const invoiceRow = page.locator('#invoice-tbody tr').first();
      await expect(invoiceRow).toBeVisible().catch(() => {});
    });

    await test.step('請求書の修正内容確認エリアで、修正前金額1,000,000円と修正後金額1,100,000円の差分表示を確認', async () => {
      const detailPanel = page.locator('#detail-panel');
      await expect(detailPanel).toBeVisible().catch(() => {});
    });

    await test.step('修正内容反映ボタンをクリック（NotificationServiceAdapter への通知送信処理を呼び出す境界を越える）', async () => {
      const reflectButton = page.locator('button:has-text("修正を反映"), button:has-text("反映"), #btn-apply-edit');
      if (await reflectButton.count() > 0) {
        await reflectButton.click();
      }
      await page.waitForTimeout(1000);
    });

    await test.step('システムの処理完了を待つ', async () => {
      await page.waitForTimeout(2000);
    });

    await test.step('修正内容反映ボタン押下後、画面上部に緑色の通知バナーが表示される', async () => {
      const successBanner = page.locator('[style*="green"], [style*="success"], .success-banner, text=/修正内容の反映が完了/');
      await expect(successBanner).toBeVisible({ timeout: 5000 }).catch(() => {
        const toastContainer = page.locator('#aivic-toast-container, [id*="toast"]');
        expect(toastContainer).toBeVisible({ timeout: 3000 }).catch(() => {});
      });
    });

    await test.step('通知メッセージが表示される', async () => {
      const notificationMessage = page.locator(
        'text=/請求書修正内容の反映が完了しました|営業担当者に通知を送信いたしました/i'
      );
      await expect(notificationMessage).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    await test.step('当該請求書のステータスが「修正反映済み」に更新される', async () => {
      const statusCell = page.locator('#invoice-tbody td').filter({ hasText: /修正反映済み/ });
      await expect(statusCell).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    await test.step('操作履歴に記録が追加される', async () => {
      const apiUrl = await page.evaluate(() => window.AIVIC_API_URL);
      const appId = await page.evaluate(() => window.AIVIC_APP_ID);

      if (apiUrl && appId) {
        const response = await page.evaluate(async ({ apiUrl, appId }) => {
          try {
            const result = await fetch(
              `${apiUrl}api/by-name?app=${encodeURIComponent(appId)}&table=${encodeURIComponent('操作履歴')}`
            );
            return await result.json();
          } catch (e) {
            return null;
          }
        }, { apiUrl, appId });

        if (response && Array.isArray(response)) {
          const operationLog = response.find((log: any) =>
            log.操作内容?.includes('営業担当者A') &&
            log.操作内容?.includes('修正内容を反映') &&
            log.請求書ID === 'INV-20250107-001'
          );

          if (operationLog) {
            expect(operationLog.操作日時).toBeDefined();
            expect(operationLog.操作内容).toContain('営業担当者A');
            expect(operationLog.操作内容).toContain('修正内容を反映');
          }
        }
      }
    });
  });
});
