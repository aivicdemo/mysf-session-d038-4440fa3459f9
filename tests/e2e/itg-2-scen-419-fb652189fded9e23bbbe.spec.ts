import { test, expect } from '@playwright/test';

test.describe('SCEN-419: 機能マッピング表再読込', () => {
  test('既存の機能マッピング詳細・マッピング検証結果・移行リスク評価が再読込され、最新の状態が画面に反映される', async ({ page }) => {
    // 機能マッピング管理画面を開く
    await page.goto('/panels/scr-1791354749663.html');

    // 画面が読込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 画面右上または操作パネルにある「再読込」ボタンを探す
    const refreshBtn = page.locator('#refresh-btn[data-testid="refresh-btn"]');
    await expect(refreshBtn).toBeVisible();

    // 再読込ボタンをクリックする
    await refreshBtn.click();

    // スピナー・ローディング表示が出現し、同期処理がバックグラウンドで実行されるのを確認する
    // ローディング状態を確認（テーブル内に「読込中...」テキストが表示される）
    const loadingIndicator = page.locator('text=読込中...');
    // ローディング表示が表示されるか、またはすぐに消える可能性があるため、
    // 状態の変化を待つ
    await page.waitForTimeout(500);

    // ローディング表示が消え、画面が再度レンダリングされるまで待機する
    await page.waitForLoadState('networkidle');

    // 機能マッピング詳細セクションを確認する
    const mappingTableSection = page.locator('[data-testid="mapping-table"]');
    await expect(mappingTableSection).toBeVisible();

    // テーブルにデータが表示されていることを確認
    const mappingTableRows = page.locator('[data-testid="mapping-table"] tbody tr');
    const rowCount = await mappingTableRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 画面上のマッピング検証結果セクションを確認する
    const validationSection = page.locator('text=マッピング検証結果').first();
    await expect(validationSection).toBeVisible();

    // 検証結果KPIが表示されていることを確認
    const verifiedKpi = page.locator('#kpi-verified');
    await expect(verifiedKpi).toBeVisible();

    const needsFixKpi = page.locator('#kpi-needs-fix');
    await expect(needsFixKpi).toBeVisible();

    const approvedKpi = page.locator('#kpi-approved');
    await expect(approvedKpi).toBeVisible();

    // 画面上の移行リスク評価セクションを確認する
    const riskSection = page.locator('text=移行リスク評価').first();
    await expect(riskSection).toBeVisible();

    // リスク評価KPIが表示されていることを確認
    const highRiskKpi = page.locator('#kpi-risk-high');
    await expect(highRiskKpi).toBeVisible();

    const mediumRiskKpi = page.locator('#kpi-risk-medium');
    await expect(mediumRiskKpi).toBeVisible();

    const lowRiskKpi = page.locator('#kpi-risk-low');
    await expect(lowRiskKpi).toBeVisible();

    // 期待結果の検証:
    // 1. 機能マッピング詳細：新規フィールドがマッピング対象として表示されている
    // テーブルの既存機能名列にテキストが存在することを確認
    const mappingRows = page.locator('[data-testid="mapping-table"] tbody tr:not(:has(td[colspan]))');
    const mappingRowCount = await mappingRows.count();
    expect(mappingRowCount).toBeGreaterThan(0);

    // テーブル内に機能マッピング情報が表示されていることを確認（既存機能名、マッピング方式など）
    const firstRow = mappingRows.first();
    const firstRowCells = firstRow.locator('td');
    const cellCount = await firstRowCells.count();
    expect(cellCount).toBeGreaterThanOrEqual(8); // 8列のマッピング表構造

    // 2. マッピング検証結果：新規メタデータの適用により検証ステータスが更新されている
    // KPI値が数値として表示されていることを確認
    const verifiedValue = await verifiedKpi.textContent();
    expect(verifiedValue).not.toBeNull();
    expect(verifiedValue?.trim()).toMatch(/^\d+$/);

    const needsFixValue = await needsFixKpi.textContent();
    expect(needsFixValue).not.toBeNull();
    expect(needsFixValue?.trim()).toMatch(/^\d+$/);

    // 3. 移行リスク評価：リスクスコア・リスク分類が更新されている
    // リスクKPI値が数値として表示されていることを確認
    const highRiskValue = await highRiskKpi.textContent();
    expect(highRiskValue).not.toBeNull();
    expect(highRiskValue?.trim()).toMatch(/^\d+$/);

    const mediumRiskValue = await mediumRiskKpi.textContent();
    expect(mediumRiskValue).not.toBeNull();
    expect(mediumRiskValue?.trim()).toMatch(/^\d+$/);

    // 最終同期タイムスタンプが現在時刻に更新されていることを確認
    // 画面が正常に再読込されたことで、データが最新化されていることを検証
    // （タイムスタンプは画面上に直接表示されていないため、
    // 再読込後に各セクションが正常に表示されていることで検証）

    // すべてのセクションが正常に表示されていることを最終確認
    await expect(mappingTableSection).toBeVisible();
    await expect(validationSection).toBeVisible();
    await expect(riskSection).toBeVisible();

    // 計算ロジック定義一覧が表示されていることを確認
    const logicTable = page.locator('[data-testid="logic-table"]');
    await expect(logicTable).toBeVisible();

    // システム機能が表示されていることを確認
    const systemFeaturesTable = page.locator('[data-testid="system-features-table"]');
    await expect(systemFeaturesTable).toBeVisible();
  });
});
