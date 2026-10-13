import { test, expect } from '@playwright/test';

test.describe('SCEN-423: CSV出力権限のないユーザーが出力ボタンを押すと処理が中断される', () => {
  test('権限なしユーザーがCSV出力を試みるとエラーが表示される', async ({ page }) => {
    // ダッシュボード画面を表示（権限なしユーザーとする）
    await page.goto('/panels/scr-1791354872866.html');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // CSV出力ボタンが表示されていることを確認
    const exportButton = page.locator('[data-testid="export-csv-button"]');
    await expect(exportButton).toBeVisible();

    // システムが権限チェック処理を実行し、権限なし（false）と判定する
    // ボタンをクリック
    await exportButton.click();

    // エラーダイアログが表示される
    const errorMessage = page.locator(
      'text=/この操作はお客様には許可されていません|CSV出力権限がありません/'
    );
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // CSV出力処理が中断されることを確認
    const auditLogs = await page.evaluate(() => {
      return window.localStorage.getItem('auditLogs');
    });

    if (auditLogs) {
      const logs = JSON.parse(auditLogs);
      // 監査ログに操作日時、ユーザーID、操作内容、権限判定結果、処理ステータスが記録される
      const denialLog = logs.find(
        (log: any) => log.operationType === 'CSV_EXPORT_ATTEMPT'
      );
      expect(denialLog).toBeDefined();
      if (denialLog) {
        // 操作日時が記録されている
        expect(denialLog.operationDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        // ユーザーIDが記録されている
        expect(denialLog.userId).toBeTruthy();
        // 操作内容（CSV出力ボタン押下試行）が記録されている
        expect(denialLog.operationContent).toMatch(/CSV出力|ボタン押下/);
        // 権限判定結果（権限なし）が記録されている
        expect(denialLog.authorizationResult).toBe('DENIED');
        // 処理ステータス（処理中断）が記録されている
        expect(denialLog.processingStatus).toBe('ABORTED');
      }
    }
  });
});
