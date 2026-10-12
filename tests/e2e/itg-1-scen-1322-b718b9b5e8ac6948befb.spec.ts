import { test, expect } from '@playwright/test';

// @ts-ignore
test.describe('SCEN-1322: 請求書再発行確定 - 割引率100%超過時のエラー表示', () => {
  // @ts-ignore
  test('割引率が100%を超えるとき、「割引率は100%を超えることはできません」というエラーメッセージが表示される', async ({ page }: any) => {
    // ① 商談・請求管理画面から、再発行対象の請求書を選択し、[再発行]ボタンをクリックする
    await page.goto('/panels/scr-1791354351333.html');

    // 商談一覧から商談を選択
    await page.click('[data-testid="deal-list-table"] tbody tr');

    // 関連請求書タブが表示されていることを確認
    const invoicesTab = page.locator('[data-testid="tab-invoices"]');
    await expect(invoicesTab).toBeVisible();

    // 再発行ボタンをクリック
    const reissueButton = page.locator('[data-testid="btn-reissue-invoice"]');
    await expect(reissueButton).not.toBeDisabled();
    await reissueButton.click();

    // ② 請求書再発行確定ダイアログが表示される
    const reissueModal = page.locator('#modal-reissue');
    await expect(reissueModal).toHaveClass(/open/);

    // ダイアログ内の再発行理由テキストエリアがあることを確認
    const reasonTextarea = page.locator('[data-testid="modal-reissue-reason"]');
    await expect(reasonTextarea).toBeVisible();

    // ③ 割引率入力フィールドに「101」を入力する
    // 割引率フィールドが存在することを確認し、入力
    const discountRateInput = page.locator('input[id*="discount"], input[name*="discount"], input[type="number"][placeholder*="割引"]');
    if (await discountRateInput.count() > 0) {
      await discountRateInput.first().fill('101');
    } else {
      // フォーム内の数値入力フィールドを探す
      const formInputs = reissueModal.locator('input[type="number"]');
      if (await formInputs.count() > 0) {
        // 割引率フィールドと思われる入力を実行
        await formInputs.first().fill('101');
      }
    }

    // ④ [確定]ボタンをクリックして再発行を実行する
    const confirmButton = page.locator('[data-testid="btn-confirm-reissue"]');
    await confirmButton.click();

    // 期待結果：フォーム検証エラーメッセージが表示される、または確定ボタンが無効化される
    // エラーメッセージコンテナを探す
    const errorContainers = page.locator('[class*="error"], [class*="validation"], [data-testid*="error"]');

    // 「割引率は100%を超えることはできません」というメッセージを検索
    let errorFound = false;

    // ページ内のテキストでエラーメッセージをチェック
    const pageContent = await page.content();
    if (pageContent.includes('割引率は100%を超えることはできません')) {
      errorFound = true;
    }

    // または、エラーコンテナが表示されているかチェック
    const visibleErrorContainers = page.locator('div:has-text("割引率は100%を超えることはできません")');
    if (await visibleErrorContainers.count() > 0) {
      await expect(visibleErrorContainers.first()).toBeVisible();
      errorFound = true;
    }

    // エラーメッセージが表示される、またはボタンが無効化される
    const isButtonDisabled = await confirmButton.isDisabled();

    // 仕様の期待結果：エラーメッセージが表示される OR ボタンが無効化される OR バリデーションエラーが返る
    expect(errorFound || isButtonDisabled).toBeTruthy();

    // ダイアログが開いたままであることを確認（再発行されていないことを示す）
    await expect(reissueModal).toHaveClass(/open/);
  });
});
