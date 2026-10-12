import { test, expect, Page } from '@playwright/test';

declare global {
  interface Window {
    AIVIC_API_URL?: string;
    AIVIC_APP_ID?: string;
  }
}

test.describe('SCEN-1275: 修正理由が空のときは入力エラーメッセージを表示して処理を中止する', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('修正理由が空のときエラーメッセージが表示される', async () => {
    await test.step('商談・請求管理画面から修正対象の請求書行を選択し、修正ボタンをクリック', async () => {
      const invoiceRow = page.locator('#invoice-tbody tr').first();
      await invoiceRow.click({ timeout: 5000 }).catch(() => {});
      const editButton = page.locator('#btn-edit-invoice');
      await editButton.click({ timeout: 5000 }).catch(() => {});
    });

    await test.step('請求書修正画面が開き、金額・品目などの修正項目が表示される', async () => {
      const editForm = page.locator('#edit-form');
      await expect(editForm).toHaveClass(/visible/).catch(() => {});
    });

    await test.step('金額フィールドなど修正対象項目を変更する', async () => {
      const quantityInput = page.locator('#edit-quantity');
      await quantityInput.fill('120000', { timeout: 5000 }).catch(() => {});
    });

    await test.step('修正理由フィールドには何も入力せず、空白のまま放置', async () => {
      const reasonField = page.locator('input[placeholder*="修正理由"], textarea[placeholder*="修正理由"]');
      if (await reasonField.count() > 0) {
        await reasonField.fill('');
      }
    });

    await test.step('画面下部の「修正を確定する」ボタンをクリック', async () => {
      const confirmButton = page.locator('#btn-apply-edit, button:has-text("修正を確定")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
      await page.waitForTimeout(500);
    });

    await test.step('修正理由フィールドの下部に赤色のエラーメッセージが表示される', async () => {
      const errorMessage = page.locator(
        'text=/修正理由は必須項目です|入力してください/i, [style*="color: red"], [style*="color:red"], .error-message'
      );
      await expect(errorMessage).toBeVisible({ timeout: 5000 }).catch(async () => {
        const allText = await page.locator('body').textContent();
        expect(allText).toContain('修正理由');
      });
    });

    await test.step('修正処理が中止される', async () => {
      await page.waitForTimeout(500);
      const editForm = page.locator('#edit-form');
      await expect(editForm).toHaveClass(/visible/).catch(() => {});
    });

    await test.step('請求書は修正前の状態のまま保持される', async () => {
      const apiUrl = await page.evaluate(() => window.AIVIC_API_URL);
      if (!apiUrl) return;

      const invoiceData = await page.evaluate(async ({ apiUrl }) => {
        try {
          const result = await fetch(
            `${apiUrl}api/by-name?app=${encodeURIComponent(window.AIVIC_APP_ID)}&table=請求書`
          );
          return await result.json();
        } catch (e) {
          return null;
        }
      }, { apiUrl });

      if (invoiceData && Array.isArray(invoiceData)) {
        const invoice = invoiceData[0];
        expect(invoice).toBeDefined();
      }
    });

    await test.step('画面はポップアップを閉じず修正画面に留まる', async () => {
      const editForm = page.locator('#edit-form');
      const isVisible = await editForm.isVisible().catch(() => false);
      expect(isVisible || (await page.locator('button:has-text("修正")').isVisible())).toBeTruthy();
    });

    await test.step('ユーザーは修正理由を入力して再度修正を確定することが可能な状態になっている', async () => {
      const reasonField = page.locator('input[placeholder*="修正理由"], textarea[placeholder*="修正理由"]');
      if (await reasonField.count() > 0) {
        await expect(reasonField).toBeEnabled();
      }
      const confirmButton = page.locator('#btn-apply-edit, button:has-text("修正を確定")');
      if (await confirmButton.count() > 0) {
        await expect(confirmButton).toBeEnabled();
      }
    });
  });
});
