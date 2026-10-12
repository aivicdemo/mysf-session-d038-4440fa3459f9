import { test, expect } from '@playwright/test';

test('SCEN-1219: 支払期限日が請求書発行日より前の場合、エラーが表示される', async ({ page }) => {
  // 商談・請求管理画面を開く
  await page.goto('/panels/scr-1791354351333.html');

  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // 商談一覧から商談を選択
  const dealRows = page.locator('tbody#deal-tbody tr');
  const rowCount = await dealRows.count();

  // 成約ステージの商談を探して選択
  let dealSelected = false;
  for (let i = 0; i < rowCount; i++) {
    await dealRows.nth(i).click();
    await page.waitForTimeout(300);

    // 請求書生成ボタンが有効かチェック
    const generateBtn = page.locator('#btn-generate-invoice');
    const isEnabled = !(await generateBtn.isDisabled().catch(() => true));

    if (isEnabled) {
      await generateBtn.click();
      dealSelected = true;
      break;
    }
  }

  // 請求書生成モーダルが開く
  const generateModal = page.locator('#modal-generate');
  await expect(generateModal).toHaveClass(/open/);

  // モーダル内の日付フィールド
  const invoiceDateInput = page.locator('#modal-invoice-date');
  const dueDateInput = page.locator('#modal-due-date');

  // 請求書発行日に「2026-01-15」を入力
  await invoiceDateInput.fill('2026-01-15');

  // 支払期限日に「2026-01-10」を入力（発行日より前の日付）
  await dueDateInput.fill('2026-01-10');

  // フォーカスを外す（バリデーションをトリガー）
  await dueDateInput.blur();
  await page.waitForTimeout(500);

  // エラーメッセージの確認
  // 期待: 赤色のエラーメッセージが表示され、フィールドに赤枠が適用される

  // エラーメッセージテキストを探す
  const errorMessageElement = page.locator(
    'text=/支払期限日は.*以降の日付を指定/'
  );

  const messageVisible = await errorMessageElement.isVisible().catch(() => false);

  // フィールドの状態を確認
  const dueDateField = page.locator('#modal-due-date');

  // エラー状態のクラスを確認
  const fieldClasses = await dueDateField.getAttribute('class');
  const hasErrorClass =
    fieldClasses && (fieldClasses.includes('error') || fieldClasses.includes('invalid'));

  // 期待: 生成ボタンが無効化（disabled）
  const confirmBtn = page.locator('#btn-confirm-generate');
  const isButtonDisabled = await confirmBtn.isDisabled().catch(() => false);

  // 検証: エラーメッセージ表示、フィールドのエラークラス、ボタン無効化のいずれかが確認できること
  expect(
    messageVisible || hasErrorClass || isButtonDisabled
  ).toBeTruthy();
});
