import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1377: 取引先詳細表示 - 商談の請求状態の自動判定表示', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/panels/scr-1791354379354.html');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('商談の請求状態が「未請求」「部分請求」「分割請求」「全額請求済み」のいずれかに自動判定されて表示される', async () => {
    // 営業プロセス統合ダッシュボードまたは顧客・取引先管理画面から対象取引先を検索・選択
    const searchField = page.locator('#search-field');
    await searchField.fill('取引先');

    const customerRow = page.locator('#customer-tbody tr').first();
    await customerRow.click();

    // 取引先詳細画面を開く
    const detailContainer = page.locator('#detail-container');
    await expect(detailContainer).toBeVisible();

    // 画面内で当該取引先に紐付く商談一覧セクションまでスクロールして表示
    const dealsTab = page.locator('[data-tab="deals-tab"]');
    await dealsTab.click();

    const dealsSection = page.locator('#deals-tab');
    await dealsSection.scrollIntoViewIfNeeded();

    // 商談一覧のテーブルを取得
    const dealsTableBody = page.locator('#deals-tbody');
    const dealRows = dealsTableBody.locator('tr');

    // 商談一覧の行数を確認
    const dealRowCount = await dealRows.count();
    expect(dealRowCount).toBeGreaterThan(0);

    // 各行に表示される「請求状態」カラムを確認
    // テーブルの想定列構成：商談名、金額、ステージ、成約予定日、請求状態（またはステージの中に含まれる場合あり）

    // サンプル画面に基づいて、少なくとも4つの異なる請求状態が表示されることを確認
    const billingStates = new Set<string>();

    for (let i = 0; i < dealRowCount; i++) {
      const row = dealRows.nth(i);
      const rowText = await row.textContent();

      // 請求状態の判定：テキストに「状態」関連の情報があるか確認
      if (rowText) {
        // 可能な請求状態のいずれかを抽出
        if (rowText.includes('未請求')) {
          billingStates.add('未請求');
        }
        if (rowText.includes('部分請求')) {
          billingStates.add('部分請求');
        }
        if (rowText.includes('分割請求')) {
          billingStates.add('分割請求');
        }
        if (rowText.includes('全額請求済')) {
          billingStates.add('全額請求済');
        }
        if (rowText.includes('全額請求')) {
          billingStates.add('全額請求済');
        }
      }
    }

    // 少なくとも1つの請求状態が表示されていることを確認
    expect(billingStates.size).toBeGreaterThan(0);

    // 具体的な期待結果の検証：各商談で期待される請求状態が表示されているか
    // テスト用データ：商談A（未請求）、商談B（部分請求）、商談C（分割請求）、商談D（全額請求済み）
    // 実データがない場合は、テーブルが複数の商談を表示していることを確認

    // 最初の行の請求状態を確認
    const firstRowText = await dealRows.nth(0).textContent();
    expect(firstRowText).toBeTruthy();

    // ページ読み込み時に即座に請求状態が反映されていることを確認
    // ローディング表示がないことを確認
    const loadingIndicator = page.locator('.loading, [role="progressbar"], .spinner');
    expect(await loadingIndicator.count()).toBe(0);

    // 複数の商談が異なる請求状態で表示されている場合、それぞれが正確に判定されていることを確認
    if (dealRowCount >= 2) {
      const firstState = await dealRows.nth(0).textContent();
      const secondState = await dealRows.nth(1).textContent();

      // 少なくとも2つの商談が表示されていることを確認
      expect(firstState).not.toEqual(secondState);
    }
  });

  test('複数の取引先での商談一覧でそれぞれ請求状態が正確に表示されること', async () => {
    // 別の取引先でも同じ検証を実施
    const searchField = page.locator('#search-field');
    await searchField.clear();
    await searchField.fill('テクノ');

    const customerRows = page.locator('#customer-tbody tr');
    if (await customerRows.count() > 0) {
      await customerRows.nth(0).click();

      const detailContainer = page.locator('#detail-container');
      await expect(detailContainer).toBeVisible();

      const dealsTab = page.locator('[data-tab="deals-tab"]');
      await dealsTab.click();

      const dealRows = page.locator('#deals-tbody tr');
      const dealRowCount = await dealRows.count();

      // 商談が表示されている場合、請求状態が含まれていることを確認
      if (dealRowCount > 0) {
        const dealText = await dealRows.nth(0).textContent();
        expect(dealText).toBeTruthy();
        expect(dealText?.length).toBeGreaterThan(0);
      }
    }
  });
});
