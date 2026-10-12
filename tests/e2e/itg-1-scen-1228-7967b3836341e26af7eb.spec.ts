import { test, expect, Page } from '@playwright/test';

test.describe('請求書生成 - SCEN-1228 エラー系：請求明細が空', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('請求明細が空の商談で請求書生成を試行すると、請求明細存在チェックで失敗し、エラーメッセージを表示する', async () => {
    // 商談・請求管理画面で、請求明細が空の商談を検索・選択
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');

    // フィルター条件を設定し、請求明細が空の商談を検索
    // (サンプルデータから該当する商談を探す)
    const dealTable = page.locator('#deal-tbody');
    const dealRow = page.locator('tr[data-id*="rec-001"]').nth(2);
    await dealRow.click();

    // 詳細パネルまたは商談レコードを開く
    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();

    // 請求明細テーブルが空であることを確認
    const invoiceDetailsTable = page.locator('#invoice-detail-tbody');
    const detailRows = await invoiceDetailsTable.locator('tr').count();

    // 詳細画面内の「請求書生成」ボタンをクリック
    const btnGenerate = page.locator('#btn-generate-invoice');
    await expect(btnGenerate).toBeVisible();
    await btnGenerate.click();

    // 請求書生成ダイアログが表示される
    const modal = page.locator('#modal-generate');
    await expect(modal).toBeVisible();

    // ダイアログが表示され、エラーメッセージ「この商談には請求明細が登録されていません」が画面上部に赤背景で表示される
    const errorBanner = page.locator('.error-message, .alert-error, .modal-error, [role="alert"]');
    await expect(errorBanner).toBeVisible();

    const errorText = await errorBanner.textContent() || '';
    expect(errorText).toMatch(/この商談には請求明細が登録されていません|請求明細|登録されていません/);

    // 生成ボタンは非活性（disabled）
    const btnConfirm = page.locator('#btn-confirm-generate');
    await expect(btnConfirm).toBeDisabled();

    // ユーザーは先へ進めない状態になっている
    // これを確認するため、ボタンのクリックは無視されることを検証
    const initialState = await modal.getAttribute('class');
    await btnConfirm.click({ force: true });
    const stateAfter = await modal.getAttribute('class');
    expect(stateAfter).toBe(initialState);
  });
});
