import { test, expect } from '@playwright/test';

test('SCEN-402: 機能マッピング表生成 - 移行対象システムの標準機能マッピング情報が完全なら検証に合格する', async ({ page }) => {
  // 機能マッピング管理画面で、右上の『検証実行』ボタンをクリックする
  await page.goto('/panels/scr-1791354749663.html');
  await page.waitForLoadState('networkidle');

  const validateButton = page.locator('[data-testid="validate-execution-button"]');
  await validateButton.click();

  // 検証処理が実行される。登録済みのマッピング情報と取得済みメタデータを照合し、
  // 検証ロジックがマッピングの完全性を評価する
  const validationProcessing = page.locator('[data-testid="validation-processing"]');
  await expect(validationProcessing).toBeVisible();

  // 検証結果が画面に表示される
  const validationResultPanel = page.locator('[data-testid="validation-result-panel"]');
  await expect(validationResultPanel).toBeVisible({ timeout: 30000 });

  // 検証結果画面に『検証ステータス：合格』が緑色で表示される
  const statusBadge = page.locator('[data-testid="validation-status-badge"]');
  await expect(statusBadge).toContainText('合格');

  const statusBadgeColor = await statusBadge.evaluate(el => window.getComputedStyle(el).color);
  expect(statusBadgeColor).toMatch(/green|rgb\(\s*0\s*,\s*[0-9]{1,3}\s*,\s*0\s*\)/i);

  // 『全フィールドマッピング完了：Salesforce請求書 14/14 フィールド、Salesforce請求明細 18/18 フィールド』と具体的な件数が表示される
  const fieldMappingSummary = page.locator('[data-testid="field-mapping-summary"]');
  await expect(fieldMappingSummary).toContainText('Salesforce請求書');
  await expect(fieldMappingSummary).toContainText('14/14');
  await expect(fieldMappingSummary).toContainText('Salesforce請求明細');
  await expect(fieldMappingSummary).toContainText('18/18');

  // 計算ロジック・参照関係の依存性解決状況も一覧表示される
  const dependencySolutionList = page.locator('[data-testid="dependency-solution-list"]');
  await expect(dependencySolutionList).toBeVisible();

  // 『移行準備完了：次工程（リスク評価）へ進行可能』というメッセージが表示される
  const readyMessage = page.locator('[data-testid="ready-message"]');
  await expect(readyMessage).toContainText('移行準備完了');
  await expect(readyMessage).toContainText('次工程（リスク評価）へ進行可能');

  // 『次工程へ進む』ボタンが活性状態（クリック可能）になる
  const nextPhaseButton = page.locator('[data-testid="next-phase-button"]');
  await expect(nextPhaseButton).toBeVisible();
  await expect(nextPhaseButton).toBeEnabled();
});
