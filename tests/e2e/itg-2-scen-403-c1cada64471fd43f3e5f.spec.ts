import { test, expect } from '@playwright/test';

test('SCEN-403: 機能マッピング表生成 - 移行対象システムの標準機能仕様が提供されていなければエラー', async ({ page }) => {
  // 機能マッピング管理画面にアクセスする
  await page.goto('/panels/scr-1791354749663.html');
  await page.waitForLoadState('networkidle');

  // Salesforce側のカスタムオブジェクト定義（請求書・請求明細）が正常に読み込まれていることを確認する
  const sfMetadataSection = page.locator('[data-testid="sf-metadata-section"]');
  await expect(sfMetadataSection).toBeVisible();

  // 画面上の「機能マッピング表を生成」または「マッピング検証を開始」ボタンをクリックする
  const generateButton = page.locator('[data-testid="generate-mapping-button"]');
  await generateButton.click();

  // システムが移行対象システムの標準機能仕様の取得を試行する
  const statusMessage = page.locator('[data-testid="status-message"]');
  await expect(statusMessage).toBeVisible();

  // 移行対象システムの標準機能仕様が提供されていない場合、エラーメッセージが表示される
  const errorDialogOrAlert = page.locator('[data-testid="error-message"]');
  await expect(errorDialogOrAlert).toBeVisible();

  // エラーメッセージに指定内容が含まれる
  const errorText = await errorDialogOrAlert.textContent();
  expect(errorText).toContain('移行対象システムの標準機能・API仕様が未確認です');
  expect(errorText).toContain('パートナーから仕様書を取得してください');

  // 機能マッピング表の生成処理は進行しない
  const mappingResultSection = page.locator('[data-testid="mapping-result-section"]');
  await expect(mappingResultSection).not.toBeVisible();

  // ボタンは無効化されるか、ダイアログが表示されて工程が中止される
  const generateButtonFinal = page.locator('[data-testid="generate-mapping-button"]');
  const isDisabledOrClosed = await generateButtonFinal.isDisabled();
  const isErrorVisible = await errorDialogOrAlert.isVisible();

  expect(isDisabledOrClosed || isErrorVisible).toBe(true);
});
