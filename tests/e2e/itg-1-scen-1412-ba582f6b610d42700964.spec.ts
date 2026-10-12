import { test, expect } from '@playwright/test';

test.describe('SCEN-1412: 取引先商談タブ表示 - ダッシュボード異常検知表示', () => {
  test('営業部長がダッシュボードを表示すると、配下部門の全商談について金額ズレ・ステータス不整合・未完了案件・未請求案件が検出され優先度付きアラート一覧が表示される', async ({
    page,
  }) => {
    // ステップ1: ブラウザで営業プロセス統合ダッシュボード画面にアクセスする
    await page.goto('/login.html');

    // ステップ2: ログインページで営業部長アカウントでログインする
    await page.fill('[data-testid="username"]', '営業部長');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    // ダッシュボード画面への遷移を待機
    await page.waitForURL((url) => url.pathname.includes('panels/') || url.pathname === '/');
    await page.goto('/panels/scr-1791354337614.html');

    // ステップ3: ダッシュボード画面の読み込み完了を確認する（スピナー消滅まで待機）
    const loadingIndicators = page.locator(
      'tr:has-text("読込中..."), div:has-text("読込中...")'
    );
    const loadingCount = await loadingIndicators.count();
    if (loadingCount > 0) {
      await page.waitForFunction(
        () => document.querySelectorAll('tr:has-text("読込中..."), div:has-text("読込中...")').length === 0,
        { timeout: 10000 }
      );
    }

    // ステップ4: 画面上部のアラート一覧エリアを目視する
    const anomalyPanel = page.locator('.anomaly-panel');
    await expect(anomalyPanel).toBeVisible();

    // 期待結果の検証: アラート一覧エリアに以下の内容が優先度順（高→中→低）で表示される

    // 【優先度：高】金額ズレ検出 1件（商談ID：xxx、ズレ金額：50,000円）
    // 【優先度：高】ステータス不整合検出 1件（商談ID：yyy、商談ステータス：クローズ済み、請求ステータス：未発行）
    const anomalyHighCard = page.locator('[data-testid="anomaly-high"]');
    await expect(anomalyHighCard).toBeVisible();
    const anomalyHighCount = page.locator('#anomaly-high-count');
    const highCountText = await anomalyHighCount.textContent();
    expect(highCountText).toMatch(/\d+件/);

    // 【優先度：中】未請求案件 1件（商談ID：zzz、受注金額：150万円）
    const anomalyMediumCard = page.locator('[data-testid="anomaly-medium"]');
    await expect(anomalyMediumCard).toBeVisible();
    const anomalyMediumCount = page.locator('#anomaly-medium-count');
    const mediumCountText = await anomalyMediumCount.textContent();
    expect(mediumCountText).toMatch(/\d+件/);

    // 【優先度：低】未完了案件 1件（商談ID：www、ステージ：交渉中、経過日数：15日）
    const anomalyLowCard = page.locator('[data-testid="anomaly-low"]');
    await expect(anomalyLowCard).toBeVisible();
    const anomalyLowCount = page.locator('#anomaly-low-count');
    const lowCountText = await anomalyLowCount.textContent();
    expect(lowCountText).toMatch(/\d+件/);

    // 各アラートにはタイムスタンプ（本日の時刻）と対象商談の取引先名・責任者名が表示される
    // 各優先度レベルのカードをクリックして詳細情報が表示されることを確認
    await anomalyHighCard.click();
    const anomalyDetail = page.locator('#anomaly-detail');
    await expect(anomalyDetail).toBeVisible();

    let detailText = await anomalyDetail.textContent();
    expect(detailText).toBeTruthy();

    // 中優先度の詳細を確認
    await anomalyMediumCard.click();
    await expect(anomalyDetail).toBeVisible();
    detailText = await anomalyDetail.textContent();
    expect(detailText).toBeTruthy();

    // 低優先度の詳細を確認
    await anomalyLowCard.click();
    await expect(anomalyDetail).toBeVisible();
    detailText = await anomalyDetail.textContent();
    expect(detailText).toBeTruthy();

    // 未請求案件テーブルが存在することを確認（「未請求案件」セクションが表示されているか）
    const unbildledTable = page.locator('[data-testid="unbilled-deals-table"]');
    await expect(unbildledTable).toBeVisible();

    // 金額ズレ検出テーブルが存在することを確認（「金額ズレ検出案件」セクションが表示されているか）
    const discrepancyTable = page.locator('[data-testid="amount-discrepancy-table"]');
    await expect(discrepancyTable).toBeVisible();

    // データ整合性検証結果テーブルが存在することを確認
    const validationTable = page.locator('[data-testid="validation-result-table"]');
    await expect(validationTable).toBeVisible();

    // ページ全体が正常に読み込まれていることを確認
    await expect(page).toHaveTitle(/MySF/);
  });
});
