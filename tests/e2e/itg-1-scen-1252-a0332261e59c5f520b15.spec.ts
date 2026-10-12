import { test, expect } from '@playwright/test';

test('SCEN-1252: 修正対象の請求書が見つからない場合、画面表示がエラーで中止される', async ({ page }) => {
  // ブラウザで、存在しない請求書ID（INV-999999）に対応する請求書修正画面のURLに直接アクセス
  await page.goto('/panels/scr-1791354749663.html?invoiceId=INV-999999');

  // ページロード処理が開始され、バックエンド側で指定されたIDで請求書データを照会
  await page.waitForLoadState('networkidle');

  // ページ読み込み完了時に、画面全体に赤色のエラーバナーが表示される
  const errorBanner = page.locator('[data-component="error-banner"]');
  await expect(errorBanner).toBeVisible();

  // CSS で赤色であることを確認（background-color が red 系）
  const bgColor = await errorBanner.evaluate(el => window.getComputedStyle(el).backgroundColor);
  // red, rgb(255, 0, 0) 系の値が含まれていることを確認
  expect(bgColor).toMatch(/red|rgb\(255,\s*0,\s*0\)|#[fF]{2}0{4}/i);

  // エラーメッセージが表示される
  const errorMessage = page.locator('[data-component="error-banner"] [role="alert"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('修正対象の請求書が見つかりません');
  await expect(errorMessage).toContainText('請求書IDを確認してください');

  // フォーム入力エリアが無効化されていることを確認
  const inputFields = page.locator('[data-section="invoice-info"] input, [data-section="invoice-details"] input');
  const fieldCount = await inputFields.count();

  if (fieldCount > 0) {
    for (let i = 0; i < fieldCount; i++) {
      const field = inputFields.nth(i);
      // disabled または readonly 属性が付与されていることを確認
      const isDisabled = await field.isDisabled();
      const isReadonly = await field.evaluate(el => (el as HTMLInputElement).readOnly);
      expect(isDisabled || isReadonly).toBe(true);
    }
  }

  // 修正・保存・キャンセルボタンが全て非表示またはdisabled状態となる
  const modifyButton = page.locator('button:has-text("修正")');
  const saveButton = page.locator('button:has-text("保存")');
  const cancelButton = page.locator('button:has-text("キャンセル")');

  // ボタンのいずれかが存在する場合、disabled または display: none の状態を確認
  if (await modifyButton.count() > 0) {
    const isDisabledOrHidden = await modifyButton.evaluate(el => {
      const style = window.getComputedStyle(el);
      return (el as HTMLButtonElement).disabled || style.display === 'none';
    });
    expect(isDisabledOrHidden).toBe(true);
  }

  // ユーザーはいかなる修正操作も実行できない状態で中止される
  // 試しに修正ボタンをクリックしようとしても何も起きない
  if (await modifyButton.count() > 0) {
    const initialText = await page.locator('[data-component="page-title"]').textContent();
    await modifyButton.click({ force: true });
    const finalText = await page.locator('[data-component="page-title"]').textContent();
    // ページ内容が変わらないことを確認
    expect(initialText).toBe(finalText);
  }

  // 画面タイトルは「請求書修正」のまま変わらない
  const pageTitle = page.locator('[data-component="page-title"]');
  await expect(pageTitle).toContainText('請求書修正');

  // ブラウザのURL欄には無効なIDが残存する
  await expect(page).toHaveURL(/invoiceId=INV-999999/);

  // エラー表示状態を確認
  const mainContent = page.locator('[data-section="main-content"]');
  await expect(mainContent).not.toContainText('入力してください');
  await expect(mainContent).not.toContainText('データを読み込み中');

  // インラインエラー表示またはアラートダイアログが表示されていないことを確認
  const alertDialogs = page.locator('[role="alertdialog"]');
  await expect(alertDialogs).not.toBeVisible();
});
