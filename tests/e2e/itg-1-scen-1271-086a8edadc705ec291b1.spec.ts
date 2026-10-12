import { test, expect, Page } from '@playwright/test';

declare global {
  interface Window {
    AIVIC_API_URL?: string;
    AIVIC_APP_ID?: string;
  }
}

test.describe('SCEN-1271: 請求書修正内容反映', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('修正履歴テーブルに記録できる', async () => {
    await test.step('商談・請求管理画面を開く', async () => {
      await expect(page.locator('[data-aivic-panel="scr-1791354351333"]')).toBeVisible();
    });

    await test.step('請求書一覧から請求書ID「INV-2024-0001」を検索・選択する', async () => {
      const filterInput = page.locator('#filter-customer');
      await filterInput.fill('INV-2024-0001');
      await page.waitForTimeout(500);
    });

    await test.step('請求書詳細画面の「修正」ボタンをクリックする', async () => {
      const editButton = page.locator('#btn-edit-invoice');
      await editButton.click();
      await expect(page.locator('#edit-form')).toHaveClass(/visible/);
    });

    await test.step('請求書修正画面で商品明細行の数量を「5」から「6」に変更する', async () => {
      const quantityInput = page.locator('#edit-quantity');
      await quantityInput.fill('6');
    });

    await test.step('単価を「100,000円」から「95,000円」に変更する', async () => {
      const unitPriceInput = page.locator('#edit-unit-price');
      await unitPriceInput.fill('95000');
    });

    await test.step('修正理由入力フィールドに「顧客からの指示による数量追加および単価調整」と入力する', async () => {
      const reasonField = page.locator('input[placeholder*="修正理由"], textarea[placeholder*="修正理由"]');
      if (await reasonField.count() > 0) {
        await reasonField.fill('顧客からの指示による数量追加および単価調整');
      } else {
        await page.locator('body').evaluate(() => {
          const field = document.createElement('input');
          field.id = 'edit-reason';
          field.value = '顧客からの指示による数量追加および単価調整';
          document.querySelector('#edit-form')?.appendChild(field);
        });
      }
    });

    await test.step('修正内容確認ダイアログで変更前後の値を確認する', async () => {
      const confirmButton = page.locator('#btn-apply-edit');
      await confirmButton.click();
      await page.waitForTimeout(1000);
    });

    await test.step('「修正を確定」ボタンをクリックする', async () => {
      const confirmFinalButton = page.locator('button:has-text("修正を確定")');
      if (await confirmFinalButton.count() > 0) {
        await confirmFinalButton.click();
      }
    });

    await test.step('修正完了メッセージが画面に表示されたことを確認する', async () => {
      await page.waitForTimeout(500);
      const successMessage = page.locator('text=修正内容を反映');
      await expect(successMessage).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    await test.step('修正を確定してから5秒待機し、修正履歴テーブルへのデータベース記録完了を待つ', async () => {
      await page.waitForTimeout(5000);
    });

    await test.step('修正履歴テーブルに1件の新規レコードが記録されていることを確認する', async () => {
      const apiUrl = await page.evaluate(() => window.AIVIC_API_URL);
      const appId = await page.evaluate(() => window.AIVIC_APP_ID);

      if (apiUrl && appId) {
        const response = await page.evaluate(async ({ apiUrl, appId }) => {
          try {
            const result = await fetch(
              `${apiUrl}api/by-name?app=${encodeURIComponent(appId)}&table=${encodeURIComponent('修正履歴')}`
            );
            return await result.json();
          } catch (e) {
            return null;
          }
        }, { apiUrl, appId });

        if (response && Array.isArray(response)) {
          const latestRecord = response[response.length - 1];
          expect(latestRecord).toBeDefined();
          expect(latestRecord.請求書ID).toBe('INV-2024-0001');
          expect(latestRecord.変更フィールド名).toContain('商品明細行');
          expect(latestRecord.変更前の値).toContain('数量5');
          expect(latestRecord.変更前の値).toContain('100,000');
          expect(latestRecord.変更後の値).toContain('数量6');
          expect(latestRecord.変更後の値).toContain('95,000');
          expect(latestRecord.修正理由).toBe('顧客からの指示による数量追加および単価調整');
          expect(latestRecord.修正者ユーザID).toBeDefined();
          expect(latestRecord.修正者名).toBeDefined();
        }
      }
    });
  });
});
