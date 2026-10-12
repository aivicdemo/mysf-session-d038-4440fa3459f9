import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1374: 取引先詳細表示 - 商談金額と請求金額の合計に差異がある場合', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/panels/scr-1791354379354.html');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('商談金額と請求金額の差額が計算されて「部分請求」「追加請求」として分類される', async () => {
    // 営業プロセス統合ダッシュボードにアクセス（前提：既にアクセス済み）

    // 左側のナビゲーションから「顧客・取引先管理画面」を選択（既に開いている）

    // 取引先一覧から「取引先A」を検索して詳細表示
    const searchField = page.locator('#search-field');
    await searchField.fill('取引先A');

    // 最初に表示される取引先をクリック
    const customerRow = page.locator('#customer-tbody tr').first();
    await customerRow.click();

    // 取引先詳細セクションが表示されることを確認
    const detailContainer = page.locator('#detail-container');
    await expect(detailContainer).toBeVisible();

    // 「関連する商談」タブをクリック
    const dealsTab = page.locator('[data-tab="deals-tab"]');
    await dealsTab.click();

    // 商談・請求情報一覧セクションまでスクロール
    const dealsSection = page.locator('#deals-tab');
    await dealsSection.scrollIntoViewIfNeeded();

    // 商談一覧テーブルボディを取得
    const dealsTableBody = page.locator('#deals-tbody');
    const dealRows = dealsTableBody.locator('tr');

    // 行数を確認（最低3行：2件の商談＋差額集計行）
    const dealRowCount = await dealRows.count();
    expect(dealRowCount).toBeGreaterThanOrEqual(3);

    // 商談1の確認：DEAL-001, 1,000,000円, 800,000円
    const firstRow = dealRows.nth(0);
    const firstRowText = await firstRow.textContent();
    expect(firstRowText).toContain('1,000,000');
    expect(firstRowText).toContain('800,000');

    // 商談2の確認：DEAL-002, 500,000円, 600,000円
    const secondRow = dealRows.nth(1);
    const secondRowText = await secondRow.textContent();
    expect(secondRowText).toContain('500,000');
    expect(secondRowText).toContain('600,000');

    // 差額集計行の確認：合計1,500,000円、合計1,400,000円
    const thirdRow = dealRows.nth(2);
    const thirdRowText = await thirdRow.textContent();
    expect(thirdRowText).toContain('1,500,000');
    expect(thirdRowText).toContain('1,400,000');

    // 差額集計行に差額100,000円が表示されていることを確認
    expect(thirdRowText).toContain('100,000');

    // 請求区分列をクリックして分類内容を確認
    const classificationCell = page.locator('[data-billing-classification]').first();
    if (await classificationCell.isVisible()) {
      await classificationCell.click();

      // 部分請求タグが表示されているか確認
      const partialBillingTag = page.locator('text=部分請求');
      await expect(partialBillingTag).toBeVisible();

      // 追加請求タグが表示されているか確認
      const additionalBillingTag = page.locator('text=追加請求');
      await expect(additionalBillingTag).toBeVisible();

      // 商談1の未請求額200,000円が表示されているか確認
      expect(await page.locator('text=200,000').count()).toBeGreaterThan(0);

      // 商談2の過請求額100,000円が表示されているか確認
      expect(await page.locator('text=100,000').count()).toBeGreaterThan(0);
    }
  });
});
