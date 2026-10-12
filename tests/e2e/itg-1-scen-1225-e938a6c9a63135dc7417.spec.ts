import { test, expect, Page } from '@playwright/test';

test.describe('請求書生成 - SCEN-1225 エラー系：必須フィールド不足', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('必須フィールドが不足している商談で生成を試行すると、フィールド検証で失敗し、不足フィールドを指摘するエラーメッセージを表示する', async () => {
    // 商談・請求管理画面にアクセス
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');

    // 必須フィールドが不足している商談レコードを検索・選択
    // (サンプルデータから「未定」ステータスや空フィールドを持つ商談を検索)
    const dealTable = page.locator('#deal-tbody');
    const dealRow = page.locator('tr[data-id*="rec-001"]').nth(1);
    await dealRow.click();

    // 商談詳細画面で、欠損している必須フィールドを確認
    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();
    const detailContent = await detailPanel.textContent();

    // 画面上の「請求書生成」ボタンをクリック
    const btnGenerate = page.locator('#btn-generate-invoice');
    await expect(btnGenerate).toBeVisible();
    await btnGenerate.click();

    // フィールド検証処理が実行され、結果を待つ
    await page.waitForTimeout(800);

    // エラーダイアログが表示される
    const errorDialog = page.locator('.modal-overlay:visible, [role="dialog"]:visible');
    await expect(errorDialog).toBeVisible({ timeout: 5000 });

    // ダイアログ内のタイトル「請求書生成失敗」を確認
    const dialogTitle = page.locator('.modal-overlay:visible h2, [role="dialog"]:visible h2');
    const titleText = await dialogTitle.textContent() || '';
    expect(titleText).toMatch(/請求書生成失敗|エラー/);

    // 各不足フィールドに対する具体的な指摘メッセージが表示される
    const dialogContent = await errorDialog.textContent() || '';
    expect(dialogContent).toMatch(/顧客|必須|入力してください/);

    // 「閉じる」または「編集画面へ」ボタンが表示される
    const closeBtn = page.locator('button:has-text("閉じる"), button:has-text("編集画面へ"), button:has-text("OK")');
    await expect(closeBtn).toBeVisible();

    // ボタンをクリック
    await closeBtn.click();

    // 請求書生成処理は開始されず、既存データは変更されない
    const detailPanelAfter = page.locator('#detail-panel');
    await expect(detailPanelAfter).toBeVisible();
  });
});
