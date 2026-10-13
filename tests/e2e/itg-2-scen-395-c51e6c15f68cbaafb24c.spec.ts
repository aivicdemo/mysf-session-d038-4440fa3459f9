import { test, expect } from '@playwright/test';

test('SCEN-395: 機能マッピング表生成 - 認証・ロール権限を満たしており、ボタンをクリックすると全工程が完了する', async ({ page }) => {
  // ブラウザで機能マッピング管理画面にアクセスし、ログイン認証を完了する
  await page.goto('/panels/scr-1791354749663.html');

  // ページが読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // 『機能マッピング表生成』ボタンが活性化していることを確認する
  const generateButton = page.locator('[data-testid="generate-mapping-button"]');
  await expect(generateButton).toBeVisible();
  await expect(generateButton).toBeEnabled();

  // 『機能マッピング表生成』ボタンをクリックする
  await generateButton.click();

  // ボタンが一時的に無効化（グレーアウト）されることを確認する
  await expect(generateButton).toBeDisabled();

  // 画面の処理ステータス表示エリアに「Salesforceメタデータを取得中...」のメッセージが表示されることを確認する
  const statusMessage = page.locator('[data-testid="status-message"]');
  await expect(statusMessage).toContainText('Salesforceメタデータを取得中');

  // ローディング状態が終了するまで待機（最大 30 秒）
  await page.waitForTimeout(1000);

  // マッピング結果セクションが表示されていることを確認
  const mappingResultSection = page.locator('[data-testid="mapping-result-section"]');
  await expect(mappingResultSection).toBeVisible();

  // マッピング結果がテーブル形式で表示されていることを確認
  const mappingTable = page.locator('[data-testid="mapping-result-table"]');
  await expect(mappingTable).toBeVisible();

  // テーブルに最低 3 行以上のデータが表示されていることを確認
  const tableRows = page.locator('[data-testid="mapping-result-table"] tbody tr');
  const rowCount = await tableRows.count();
  expect(rowCount).toBeGreaterThanOrEqual(3);

  // 検証結果セクションが表示されていることを確認
  const validationResultSection = page.locator('[data-testid="validation-result-section"]');
  await expect(validationResultSection).toBeVisible();

  // 検証ステータスが表示されていることを確認
  const validationStatusElements = page.locator('[data-testid="validation-status"]');
  await expect(validationStatusElements.first()).toBeVisible();

  // リスク評価セクションが表示されていることを確認
  const riskAssessmentSection = page.locator('[data-testid="risk-assessment-section"]');
  await expect(riskAssessmentSection).toBeVisible();

  // リスク評価が「高」「中」「低」のいずれかで表示されていることを確認
  const riskLevel = page.locator('[data-testid="risk-level"]');
  await expect(riskLevel).toBeVisible();
  const riskText = await riskLevel.textContent();
  expect(['高', '中', '低']).toContain(riskText?.trim());

  // 画面にエラーメッセージが表示されていないことを確認する
  const errorMessages = page.locator('[data-testid="error-message"]');
  await expect(errorMessages.first()).not.toBeVisible();

  // ボタンが再度活性化されることを確認する
  await expect(generateButton).toBeEnabled();
});
