import { test, expect } from '@playwright/test';

test('SCEN-398: 機能マッピング表生成 - Salesforceのカスタムオブジェクト定義が完全なら検証に合格する', async ({ page }) => {
  // 機能マッピング管理画面にアクセスする
  await page.goto('/panels/scr-1791354749663.html');
  await page.waitForLoadState('networkidle');

  // マッピング表の「Salesforce側」セクションに請求書カスタムオブジェクトのフィールド定義が表示されていることを確認
  const sfSectionTitle = page.locator('[data-testid="sf-section-title"]');
  await expect(sfSectionTitle).toContainText('Salesforce側');

  const sfFieldsContainer = page.locator('[data-testid="sf-fields-container"]');
  await expect(sfFieldsContainer).toBeVisible();

  // マッピング表の「移行対象側」セクションに移行対象システムのスキーマが表示されていることを確認
  const targetSectionTitle = page.locator('[data-testid="target-section-title"]');
  await expect(targetSectionTitle).toContainText('移行対象側');

  const targetFieldsContainer = page.locator('[data-testid="target-fields-container"]');
  await expect(targetFieldsContainer).toBeVisible();

  // 画面上の「マッピング検証実行」ボタンを操作する
  const validateButton = page.locator('[data-testid="validate-mapping-button"]');
  await expect(validateButton).toBeVisible();
  await validateButton.click();

  // 検証プロセスが完了するまで待機
  const validationResultDialog = page.locator('[data-testid="validation-result-dialog"]');
  await expect(validationResultDialog).toBeVisible({ timeout: 30000 });

  // 検証結果ダイアログに「マッピング検証：合格」ステータスが表示される
  const statusMessage = page.locator('[data-testid="validation-status-message"]');
  await expect(statusMessage).toContainText('マッピング検証：合格');

  // Salesforce側フィールド全件とターゲットシステム側フィールド全件がマッピングされている旨が表示される
  const fieldMappingStatus = page.locator('[data-testid="field-mapping-status"]');
  await expect(fieldMappingStatus).toBeVisible();

  // 計算ロジック・参照関係の依存関係が全件解決されていることが表示される
  const dependencyStatus = page.locator('[data-testid="dependency-resolution-status"]');
  await expect(dependencyStatus).toBeVisible();

  // 検証完了時刻がタイムスタンプで表示される
  const completionTimestamp = page.locator('[data-testid="validation-completion-timestamp"]');
  await expect(completionTimestamp).toBeVisible();
  const timestamp = await completionTimestamp.textContent();
  expect(timestamp).toMatch(/\d{4}-\d{2}-\d{2}/);

  // 「次工程へ進むボタン」が活性化（クリック可能状態）で表示される
  const nextPhaseButton = page.locator('[data-testid="next-phase-button"]');
  await expect(nextPhaseButton).toBeVisible();
  await expect(nextPhaseButton).toBeEnabled();

  // ボタンクリックで移行プロジェクトの次フェーズ画面への遷移が成立することを確認
  const initialUrl = page.url();
  await nextPhaseButton.click();
  await page.waitForNavigation();
  const newUrl = page.url();
  expect(newUrl).not.toEqual(initialUrl);
});
