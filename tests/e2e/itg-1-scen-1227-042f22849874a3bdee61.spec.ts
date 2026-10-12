import { test, expect, Page } from '@playwright/test';

test.describe('請求書生成 - SCEN-1227 エラー系：割引率上限チェック', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('割引率が100%を超える請求明細で検証を実行すると、割引率上限チェックで失敗し、エラーメッセージを表示する', async () => {
    // 商談・請求管理画面にて、請求明細を表示
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');

    // 商談を選択
    const dealRow = page.locator('tr[data-id*="rec-001"]').first();
    await dealRow.click();

    // 割引率105%の請求明細の内容を画面で確認
    // (事前準備として、割引率105%の明細を作成またはモック)
    const invoiceDetailsTable = page.locator('#invoice-detail-tbody');
    await expect(invoiceDetailsTable).toBeVisible();

    // 請求書生成ボタン（または検証ボタン）をクリック
    const btnGenerate = page.locator('#btn-generate-invoice');
    await btnGenerate.click();

    // モーダルが表示される
    const modal = page.locator('#modal-generate');
    await expect(modal).toBeVisible();

    // 割引率フィールドを検索し、105%を入力
    const discountInput = page.locator('input[name*="discount"], input[placeholder*="割引"]');
    if (await discountInput.count() > 0) {
      await discountInput.first().fill('105');
    }

    // 「検証」または「生成」ボタンをクリック
    const btnConfirm = page.locator('#btn-confirm-generate, button:has-text("検証")');
    await btnConfirm.click();

    // 画面がエラー検証結果を表示するまで待機
    await page.waitForTimeout(800);

    // 画面上に赤背景またはエラーアイコン付きのエラーメッセージが表示される
    const errorMessage = page.locator('.error-message, .alert-error, [role="alert"]');
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // エラーメッセージ内容を確認
    const errorText = await errorMessage.textContent() || '';
    expect(errorText).toMatch(/割引率は100%以下|割引率|105%/);

    // 請求書生成が中断し、商談・請求明細の状態は変更されない
    // ユーザーは当該請求明細行に対して割引率の修正入力を促される
    const discountField = page.locator('input[name*="discount"]');
    if (await discountField.count() > 0) {
      const value = await discountField.first().inputValue();
      expect(value).toBe('105');
    }
  });
});
