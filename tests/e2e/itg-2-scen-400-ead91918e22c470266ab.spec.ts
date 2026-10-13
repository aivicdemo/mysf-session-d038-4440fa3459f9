import { test, expect } from '@playwright/test';

test('SCEN-400: 機能マッピング表生成 - 計算ロジック定義が妥当なら検証に合格する', async ({ page }) => {
  // 機能マッピング管理画面を開く
  await page.goto('/panels/scr-1791354749663.html');
  await page.waitForLoadState('networkidle');

  // 画面の『マッピング検証開始』ボタンをクリック
  const validateButton = page.locator('[data-testid="validate-mapping-button"]');
  await validateButton.click();

  // 請求書・請求明細カスタムオブジェクトの計算ロジック定義が画面内の『Salesforceメタデータ』セクションに表示されることを確認
  const sfMetadataSection = page.locator('[data-testid="sf-metadata-section"]');
  await expect(sfMetadataSection).toBeVisible();

  const calculationLogicSF = page.locator('[data-testid="sf-calculation-logic"]');
  await expect(calculationLogicSF).toBeVisible();

  // 移行対象システム（Oracle）の標準請求機能の計算ロジック定義が『移行対象システム標準機能』セクションに表示されることを確認
  const targetStandardFeaturesSection = page.locator('[data-testid="target-standard-features-section"]');
  await expect(targetStandardFeaturesSection).toBeVisible();

  const calculationLogicTarget = page.locator('[data-testid="target-calculation-logic"]');
  await expect(calculationLogicTarget).toBeVisible();

  // システムが自動的に『計算ロジック妥当性検証』処理を実行し、検証結果を画面に表示するまで待機（最大30秒）
  const validationResultSection = page.locator('[data-testid="validation-result-section"]');
  await expect(validationResultSection).toBeVisible({ timeout: 30000 });

  // 検証結果セクションを確認し、『検証ステータス』項目の値を視認する
  const validationStatus = page.locator('[data-testid="validation-status"]');
  await expect(validationStatus).toBeVisible();

  // 検証ステータスが『合格（PASSED）』と表示される
  const statusText = await validationStatus.textContent();
  expect(statusText).toMatch(/合格|PASSED/);

  // 請求書小計の計算ロジックが移行対象システムの標準小計計算ロジックと『機能的に同等』と判定される
  const logicEquivalenceStatus = page.locator('[data-testid="logic-equivalence-status"]');
  await expect(logicEquivalenceStatus).toContainText('機能的に同等');

  // 検証結果詳細に『計算ロジック妥当性：OK』と記載される
  const detailedResult = page.locator('[data-testid="detailed-validation-result"]');
  await expect(detailedResult).toContainText('計算ロジック妥当性：OK');

  // 画面下部の『次工程へ進む』ボタンが有効化（クリック可能な状態）となる
  const nextPhaseButton = page.locator('[data-testid="next-phase-button"]');
  await expect(nextPhaseButton).toBeVisible();
  await expect(nextPhaseButton).toBeEnabled();

  // この状態でユーザーが『次工程へ進む』をクリックすると機能マッピング承認画面へ遷移する
  const currentPath = page.url();
  await nextPhaseButton.click();
  await page.waitForNavigation();
  const newPath = page.url();
  expect(newPath).not.toEqual(currentPath);
});
