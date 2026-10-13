import { test, expect } from '@playwright/test';

test.describe('SCEN-409: ギャップ分析結果の詳細分類と移行リスク評価', () => {
  test('ギャップ分析結果が詳細に分類され、移行リスク評価に必要なスコアリングが実施される', async ({ page }) => {
    // 機能マッピング管理画面を開く
    await page.goto('/panels/scr-1791354749663.html');
    await page.waitForLoadState('networkidle');

    // 画面左上の「ギャップ分析実行」ボタンをクリック
    const gapAnalysisBtn = page.locator('button:has-text("ギャップ分析実行")');
    await gapAnalysisBtn.click();

    // ポップアップで表示される「分析範囲選択」において、対象を『Salesforce請求書オブジェクト vs 移行対象システム標準請求テーブル』に指定
    const targetSelect = page.locator('select, [role="combobox"], [class*="select"]').first();
    await targetSelect.click();
    await page.locator('text=Salesforce請求書オブジェクト').click();
    await page.locator('text=移行対象システム標準請求テーブル').click();

    // 「実行」ボタンをクリック
    const executeBtn = page.locator('button:has-text("実行")').last();
    await executeBtn.click();

    // ギャップ分析処理が完了するまで待機（画面上に進捗インジケーターが表示される）
    await page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 60000 });

    // 分析完了後、画面中央の「ギャップ分析結果」セクションを確認
    const resultSection = page.locator('section:has-text("ギャップ分析結果"), [class*="gap-analysis-result"]').first();
    await expect(resultSection).toBeVisible();

    // (1) 『フィールドギャップ』タブ：Salesforce側に存在するが移行対象システムに対応フィールドがない項目が一覧で表示
    const fieldGapTab = page.locator('text=フィールドギャップ');
    await fieldGapTab.click();

    const fieldGapList = page.locator('[class*="field-gap"], [role="listitem"]').first();
    await expect(fieldGapList).toBeVisible();

    // 各行に『移行対象外』『カスタム実装』『標準機能で代用』のいずれかのギャップタイプが分類される
    const gapTypeElements = page.locator('text=/(移行対象外|カスタム実装|標準機能で代用)/');
    expect(await gapTypeElements.count()).toBeGreaterThan(0);

    // (2) 『計算ロジックギャップ』タブ：計算式またはロジック単位でのギャップが一覧表示
    const calcGapTab = page.locator('text=計算ロジックギャップ');
    await calcGapTab.click();

    const calcGapList = page.locator('[class*="calc-logic-gap"], [role="listitem"]').first();
    await expect(calcGapList).toBeVisible();

    // 移行リスクスコア（0～100の数値）が各行の右側に表示される
    const riskScores = page.locator('text=/\\d{1,3}(?=\\s*(?:$|\\s))/');
    expect(await riskScores.count()).toBeGreaterThan(0);

    // (3) 『機能ギャップ』タブ：承認フロー・通知等の標準機能の有無が表示
    const featureGapTab = page.locator('text=機能ギャップ');
    await featureGapTab.click();

    const featureGapList = page.locator('[class*="feature-gap"], [role="listitem"]').first();
    await expect(featureGapList).toBeVisible();

    // 各機能ごとにリスクスコアが付与される
    const featureScores = page.locator('[class*="feature-gap"], [role="listitem"]');
    const scoreElements = featureScores.locator('[class*="score"], [data-score]');
    expect(await scoreElements.count()).toBeGreaterThan(0);

    // (4) 『移行リスク評価サマリー』パネル：全体の平均リスクスコアと3段階分類
    const summaryPanel = page.locator('[class*="risk-summary"], [class*="summary"], text=移行リスク評価サマリー').first();
    await summaryPanel.scrollIntoViewIfNeeded();
    await expect(summaryPanel).toBeVisible();

    // 平均リスクスコアが表示される
    const avgScore = page.locator('text=/平均.*スコア|平均.*\\d+/');
    const isScoreVisible = await avgScore.isVisible().catch(() => false);
    expect(isScoreVisible).toBeTruthy();

    // 『高リスク（スコア70以上）』『中リスク（40～69）』『低リスク（39以下）』の3段階に分類されたギャップ件数
    const riskDistribution = page.locator('text=/(高リスク|中リスク|低リスク)/');
    expect(await riskDistribution.count()).toBeGreaterThanOrEqual(3);

    // 数値で表示されている（例：高リスク4件、中リスク7件、低リスク5件）
    const riskCounts = page.locator('text=/\\d+\\s*件/');
    expect(await riskCounts.count()).toBeGreaterThanOrEqual(3);

    // 画面下部に「リスク評価結果をPDF出力」ボタンが活性化
    const pdfBtn = page.locator('button:has-text("リスク評価結果をPDF出力"), button:has-text("PDF出力")');
    await pdfBtn.scrollIntoViewIfNeeded();
    await expect(pdfBtn).toBeEnabled();
  });
});
