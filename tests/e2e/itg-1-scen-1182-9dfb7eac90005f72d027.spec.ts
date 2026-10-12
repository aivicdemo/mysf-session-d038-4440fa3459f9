import { test, expect, Page } from '@playwright/test';

test.describe('SCEN-1182: 商談詳細タブ表示 - 契約金額0円の場合の金額ズレ警告表示', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    // ログイン済み状態で商談・請求管理画面にアクセス
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await page.close();
  });

  test('契約金額0円、請求書金額100,000円の場合、金額ズレ警告が表示される', async () => {
    // 前置条件: ページロード完了時点で商談一覧が読み込まれている
    // テスト対象商談「DEAL-0000」を検索

    // 商談一覧から DEAL-0000 を探す
    const dealRows = page.locator('#deal-tbody tr');
    let dealFound = false;

    for (let i = 0; i < await dealRows.count(); i++) {
      const row = dealRows.nth(i);
      const rowText = await row.textContent();
      if (rowText && rowText.includes('DEAL-0000')) {
        dealFound = true;
        // 該当行をクリックして商談詳細を表示
        await row.click();
        break;
      }
    }

    // DEAL-0000 が見つからない場合は、テストデータから特定して検索
    if (!dealFound) {
      // フィルタで商談を検索する（ID または名称で）
      const dealNameInput = page.locator('#filter-customer, input[placeholder*="取引先"]').first();
      if (dealNameInput) {
        await dealNameInput.fill('DEAL-0000');
      }

      // 検索後、最初の結果をクリック
      const firstDeal = page.locator('#deal-tbody tr').first();
      await firstDeal.click();
    }

    // 商談詳細パネルが表示されることを確認
    const detailPanel = page.locator('#detail-panel');
    await expect(detailPanel).toBeVisible();

    // 契約金額フィールドが「0円」で表示されていることを確認
    const detailContent = await detailPanel.textContent();
    expect(detailContent).toContain('0円');

    // 関連請求書セクションに切り替え（タブをクリック）
    const invoicesTab = page.locator('[data-testid="tab-invoices"]');
    await invoicesTab.click();

    // 関連請求書が表示されていることを確認
    const invoiceTable = page.locator('#invoice-tbody');
    await expect(invoiceTable).toBeVisible();

    // 請求書金額が「100,000円」であることを確認
    const invoiceContent = await invoiceTable.textContent();
    expect(invoiceContent).toContain('100,000');

    // 金額ズレ警告の表示を確認
    // 警告バナーまたはアラートメッセージが画面に表示されていることを確認
    const warningContent = await detailPanel.textContent();
    expect(warningContent).toContain('金額不一致');

    // 詳細パネルに「金額不一致あり」の情報が含まれていることを確認
    const expectedWarningMessage = '金額不一致あり（契約金額0円、請求書金額100,000円）';

    // 警告メッセージが detailPanel または同一レベルのコンテナに含まれることを確認
    const allVisibleText = await page.textContent('body');
    expect(allVisibleText).toContain('金額不一致あり');
    expect(allVisibleText).toContain('契約金額0円');
    expect(allVisibleText).toContain('請求書金額100,000円');

    // ダッシュボードに戻ると、DEAL-0000 の行に「金額ズレ」フラグが表示される
    // （画面左のナビゲーションでダッシュボードに遷移）
    const dashboardNav = page.locator('a[data-aivic-nav="scr-1791354337614"]');
    await dashboardNav.click();

    // ダッシュボードページの読み込み完了を待つ
    await page.waitForLoadState('networkidle');

    // DEAL-0000 の行に「金額ズレ」フラグが表示されていることを確認
    const dashboardContent = await page.textContent('body');
    expect(dashboardContent).toContain('DEAL-0000');
    expect(dashboardContent).toContain('金額ズレ');
  });
});
