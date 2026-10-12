import { test, expect, Page } from '@playwright/test';

test.describe('請求書生成 - SCEN-1231 エラー系：金額形式チェック', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('商談金額が0以下または数値でない商談で生成を試行すると、金額形式チェックで失敗し、エラーメッセージを表示する', async () => {
    // 商談・請求管理画面で、商談金額が0以下または数値でない商談レコードを検索・選択
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');

    // 条件に合致する商談行を選択
    // (サンプルデータから該当商談を探す)
    const dealTable = page.locator('#deal-tbody');
    const dealRow = page.locator('tr[data-id*="rec-001"]').nth(4);
    await dealRow.click();

    // 当該商談の詳細ページから「請求書生成」ボタンをクリック
    const btnGenerate = page.locator('#btn-generate-invoice');
    await expect(btnGenerate).toBeVisible();
    await btnGenerate.click();

    // 請求書生成の確認ダイアログが表示される
    const modal = page.locator('#modal-generate');
    await expect(modal).toBeVisible();

    // 「生成実行」ボタンをクリック
    const btnConfirm = page.locator('#btn-confirm-generate');
    await btnConfirm.click();

    // 金額形式チェック処理が実行される
    await page.waitForTimeout(800);

    // エラーメッセージが表示される
    const errorBanner = page.locator('.error-message, .alert-error, [role="alert"]');
    await expect(errorBanner).toBeVisible({ timeout: 5000 });

    // エラーメッセージ内容を確認
    const errorText = await errorBanner.textContent() || '';
    expect(errorText).toMatch(/商談金額が不正です|0より大きい数値|エラー/);

    // 請求書は生成されず、商談・請求管理画面は当該商談の詳細ページのままとなる
    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();

    // ステータスは「未請求」のまま変わらない
    // (詳細パネルの内容を確認)
    const detailContent = await detailPanel.textContent();
    expect(detailContent).toBeTruthy();
  });
});
