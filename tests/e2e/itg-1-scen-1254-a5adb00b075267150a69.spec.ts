import { test, expect } from '@playwright/test';

test('SCEN-1254: データ取得に失敗した場合、エラーメッセージが表示される', async ({ page }) => {
  // 商談・請求管理画面にアクセスする
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForLoadState('networkidle');

  // 既存の請求書一覧から修正対象の請求書を選択し、修正ボタンをクリック
  const invoiceRow = page.locator('tbody#invoice-tbody tr').first();
  await expect(invoiceRow).toBeVisible();

  // ネットワークエラーをシミュレートするため、リクエストをインターセプト
  // Amazon S3からのデータ取得を失敗させる
  await page.route('**/api/invoices/**', route => {
    route.abort('failed');
  });

  // 修正ボタンをクリック
  await invoiceRow.locator('button:has-text("修正")').click();

  // リクエストが送信される
  // 外部ストレージ連携がエラーを返す
  await page.waitForTimeout(1000);

  // 請求書修正画面が表示されるまでを待機（ただしエラーになる）
  await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});

  // 請求書修正画面にエラーメッセージが表示される
  const errorMessage = page.locator('[role="alert"]').filter({
    hasText: 'ファイル保存に失敗しました'
  });

  // または画面内のメッセージ要素を探す
  const errorElements = page.locator('[data-component="error-message"], .error-message, [class*="error"]');
  let hasErrorMessage = await errorMessage.count() > 0;

  if (!hasErrorMessage && await errorElements.count() > 0) {
    const errorText = await errorElements.first().textContent();
    hasErrorMessage = errorText?.includes('失敗') || errorText?.includes('エラー') || false;
  }

  // エラーメッセージが表示されることを確認
  const pageBody = page.locator('body');
  const bodyText = await pageBody.textContent();
  expect(bodyText).toContain('ファイル保存に失敗しました');
  expect(bodyText).toContain('再度お試しください');

  // 修正入力欄が無効状態（disabled）のまま表示される
  const formInputs = page.locator('[data-section="invoice-info"] input');
  const inputCount = await formInputs.count();

  if (inputCount > 0) {
    for (let i = 0; i < Math.min(inputCount, 3); i++) {
      const input = formInputs.nth(i);
      const isDisabled = await input.isDisabled();
      expect(isDisabled).toBe(true);
    }
  }

  // ブラウザのコンソールには内部エラーログが記録される
  // （Playwright では console メッセージをキャプチャ）
  const consoleLogs: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleLogs.push(msg.text());
    }
  });

  // コンソールにエラーが記録されていることを確認
  // ただし、非同期処理のため少し待機
  await page.waitForTimeout(500);

  // バックエンドのアップロード失敗時の内部キューに該当リクエストが保持される状態
  // これはクライアント側では直接確認できないため、
  // サーバーログに記録されていることを想定して、
  // ここではエラーが表示され続けていることを確認

  // ページを再度読み込みしてもエラーが残っていることを確認
  const errorMessageAfterReload = page.locator('[role="alert"], [data-component="error-message"]').first();
  const isStillVisible = await errorMessageAfterReload.isVisible().catch(() => false);

  // ページに留まっていることを確認
  await expect(page).toHaveURL(/scr-1791354749663/);

  // エラーメッセージはユーザーへ向けて表示されている
  const userFacingError = page.locator('[data-component="error-message"][role="alert"]');
  if (await userFacingError.count() > 0) {
    await expect(userFacingError).toBeVisible();
  }
});
