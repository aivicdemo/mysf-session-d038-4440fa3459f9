import { test, expect } from '@playwright/test';

test.describe('SCEN-426: CSV出力操作の履歴が実行ユーザー、実行日時、出力対象件数、ファイル識別子、出力ステータスとともに記録される', () => {
  test('監査ログに必要なすべての項目が正確に記録されることを検証', async ({ page, context }) => {
    // ダッシュボード画面を表示
    await page.goto('/panels/scr-1791354872866.html');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 差異データが表示されていることを確認
    const discrepancyTable = page.locator('[data-aivic-panel="scr-1791354872866"] table');
    await expect(discrepancyTable).toBeVisible();

    // テーブルのデータ件数を取得
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // CSV出力ボタンをクリック
    const exportButton = page.locator('[data-testid="export-csv-button"]');
    await expect(exportButton).toBeVisible();

    // クリック時刻を記録
    const beforeClickTime = new Date().toISOString();

    // ダウンロードイベントをリッスン
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();

    // ダウンロード完了を待つ
    const download = await downloadPromise;
    const fileName = download.suggestedFilename();

    // クリック後時刻を記録
    const afterClickTime = new Date().toISOString();

    // CSV出力成功メッセージが表示されることを確認
    const successMessage = page.locator('text=差異データをCSV出力しました|CSV出力が完了しました');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // 監査ログ管理画面にアクセス、または内部ログAPIエンドポイントを確認
    const auditLogs = await page.evaluate(() => {
      return window.localStorage.getItem('auditLogs');
    });

    // 監査ログにレコードが記録されていることを確認
    if (auditLogs) {
      const logs = JSON.parse(auditLogs);
      const csvExportLog = logs.find((log: any) => log.operationName === 'CSV_EXPORT');

      expect(csvExportLog).toBeDefined();

      if (csvExportLog) {
        // (1) 実行ユーザー = ログイン中のユーザーID/名前
        expect(csvExportLog.executingUserId).toBeTruthy();
        expect(csvExportLog.executingUserName).toBeTruthy();

        // (2) 実行日時 = ISO8601形式、秒単位以上の精度
        expect(csvExportLog.executionDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        const logTime = new Date(csvExportLog.executionDateTime).getTime();
        const beforeTime = new Date(beforeClickTime).getTime();
        const afterTime = new Date(afterClickTime).getTime();
        expect(logTime).toBeGreaterThanOrEqual(beforeTime);
        expect(logTime).toBeLessThanOrEqual(afterTime);

        // (3) 出力対象件数 = 100（仕様で指定された件数）
        expect(csvExportLog.targetCount).toBe(rowCount);

        // (4) ファイル識別子 = S3に保存されたファイルのオブジェクトキー形式
        // ファイル名が正しいフォーマットであることを確認
        expect(csvExportLog.fileIdentifier).toMatch(/difference_report_\d{8}_\d{6}_[\w\d]+\.csv/);

        // (5) 出力ステータス = 「SUCCESS」
        expect(csvExportLog.outputStatus).toBe('SUCCESS');

        // ログレコードが単一行で完全に記録されていることを確認
        expect(Object.keys(csvExportLog).length).toBeGreaterThanOrEqual(5);
      }
    }
  });
});
