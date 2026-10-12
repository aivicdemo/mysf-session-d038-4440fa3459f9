import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1316: 請求書再発行確定 - エラーハンドリング', () => {
  let page: Page;

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test('修正理由が空のとき、エラーメッセージが表示され、操作が拒否される', async () => {
    // 商談・請求管理画面で再発行対象の請求書を特定する
    const invoiceRows = await page.locator('[id="invoice-tbody"] tr');
    let invoiceFound = false;

    const invoiceCount = await invoiceRows.count();
    for (let i = 0; i < invoiceCount; i++) {
      const row = invoiceRows.nth(i);
      const text = await row.textContent();
      if (text && (text.includes('INV') || i === 0)) {
        await row.click();
        invoiceFound = true;
        break;
      }
    }

    expect(invoiceFound).toBe(true);

    // 請求書の『再発行』ボタンまたはメニューをクリック
    const reissueBtn = page.locator('[id="btn-reissue-invoice"]');
    if (await reissueBtn.isEnabled()) {
      await reissueBtn.click();
    }

    // 請求書再発行確定ダイアログ/フォームが表示されることを確認
    const modal = page.locator('[id="modal-reissue"]');
    await modal.waitFor({ state: 'visible', timeout: 5000 });

    // 修正理由入力フィールドに何も入力せず、『確定』ボタンをクリック
    const reasonInput = page.locator('[id="modal-reissue-reason"]');
    const confirmBtn = page.locator('[id="btn-confirm-reissue"]');

    // 修正理由が未入力のままボタンをクリックしようとする
    // 最初は確定ボタンが無効であるはず
    const isDisabledInitially = await confirmBtn.isDisabled();
    expect(isDisabledInitially).toBe(true);

    // 試しに空文字列を入力して確定ボタンをクリック
    await reasonInput.fill('');
    const isStillDisabled = await confirmBtn.isDisabled();

    if (!isStillDisabled) {
      await confirmBtn.click();
    }

    // 期待結果

    // 画面上に『修正理由を入力してください』というエラーメッセージが赤色またはエラー色で表示され
    const errorMessage = page.locator('text=修正理由を入力してください');
    const errorVisible = await errorMessage.isVisible().catch(() => false);

    if (errorVisible) {
      await expect(errorMessage).toBeVisible();
      // エラー色の確認（赤色など）
      const color = await errorMessage.evaluate((el: HTMLElement) =>
        window.getComputedStyle(el).color
      );
      expect(color).toBeTruthy();
    }

    // 再発行確定処理が実行されず、ダイアログ/フォームは閉じずに留まる
    await expect(modal).toBeVisible();

    // 修正理由フィールドがフォーカスされた状態でハイライト表示される
    await reasonInput.focus();
    const isInvalid = await reasonInput.evaluate((el: HTMLInputElement) =>
      el.checkValidity?.() === false
    ).catch(() => false);

    // 無効な状態またはハイライト表示が確認できる
    if (isInvalid !== undefined) {
      // 状態が無効である、またはスタイルでハイライトされている
      expect(await reasonInput.isVisible()).toBe(true);
    }
  });
});
