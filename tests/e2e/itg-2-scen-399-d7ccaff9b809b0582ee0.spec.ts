import { test, expect } from '@playwright/test';

test('SCEN-399: 機能マッピング表生成 - Salesforceのカスタムオブジェクト定義が空または不完全な場合エラー', async ({ page }) => {
  // 機能マッピング管理画面上の『マッピング表生成』ボタンをクリックする
  await page.goto('/panels/scr-1791354749663.html');
  await page.waitForLoadState('networkidle');

  const generateButton = page.locator('[data-testid="generate-mapping-button"]');
  await generateButton.click();

  // システムが機能マッピング表の生成処理を開始し、Salesforceカスタムオブジェクト定義の取得・検証を実行する
  const statusMessage = page.locator('[data-testid="status-message"]');
  await expect(statusMessage).toBeVisible();

  // 呼び出し窓口SalesforceMetadataApiConnectorの fetchCustomObjectDefinitions経由で
  // 請求書・請求明細オブジェクトの構造定義の取得を試みる
  await page.waitForTimeout(1000);

  // 取得結果が空または不完全であることが検出される場合
  // 画面上にエラーメッセージが表示される
  const errorMessage = page.locator('[data-testid="error-message"]');
  await expect(errorMessage).toBeVisible();

  // エラーメッセージが『Salesforceの請求書・請求明細オブジェクトの構造が未入力です。先に文書化を完了してください』を含む
  const errorText = await errorMessage.textContent();
  expect(errorText).toContain('Salesforceの請求書・請求明細オブジェクトの構造が未入力です');
  expect(errorText).toContain('先に文書化を完了してください');

  // マッピング表の生成処理は中断される
  const mappingResultSection = page.locator('[data-testid="mapping-result-section"]');
  await expect(mappingResultSection).not.toBeVisible();

  // 生成ボタンは押下前の状態に戻る
  await expect(generateButton).toBeEnabled();

  // ユーザーは別の操作を行うことができる
  const filterCustomerInput = page.locator('[data-testid="filter-customer"]');
  await expect(filterCustomerInput).toBeEnabled();
});
