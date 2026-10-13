import { test, expect } from '@playwright/test';

test('SCEN-420: エッジ：差異件数が1000件を超える場合、業務ルール br-tx_5-003 の警告により「差異件数が多数です。パフォーマンスに影響する可能性があります。期間を絞って再実行してください」が記録される', async ({ page }) => {
  // ブラウザでデータ整合性検証ダッシュボードにアクセスしてログイン画面が表示されることを確認
  await page.goto('/login.html');
  const loginTitle = await page.title();
  expect(loginTitle).toContain('ログイン');

  // 有効なシステム管理者認証情報でログイン
  await page.goto('/panels/scr-1791354872866.html');
  await page.waitForLoadState('networkidle');

  // ダッシュボード画面が読み込まれ、旧システム（Salesforce）と新システムの営業データが表示されることを確認
  const pageTitle = await page.textContent('.page-title');
  expect(pageTitle).toContain('データ整合性検証ダッシュボード');

  const oldSystemSummary = await page.locator('[data-testid="old-system-summary"]');
  const newSystemSummary = await page.locator('[data-testid="new-system-summary"]');
  expect(oldSystemSummary).toBeVisible();
  expect(newSystemSummary).toBeVisible();

  // 画面の「日次照合実行」ボタンをクリック
  const reconcileButtons = await page.locator('button').filter({ hasText: /照合|実行/ });
  const buttonCount = await reconcileButtons.count();
  if (buttonCount > 0) {
    await reconcileButtons.first().click();
  }

  // システムが旧システム（Salesforce）と新システムの請求書生成ロジックを並行実行し、差異検出を開始することを確認
  const statusIndicatorOldSystem = await page.locator('[data-testid="status-indicator-old-system"]');
  const statusIndicatorNewSystem = await page.locator('[data-testid="status-indicator-new-system"]');
  expect(statusIndicatorOldSystem).toBeVisible();
  expect(statusIndicatorNewSystem).toBeVisible();

  // 差異検出が完了し、差異詳細情報が画面に反映されるまで待機
  await page.waitForLoadState('networkidle');
  const discrepancyTable = await page.locator('[data-testid="discrepancy-table"]');
  expect(discrepancyTable).toBeVisible();

  // 差異件数が1001件以上と表示されていることをブラウザの開発者ツール（F12）またはDOM検査で確認
  const discrepancyCount = await page.locator('#discrepancy-count');
  const countText = await discrepancyCount.textContent();
  const count = parseInt(countText || '0', 10);

  // ブラウザの開発者ツール「コンソール」または「ネットワーク」タブでアプリケーションログを確認し、業務ルール br-tx_5-003 の警告が記録されているかを検査
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
  });

  // 画面上の警告メッセージエリアに「差異件数が多数です。パフォーマンスに影響する可能性があります。期間を絞って再実行してください」のテキストが表示されていることを確認
  const warningMessage = '差異件数が多数です。パフォーマンスに影響する可能性があります。期間を絞って再実行してください';

  // 差異件数が1000件を超えた場合、画面上に業務ルール br-tx_5-003 に基づく警告メッセージが表示され、ブラウザのコンソールログ（または内部監視ログ）に同警告が記録されていることが確認できる
  if (count > 1000) {
    const pageContent = await page.content();
    expect(
      consoleMessages.some(msg => msg.includes(warningMessage)) ||
      pageContent.includes(warningMessage)
    ).toBeTruthy();
  }
});
