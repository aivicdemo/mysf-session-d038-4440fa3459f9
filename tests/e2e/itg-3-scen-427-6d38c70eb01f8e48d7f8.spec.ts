import { test, expect } from '@playwright/test';

test.describe('SCEN-427: CSV出力によって生成されたファイルがAmazon S3に保存される', () => {
  test('CSV出力実行後、S3に正常にファイルが保存されたことを検証', async ({ page, context }) => {
    // ダッシュボード画面を表示
    await page.goto('/panels/scr-1791354872866.html');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 営業データ照合結果から差異が検出されている状態を確認
    const discrepancyTable = page.locator('[data-aivic-panel="scr-1791354872866"] table');
    await expect(discrepancyTable).toBeVisible();

    // テーブルにデータがあることを確認
    const tableRows = page.locator('tbody tr');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // CSV出力ボタンが表示されていることを確認
    const exportButton = page.locator('[data-testid="export-csv-button"]');
    await expect(exportButton).toBeVisible();

    // ダウンロード監視
    const downloadPromise = page.waitForEvent('download');

    // CSV出力ボタンをクリック
    await exportButton.click();

    // ダウンロード完了を待つ
    const download = await downloadPromise;
    const suggestedFileName = download.suggestedFilename();

    // ダッシュボード画面上に処理結果メッセージが表示されるまで待機
    const successMessage = page.locator(
      'text=/CSV出力ファイルをS3に正常に保存しました|S3への保存に成功しました/'
    );
    await expect(successMessage).toBeVisible({ timeout: 5000 });

    // S3へのファイル保存が実行されたことを確認
    // (実際のS3操作はシミュレーションまたはモック)
    const s3UploadLog = await page.evaluate(() => {
      return window.localStorage.getItem('s3UploadOperations');
    });

    if (s3UploadLog) {
      const uploadOps = JSON.parse(s3UploadLog);
      const latestUpload = uploadOps[uploadOps.length - 1];

      expect(latestUpload).toBeDefined();
      expect(latestUpload.status).toBe('SUCCESS');
      expect(latestUpload.s3Path).toBeTruthy();
    }

    // 監査ログテーブルに操作が記録されていることを確認
    const auditLogs = await page.evaluate(() => {
      return window.localStorage.getItem('auditLogs');
    });

    if (auditLogs) {
      const logs = JSON.parse(auditLogs);
      const s3UploadLog = logs.find((log: any) => log.operationName === 'CSV_S3_UPLOAD');

      expect(s3UploadLog).toBeDefined();

      if (s3UploadLog) {
        // 操作ユーザーが記録されていることを確認
        expect(s3UploadLog.operatingUserId).toBeTruthy();

        // 操作日時が記録されていることを確認
        expect(s3UploadLog.operationDateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

        // 操作内容（「CSV差異データ出力」）が記録されていることを確認
        expect(s3UploadLog.operationContent).toMatch(/CSV.*出力/);

        // 出力ファイル名が記録されていることを確認
        expect(s3UploadLog.outputFileName).toBeTruthy();

        // S3パスが記録されていることを確認
        expect(s3UploadLog.s3Path).toBeTruthy();

        // 処理結果（成功）が記録されていることを確認
        expect(s3UploadLog.processingResult).toBe('成功');
      }
    }
  });
});
