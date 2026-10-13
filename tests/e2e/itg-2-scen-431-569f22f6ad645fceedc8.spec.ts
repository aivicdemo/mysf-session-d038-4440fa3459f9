import { test, expect } from '@playwright/test';

test('SCEN-431: Salesforceのオブジェクト定義が空または不完全な場合、エラーメッセージが表示され処理が中断される', async ({ page }) => {
  await page.goto('/panels/scr-1791354749663.html');

  // 「オブジェクト参照関係可視化」機能を選択
  const refMenu = page.locator('[data-role="object-reference-menu"]');
  await refMenu.click();

  // 請求書カスタムオブジェクトの構造読み込みボタンをクリック
  const loadStructureBtn = page.locator('[data-role="load-structure-btn"][data-object="invoice"]');
  await loadStructureBtn.click();

  // ローディング表示
  const loading = page.locator('[data-role="loading-indicator"]');
  await expect(loading).toBeVisible();

  // Salesforceメタデータ取得処理が実行される
  // テストシナリオ：メタデータ取得が失敗
  await loading.waitFor({ state: 'hidden', timeout: 10000 });

  // エラーメッセージの表示確認
  const errorMessage = page.locator('[data-role="error-message"]');
  await expect(errorMessage).toBeVisible();
  await expect(errorMessage).toContainText('Salesforceメタデータの取得に失敗しました');
  await expect(errorMessage).toContainText('前回同期時点のデータを表示しています');
  await expect(errorMessage).toContainText('管理者に連絡してください');

  // オブジェクト参照関係可視化機能の処理が中断
  const vizButton = page.locator('[data-role="reference-visualization-btn"]');
  await expect(vizButton).toBeDisabled();

  // マッピング生成ボタンがグレーアウト
  const generateMappingBtn = page.locator('[data-role="generate-mapping-btn"]');
  await expect(generateMappingBtn).toBeDisabled();

  // ボタンのクリックが不可能であることを確認
  const buttonState = await generateMappingBtn.isDisabled();
  expect(buttonState).toBe(true);
});
