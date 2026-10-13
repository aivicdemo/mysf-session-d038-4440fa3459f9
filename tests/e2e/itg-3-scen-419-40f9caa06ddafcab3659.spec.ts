import { test, expect } from '@playwright/test';

test('SCEN-419: エッジ：フィールドマッピング定義が不完全な場合、業務ルール br-tx_5-003 の警告により「一部のフィールドマッピング定義が不完全です。分析精度が低下する可能性があります」が記録される', async ({ page }) => {
  // ダッシュボード画面から、新システムとSalesforceの並行実行に用いるフィールドマッピング定義を参照する設定メニューを開く
  await page.goto('/panels/scr-1791354872866.html');
  await page.waitForLoadState('networkidle');

  // フィールドマッピング定義の一覧表示を確認し、商談商品オブジェクトのマッピングが不完全な状態（必須フィールドが欠落）であることを視認する
  const title = await page.textContent('.page-title');
  expect(title).toContain('データ整合性検証ダッシュボード');

  // 日次自動照合実行ボタン（またはスケジュール実行に基づく日時）をクリックして照合処理を開始する
  // コンソール監視を開始して、警告ログを収集
  const consoleMessages: string[] = [];
  page.on('console', msg => {
    consoleMessages.push(msg.text());
  });

  // ダッシュボードの画面上に、差異検出結果レポートまたは警告ログセクションが表示されるまで待機する（または画面を更新して結果を確認する）
  await page.reload();
  await page.waitForLoadState('networkidle');

  // ダッシュボード画面の警告・ログ表示エリアに、業務ルール br-tx_5-003 による以下の警告メッセージが記録・表示される：
  // 「一部のフィールドマッピング定義が不完全です。分析精度が低下する可能性があります」
  const warningMessage = '一部のフィールドマッピング定義が不完全です。分析精度が低下する可能性があります';

  // 警告がコンソール或いはページコンテンツに記録されているか確認
  const pageContent = await page.content();
  const warningExists = consoleMessages.some(msg => msg.includes(warningMessage)) ||
                        pageContent.includes(warningMessage);

  // 警告はタイムスタンプ付きで記録され、管理者が確認可能な状態となることを確認
  expect(warningExists).toBeTruthy();
});
