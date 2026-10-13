import { test, expect } from '@playwright/test';

test.describe('SCEN-424: チェックボックスでの差異レコード選択に不正な状態がある場合、処理が中断される', () => {
  test('不正なチェックボックス状態でCSV出力を試みるとエラーが表示される', async ({ page }) => {
    // ダッシュボード画面を表示
    await page.goto('/panels/scr-1791354872866.html');

    // ページが読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 差異レコード一覧が表示されていることを確認
    const discrepancyTable = page.locator('[data-aivic-panel="scr-1791354872866"] table');
    await expect(discrepancyTable).toBeVisible();

    // 不正なチェックボックス状態を強制（例：部分選択状態または矛盾した選択状態）
    const checkboxes = page.locator('input[type="checkbox"].row-checkbox');
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 1) {
      // 不正な選択状態を作成：最初のチェックボックスだけをチェック
      await page.evaluate(() => {
        const checkboxes = document.querySelectorAll('input[type="checkbox"].row-checkbox');
        if (checkboxes.length > 1) {
          // 最初だけチェック、残りはチェック解除
          (checkboxes[0] as HTMLInputElement).checked = true;
          for (let i = 1; i < checkboxes.length; i++) {
            (checkboxes[i] as HTMLInputElement).checked = false;
          }
        }
      });
    }

    // CSV出力ボタンをクリック
    const exportButton = page.locator('[data-testid="export-csv-button"]');
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    // エラーメッセージが表示される
    const errorMessage = page.locator(
      'text=/チェックボックス選択状態が不正|選択状態に問題があります/'
    );
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // CSV出力処理が開始されていない（ダッシュボードが現在の状態のまま）
    const dashboardTable = page.locator('[data-aivic-panel="scr-1791354872866"] table');
    await expect(dashboardTable).toBeVisible();

    // NotificationServiceAdapterの呼び出し窓口メソッドが呼ばれていないことを確認
    const notificationCalls = await page.evaluate(() => {
      return window.localStorage.getItem('notificationServiceCalls');
    });
    expect(notificationCalls).toBeFalsy();

    // FileStorageAdapterのuploadDifferenceReportメソッドが呼ばれていないことを確認
    const fileUploadCalls = await page.evaluate(() => {
      return window.localStorage.getItem('fileStorageUploadCalls');
    });
    expect(fileUploadCalls).toBeFalsy();

    // 監査ログに『チェックボックス選択状態が不正なため処理を中断』という趣旨のエラーレコードが記録される
    const auditLogs = await page.evaluate(() => {
      return window.localStorage.getItem('auditLogs');
    });

    if (auditLogs) {
      const logs = JSON.parse(auditLogs);
      const errorLog = logs.find(
        (log: any) => log.status === 'ERROR' && log.errorReason === 'INVALID_CHECKBOX_STATE'
      );
      expect(errorLog).toBeDefined();
      if (errorLog) {
        expect(errorLog.errorMessage).toMatch(/チェックボックス|選択状態|不正/);
      }
    }
  });
});
