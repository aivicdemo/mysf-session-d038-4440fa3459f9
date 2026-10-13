import { test, expect } from '@playwright/test';

test('SCEN-397: 機能マッピング表生成 - プロジェクトコンテキストと移行対象システム情報が正常に解決される', async ({ page }) => {
  // 機能マッピング管理画面にアクセスする
  await page.goto('/panels/scr-1791354749663.html');
  await page.waitForLoadState('networkidle');

  // 画面左上のプロジェクト選択ドロップダウンをクリックする
  const projectDropdown = page.locator('[data-testid="project-select"]');
  await projectDropdown.click();

  // プロジェクト名『Salesforce → Oracle移行_請求機能』を選択する
  const projectOption = page.locator('text=Salesforce → Oracle移行_請求機能');
  await projectOption.click();

  // ローディング表示を確認する
  const loadingIndicator = page.locator('[data-testid="loading-indicator"]');
  await expect(loadingIndicator).toBeVisible();

  // ローディング表示が消滅するまで待機
  await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });

  // 『プロジェクトコンテキスト解決完了』メッセージが一時表示される
  const successMessage = page.locator('[data-testid="context-resolved-message"]');
  await expect(successMessage).toBeVisible();

  // メタデータ一覧表示エリアに遷移する
  const metadataListArea = page.locator('[data-testid="metadata-list-area"]');
  await expect(metadataListArea).toBeVisible();

  // Salesforceメタデータ取得時刻『2026-10-07 15:30:00 JST』、同期ステータス『成功』を確認
  const sfMetadataTime = page.locator('[data-testid="sf-metadata-timestamp"]');
  await expect(sfMetadataTime).toContainText('2026-10-07 15:30:00');

  const sfMetadataStatus = page.locator('[data-testid="sf-metadata-status"]');
  await expect(sfMetadataStatus).toContainText('成功');

  // 移行対象システムメタデータ取得時刻『2026-10-07 15:30:05 JST』、同期ステータス『成功』を確認
  const targetMetadataTime = page.locator('[data-testid="target-metadata-timestamp"]');
  await expect(targetMetadataTime).toContainText('2026-10-07 15:30:05');

  const targetMetadataStatus = page.locator('[data-testid="target-metadata-status"]');
  await expect(targetMetadataStatus).toContainText('成功');

  // 『次へ進む』ボタンが活性状態で表示される
  const nextButton = page.locator('[data-testid="next-button"]');
  await expect(nextButton).toBeVisible();
  await expect(nextButton).toBeEnabled();

  // 画面ヘッダーに『プロジェクト: Salesforce → Oracle移行_請求機能 | ステップ: 機能マッピング表生成準備完了』と表示される
  const pageHeader = page.locator('[data-testid="page-header"]');
  await expect(pageHeader).toContainText('Salesforce → Oracle移行_請求機能');
  await expect(pageHeader).toContainText('機能マッピング表生成準備完了');
});
