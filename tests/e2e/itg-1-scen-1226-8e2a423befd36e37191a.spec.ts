import { test, expect, Page } from '@playwright/test';

test.describe('請求書生成 - SCEN-1226 エラー系：負の値チェック', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('単価・数量・割引率・税率のいずれかが負の値を含む請求明細で検証を実行すると、負の値チェックで失敗し、エラーメッセージを表示する', async () => {
    // 商談・請求管理画面で対象商談を選択
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');

    // 商談を選択
    const dealRow = page.locator('tr[data-id*="rec-001"]').first();
    await dealRow.click();

    // 請求書生成画面が開く（ボタンクリック）
    const btnGenerate = page.locator('#btn-generate-invoice');
    await expect(btnGenerate).toBeVisible();
    await btnGenerate.click();

    // モーダルが表示される
    const modal = page.locator('#modal-generate');
    await expect(modal).toBeVisible();

    // 請求明細入力エリアが表示されたことを確認
    // 以下の操作は、モーダルに請求明細入力フィールドがある場合を想定
    const unitPriceInput = page.locator('input[name*="unitPrice"], input[placeholder*="単価"]');
    const quantityInput = page.locator('input[name*="quantity"], input[placeholder*="数量"]');
    const discountInput = page.locator('input[name*="discount"], input[placeholder*="割引"]');
    const taxRateInput = page.locator('input[name*="taxRate"], input[placeholder*="税率"]');

    // 請求明細の1行目「単価」フィールドに「-100」を入力
    if (await unitPriceInput.count() > 0) {
      await unitPriceInput.first().fill('-100');
    }

    // 「数量」フィールドに「5」を入力
    if (await quantityInput.count() > 0) {
      await quantityInput.first().fill('5');
    }

    // 「割引率」フィールドに「10」を入力
    if (await discountInput.count() > 0) {
      await discountInput.first().fill('10');
    }

    // 「税率」フィールドに「10」を入力
    if (await taxRateInput.count() > 0) {
      await taxRateInput.first().fill('10');
    }

    // 画面下部の「請求書生成・検証」ボタンをクリック
    const btnValidate = page.locator('button:has-text("請求書生成"), button:has-text("検証"), #btn-confirm-generate');
    await btnValidate.click();

    // 請求明細の負の値チェックが実行される
    await page.waitForTimeout(800);

    // 画面上に赤色のエラーバナーが表示される
    const errorBanner = page.locator('.error-message, .alert-error, [role="alert"]');
    await expect(errorBanner).toBeVisible({ timeout: 5000 });

    // エラーメッセージ「単価は0より大きい値を入力してください」が表示される
    const errorText = await errorBanner.textContent() || '';
    expect(errorText).toMatch(/単価は0より大きい値|負|不正/);

    // 請求書の生成処理が中断される
    // 入力した請求明細データは画面に保持されたまま表示される
    if (await unitPriceInput.count() > 0) {
      const inputValue = await unitPriceInput.first().inputValue();
      expect(inputValue).toBe('-100');
    }
  });
});
