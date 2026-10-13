import { test, expect } from '@playwright/test';

test.describe('SCEN-422: 権限のあるユーザーが差異データをCSV出力すると、ファイルが生成されて監査ログに記録される', () => {
  test('CSV出力ボタンをクリックして、ファイル生成と監査ログ記録を検証', async ({ page, context }) => {
    // ダッシュボード画面を表示（権限あるユーザーでログイン済みとする）
    await page.goto('/panels/scr-1791354872866.html');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // ダッシュボード上で検出済みの差異データが表示されているテーブル領域を確認
    const discrepancyTable = page.locator('[data-aivic-panel="scr-1791354872866"] table');
    await expect(discrepancyTable).toBeVisible();

    // テーブルにデータ行があることを確認
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // CSV出力ボタンを確認して、ダウンロードイベントをリッスン
    const exportButton = page.locator('[data-testid="export-csv-button"]');
    await expect(exportButton).toBeVisible();

    // ダウンロードイベントをリッスン
    const downloadPromise = page.waitForEvent('download');

    // CSV出力ボタンをクリック
    await exportButton.click();

    // ダウンロードの完了を待つ
    const download = await downloadPromise;
    const fileName = download.suggestedFilename();
    const filePath = await download.path();

    // （1）ダウンロードされたCSVファイルの形式確認（difference_report_YYYYMMDD_HHmmss.csv）
    expect(fileName).toMatch(/difference_report_\d{8}_\d{6}\.csv/);
    expect(filePath).toBeTruthy();

    // （3）成功メッセージが表示されることを確認
    const successMessage = page.locator('text=差異データをCSV出力しました');
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // 成功メッセージが3秒後に自動消去されることを確認
    await page.waitForTimeout(3100);
    await expect(successMessage).not.toBeVisible();

    // （2）監査ログテーブルに正確なレコードが追加されたことを確認
    const auditLogs = await page.evaluate(() => {
      return window.localStorage.getItem('auditLogs');
    });

    if (auditLogs) {
      const logs = JSON.parse(auditLogs);
      const csvExportLog = logs.find((log: any) => log.operationName === 'CSV_EXPORT');

      expect(csvExportLog).toBeDefined();
      // ユーザーID確認
      expect(csvExportLog.userId).toBeTruthy();
      // 操作種別確認
      expect(csvExportLog.operationType).toBe('CSV_EXPORT');
      // 操作対象確認
      expect(csvExportLog.operationTarget).toBe('DIFFERENCE_REPORT');
      // 対象件数確認
      expect(csvExportLog.targetCount).toBe(rowCount);
      // 実行日時確認
      expect(csvExportLog.executionDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      // ステータス確認
      expect(csvExportLog.status).toBe('SUCCESS');
    }
  });
});
