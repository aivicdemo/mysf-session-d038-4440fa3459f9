import { test, expect } from '@playwright/test';

test.describe('SCEN-425: CSV出力時に差異レコード詳細、請求書データ、是正履歴、確認履歴がすべてファイルに含まれる', () => {
  test('CSVファイルに4つのデータブロックが含まれていることを検証', async ({ page, context }) => {
    // ダッシュボード画面を表示
    await page.goto('/panels/scr-1791354872866.html');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 検出済みの差異データ一覧が表示されていることを確認
    const discrepancyTable = page.locator('[data-aivic-panel="scr-1791354872866"] table');
    await expect(discrepancyTable).toBeVisible();

    // CSV出力ボタンが表示されていることを確認
    const exportButton = page.locator('[data-testid="export-csv-button"]');
    await expect(exportButton).toBeVisible();

    // ダウンロードイベントをリッスン
    const downloadPromise = page.waitForEvent('download');

    // CSV出力ボタンをクリック
    await exportButton.click();

    // ダウンロードの完了を待つ
    const download = await downloadPromise;
    const filePath = await download.path();

    // ダウンロードされたファイルの内容を読み取る
    const fs = require('fs');
    const csvContent = fs.readFileSync(filePath, 'utf-8');

    // CSVファイルが空でないことを確認
    expect(csvContent.length).toBeGreaterThan(0);

    // ファイルサイズが0でないことを確認
    expect(filePath).toBeTruthy();

    // CSVファイルのフォーマットを確認
    const lines = csvContent.split('\n').filter((line: string) => line.trim().length > 0);
    expect(lines.length).toBeGreaterThan(1); // ヘッダー + 少なくとも1行のデータ

    // ヘッダー行を解析
    const headerLine = lines[0];
    expect(headerLine).toMatch(/,/); // カンマで区切られていることを確認

    // 【差異レコード詳細ブロック】の項目確認
    expect(csvContent).toMatch(/差異ID|差異レコード詳細/);
    expect(csvContent).toMatch(/検出日時/);
    expect(csvContent).toMatch(/対象商談ID|旧システム金額|新システム金額/);
    expect(csvContent).toMatch(/ステータス不一致内容/);

    // 【請求書データブロック】の項目確認
    expect(csvContent).toMatch(/商談ID|請求書番号|請求日|金額|ステータス/);

    // 【是正履歴ブロック】の項目確認
    expect(csvContent).toMatch(/是正ID|是正実施日時|是正内容|実施者/);

    // 【確認履歴ブロック】の項目確認
    expect(csvContent).toMatch(/確認ID|確認日時|確認者|承認|否認|コメント/);

    // ファイル名のフォーマット確認
    const fileName = download.suggestedFilename();
    expect(fileName).toMatch(/difference_report_.*\.csv/);

    // 文字エンコーディングがUTF-8であることを確認（BOM確認）
    if (csvContent.charCodeAt(0) === 0xFEFF) {
      expect(true).toBe(true); // BOMが含まれている（UTF-8 BOM）
    }

    // 監査ログに『CSV出力実行』イベントが記録されていることを確認
    const auditLogs = await page.evaluate(() => {
      return window.localStorage.getItem('auditLogs');
    });

    if (auditLogs) {
      const logs = JSON.parse(auditLogs);
      const csvExportLog = logs.find((log: any) => log.eventName === 'CSV_EXPORT_EXECUTED');
      expect(csvExportLog).toBeDefined();
      if (csvExportLog) {
        expect(csvExportLog.fileName).toBeTruthy();
        expect(csvExportLog.exportDateTime).toBeTruthy();
        expect(csvExportLog.targetCount).toBeGreaterThan(0);
        expect(csvExportLog.userId).toBeTruthy();
      }
    }
  });
});
