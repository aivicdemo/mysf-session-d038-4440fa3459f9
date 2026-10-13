import { test, expect } from '@playwright/test';

test('SCEN-432: 移行対象システムの標準機能情報が提供されていない場合、エラーメッセージが表示され処理が中断される', async ({ page }) => {
  await page.goto('/panels/scr-1791354749663.html');

  // 『参照関係を可視化』ボタンをクリック
  const visualizeBtn = page.locator('[data-role="reference-visualization-btn"]');
  await visualizeBtn.click();

  // ローディング表示
  const loading = page.locator('[data-role="loading-indicator"]');
  await expect(loading).toBeVisible();

  // システムが移行対象システムの標準機能情報を取得しようとする
  // テストシナリオ：標準機能情報が利用できない状態
  await page.waitForTimeout(5000);
  await loading.waitFor({ state: 'hidden', timeout: 10000 });

  // (1) エラーメッセージが表示
  const errorAlert = page.locator('[data-role="error-alert"]');
  await expect(errorAlert).toBeVisible();
  const errorText = errorAlert.locator('[data-role="error-text"]');
  await expect(errorText).toContainText('移行対象システムの標準機能情報が取得できません');
  await expect(errorText).toContainText('参照関係の可視化処理は中断しています');
  await expect(errorText).toContainText('管理者に連絡してください');

  // (2) 参照関係の可視化ダイアグラムまたはリストが表示されない
  const visualization = page.locator('[data-role="visualization"]');
  await expect(visualization).not.toBeVisible();

  // ブランク状態で停止
  const blankState = page.locator('[data-role="blank-state"]');
  await expect(blankState).toBeVisible();

  // (3) 『参照関係を可視化』ボタンが非活性化（グレーアウト）
  await expect(visualizeBtn).toBeDisabled();

  // または『再試行』ボタンが表示
  const retryBtn = page.locator('[data-role="retry-btn"]');
  const isRetryVisible = await retryBtn.isVisible().catch(() => false);
  const isBtnDisabled = await visualizeBtn.isDisabled();

  expect(isRetryVisible || isBtnDisabled).toBe(true);

  // (4) 機能マッピング管理画面の他の部分（Salesforceメタデータ情報）は正常に表示
  const sfMetadataSection = page.locator('[data-role="sf-metadata-section"]');
  await expect(sfMetadataSection).toBeVisible();
});
