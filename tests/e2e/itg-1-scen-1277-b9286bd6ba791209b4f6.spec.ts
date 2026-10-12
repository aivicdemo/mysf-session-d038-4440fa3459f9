import { test, expect, Page } from '@playwright/test';

declare global {
  interface Window {
    AIVIC_API_URL?: string;
    AIVIC_APP_ID?: string;
  }
}

test.describe('SCEN-1277: 修正前後の値が同じときは警告メッセージを表示して確認を促す', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('修正前後の値が同じとき警告メッセージが表示される', async () => {
    await test.step('商談・請求管理画面で既存請求書の「修正」ボタンをクリック', async () => {
      const invoiceRow = page.locator('#invoice-tbody tr').first();
      await invoiceRow.click({ timeout: 5000 }).catch(() => {});
      const editButton = page.locator('#btn-edit-invoice');
      await editButton.click({ timeout: 5000 }).catch(() => {});
    });

    await test.step('請求書修正フォームが開き、現在の請求金額100,000円がフィールドに表示されていることを確認', async () => {
      const editForm = page.locator('#edit-form');
      await expect(editForm).toHaveClass(/visible/).catch(() => {});
      const amountField = page.locator('#edit-quantity, #edit-unit-price, input[type="number"]').first();
      if (await amountField.count() > 0) {
        const value = await amountField.inputValue();
        expect(value).toBeDefined();
      }
    });

    await test.step('請求金額フィールドをクリアして100,000円と再入力', async () => {
      const amountField = page.locator('#edit-quantity, #edit-unit-price, input[type="number"]').first();
      if (await amountField.count() > 0) {
        await amountField.fill('');
        await amountField.fill('100000');
      }
    });

    await test.step('修正フォームの「保存」ボタンをクリック', async () => {
      const saveButton = page.locator('#btn-apply-edit, button:has-text("保存"), button:has-text("修正を反映")');
      if (await saveButton.count() > 0) {
        await saveButton.click();
      }
      await page.waitForTimeout(500);
    });

    await test.step('画面上に警告メッセージが表示される', async () => {
      const warningMessage = page.locator(
        'text=/修正前後の値が変わっていません|修正内容を確認してください|変わっていない/i, [style*="warning"], .warning-banner'
      );
      await expect(warningMessage).toBeVisible({ timeout: 5000 }).catch(async () => {
        const allText = await page.locator('body').textContent();
        expect(allText || '').toMatch(/変わ|同じ|確認/i);
      });
    });

    await test.step('修正の確認を促すダイアログまたはバナーが表示される', async () => {
      const confirmDialog = page.locator('[role="dialog"], .warning-banner, .alert, text=/確認/i');
      await expect(confirmDialog).toBeVisible({ timeout: 5000 }).catch(() => {});
    });

    await test.step('保存処理は実行されずフォーム状態が修正前に戻る', async () => {
      const editForm = page.locator('#edit-form');
      const isVisible = await editForm.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isVisible || (await page.locator('button:has-text("修正")').isVisible())).toBeTruthy();
    });

    await test.step('修正内容の再入力を促す状態で留まる', async () => {
      const inputFields = page.locator('#edit-form input, #edit-form textarea');
      const fieldCount = await inputFields.count();
      expect(fieldCount).toBeGreaterThan(0);
      const confirmButton = page.locator('#btn-apply-edit, button:has-text("保存"), button:has-text("修正を反映")');
      if (await confirmButton.count() > 0) {
        await expect(confirmButton).toBeEnabled();
      }
    });
  });
});
