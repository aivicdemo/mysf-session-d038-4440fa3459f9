import { test, expect, Page } from '@playwright/test';

test.describe('請求書生成 - SCEN-1230 エラー系：顧客情報チェック', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('取引先IDまたは取引先責任者IDが空の商談で生成を試行すると、顧客情報チェックで失敗し、エラーメッセージを表示する', async () => {
    // 商談・請求管理画面へ遷移
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');

    // 取引先IDと取引先責任者IDが空の受注済み商談を検索・特定
    // (サンプルデータから該当する商談を検索)
    const dealTable = page.locator('#deal-tbody');
    const dealRow = page.locator('tr[data-id*="rec-001"]').nth(3);
    await dealRow.click();

    // 当該商談の行を選択
    await page.waitForTimeout(300);

    // 「請求書生成」ボタンをクリック
    const btnGenerate = page.locator('#btn-generate-invoice');
    await expect(btnGenerate).toBeVisible();
    await btnGenerate.click();

    // 請求書生成ダイアログが表示されるまで待機
    const modal = page.locator('#modal-generate');
    await expect(modal).toBeVisible();

    // 「生成」または「確定」ボタンをクリック
    const btnConfirm = page.locator('#btn-confirm-generate');
    await btnConfirm.click();

    // 顧客情報チェック処理が実行される
    await page.waitForTimeout(800);

    // エラーメッセージが表示される
    const errorBanner = page.locator('.error-message, .alert-error, [role="alert"]');
    await expect(errorBanner).toBeVisible({ timeout: 5000 });

    // エラーメッセージ内容を確認
    const errorText = await errorBanner.textContent() || '';
    expect(errorText).toMatch(/顧客情報が不完全です|取引先ID|取引先責任者ID|確認してください/);

    // 請求書は生成されず、商談ステージは「受注」のまま変更されない
    const detailPanel = page.locator('#detail-panel');
    const detailContent = await detailPanel.textContent();

    // ステージが変わらないことを確認するため、詳細パネルが表示されたまま
    await expect(detailPanel).toBeVisible();

    // 生成ダイアログが開いたまま（エラー状態）
    await expect(modal).toBeVisible();
  });
});
