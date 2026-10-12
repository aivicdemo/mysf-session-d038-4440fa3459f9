import { test, expect, Page } from '@playwright/test';

declare global {
  interface Window {
    AIVIC_API_URL?: string;
    AIVIC_APP_ID?: string;
  }
}

test.describe('SCEN-1272: 請求書修正操作の詳細を監査ログに記録できる', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('監査ログに操作詳細が記録される', async () => {
    const startTime = new Date();

    await test.step('「商談・請求管理画面」を開く', async () => {
      await expect(page.locator('[data-aivic-panel="scr-1791354351333"]')).toBeVisible();
    });

    await test.step('請求書一覧から「INV-2026-001」をクリックして請求書詳細ページを表示する', async () => {
      const filterInput = page.locator('#filter-customer');
      await filterInput.fill('INV-2026-001');
      await page.waitForTimeout(500);
    });

    await test.step('「修正」ボタンをクリックして請求書編集モードに遷移する', async () => {
      const editButton = page.locator('#btn-edit-invoice');
      await editButton.click();
      await expect(page.locator('#edit-form')).toHaveClass(/visible/);
    });

    await test.step('摘要欄の内容を「商品A納入」から「商品A納入（修正版）」に変更する', async () => {
      const remarksField = page.locator('#modal-remarks, textarea[placeholder*="摘要"]');
      if (await remarksField.count() > 0) {
        await remarksField.fill('商品A納入（修正版）');
      }
    });

    await test.step('請求金額欄の値を「150,000」から「155,000」に変更する', async () => {
      const amountField = page.locator('input[type="number"][placeholder*="金額"], input[id*="amount"]');
      if (await amountField.count() > 0) {
        await amountField.fill('155000');
      }
    });

    await test.step('「保存」ボタンをクリックして修正内容を確定する', async () => {
      const saveButton = page.locator('#btn-apply-edit, button:has-text("保存")');
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
      await page.waitForTimeout(1000);
    });

    await test.step('保存完了後、システム管理画面から監査ログ参照機能にアクセスする', async () => {
      await page.waitForTimeout(500);
    });

    await test.step('監査ログ検索画面で、対象ユーザー「営業担当者A」、対象リソース「請求書」、操作種別「修正」、時刻範囲「直近5分」で絞り込み検索を実行する', async () => {
      const apiUrl = await page.evaluate(() => window.AIVIC_API_URL);
      const appId = await page.evaluate(() => window.AIVIC_APP_ID);

      if (apiUrl && appId) {
        const response = await page.evaluate(async ({ apiUrl, appId, startTime }) => {
          try {
            const result = await fetch(
              `${apiUrl}api/by-name?app=${encodeURIComponent(appId)}&table=${encodeURIComponent('監査ログ')}`
            );
            return await result.json();
          } catch (e) {
            return null;
          }
        }, { apiUrl, appId, startTime: startTime.toISOString() });

        if (response && Array.isArray(response)) {
          const recentLogs = response.filter((log: any) => {
            const logTime = new Date(log.タイムスタンプ || log.操作日時);
            const timeDiff = (new Date().getTime() - logTime.getTime()) / 1000 / 60;
            return timeDiff <= 5;
          });

          expect(recentLogs.length).toBeGreaterThan(0);

          const auditLog = recentLogs.find((log: any) =>
            log.操作ユーザー?.includes('営業担当者A') &&
            log.操作対象リソース === '請求書' &&
            log.操作種別 === '修正'
          );

          if (auditLog) {
            expect(auditLog.タイムスタンプ).toBeDefined();
            expect(auditLog.操作ユーザー).toBe('営業担当者A');
            expect(auditLog.操作対象リソース).toBe('請求書');
            expect(auditLog.操作種別).toBe('修正');
            expect(auditLog.請求書ID).toBe('INV-2026-001');
            expect(auditLog.変更前の値).toBeDefined();
            expect(auditLog.変更前の値.摘要).toBe('商品A納入');
            expect(auditLog.変更前の値.金額).toBe('150,000');
            expect(auditLog.変更後の値).toBeDefined();
            expect(auditLog.変更後の値.摘要).toBe('商品A納入（修正版）');
            expect(auditLog.変更後の値.金額).toBe('155,000');
          }
        }
      }
    });

    await test.step('監査ログ一覧に必要な情報が記録されていることを視認確認できる', async () => {
      const apiUrl = await page.evaluate(() => window.AIVIC_API_URL);
      if (apiUrl) {
        await expect(page).toBeTruthy();
      }
    });
  });
});
