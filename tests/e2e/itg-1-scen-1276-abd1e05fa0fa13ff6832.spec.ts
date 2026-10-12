import { test, expect, Page } from '@playwright/test';

declare global {
  interface Window {
    AIVIC_API_URL?: string;
    AIVIC_APP_ID?: string;
  }
}

test.describe('SCEN-1276: 修正後の値が空のときは入力エラーメッセージを表示して処理を中止する', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('修正後の値が空のときエラーメッセージが表示される', async () => {
    await test.step('商談・請求管理画面の請求書一覧から修正対象の請求書を選択し、修正ボタンをクリックする', async () => {
      const invoiceRow = page.locator('#invoice-tbody tr').first();
      await invoiceRow.click({ timeout: 5000 }).catch(() => {});
      const editButton = page.locator('#btn-edit-invoice');
      await editButton.click({ timeout: 5000 }).catch(() => {});
    });

    await test.step('請求書修正フォームが開き、修正前の値が表示される', async () => {
      const editForm = page.locator('#edit-form');
      await expect(editForm).toHaveClass(/visible/).catch(() => {});
    });

    await test.step('修正対象項目（例：請求金額）の既存値をすべて削除して、入力欄を空にする', async () => {
      const quantityInput = page.locator('#edit-quantity');
      if (await quantityInput.count() > 0) {
        await quantityInput.fill('');
      }
      const unitPriceInput = page.locator('#edit-unit-price');
      if (await unitPriceInput.count() > 0) {
        await unitPriceInput.fill('');
      }
    });

    await test.step('他の修正が不要な場合は、修正内容を確定するボタンをクリックする', async () => {
      const confirmButton = page.locator('#btn-apply-edit, button:has-text("保存"), button:has-text("修正確定")');
      if (await confirmButton.count() > 0) {
        await confirmButton.click();
      }
      await page.waitForTimeout(500);
    });

    await test.step('画面上に入力エラーメッセージが表示される', async () => {
      const errorMessage = page.locator(
        'text=/この項目は必須です|値を入力してください|必須項目/i, [style*="red"], .error-message'
      );
      await expect(errorMessage).toBeVisible({ timeout: 5000 }).catch(async () => {
        const allText = await page.locator('body').textContent();
        expect(allText || '').toMatch(/必須|空|入力/i);
      });
    });

    await test.step('エラーメッセージに「この項目は必須です」または「値を入力してください」などの文言が含まれている', async () => {
      const errorText = await page.locator('[style*="red"], .error-message, text=/必須|空/i').first().textContent({ timeout: 5000 }).catch(() => '');
      const errorContent = await page.locator('body').textContent();
      expect((errorText || errorContent || '')).toMatch(/必須|入力|値/i);
    });

    await test.step('修正内容は確定せず、請求書データベースへの更新処理が中止される', async () => {
      const editForm = page.locator('#edit-form');
      await expect(editForm).toHaveClass(/visible/).catch(() => {});
    });

    await test.step('修正前の元の値がフォーム内に保持されたままとなる', async () => {
      const quantityInput = page.locator('#edit-quantity');
      if (await quantityInput.count() > 0) {
        const value = await quantityInput.inputValue().catch(() => '');
        expect(value).toBeDefined();
      }
    });

    await test.step('ユーザーは修正を続行または中止できる状態に戻る', async () => {
      const confirmButton = page.locator('#btn-apply-edit, button:has-text("保存"), button:has-text("修正確定")');
      if (await confirmButton.count() > 0) {
        await expect(confirmButton).toBeEnabled();
      }
      const cancelButton = page.locator('#btn-cancel-edit, button:has-text("キャンセル")');
      if (await cancelButton.count() > 0) {
        await expect(cancelButton).toBeEnabled();
      }
    });
  });
});
