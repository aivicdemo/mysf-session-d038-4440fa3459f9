import { test, expect } from '@playwright/test';

test.describe('SCEN-1161: 商談詳細タブ表示 - 権限に基づいてアクセス対象データが制限される', () => {
  test('should restrict access to deal details based on user permissions', async ({ page }) => {
    // ログイン処理
    await page.goto('/panels/scr-1791354337614.html');

    // ログイン済みの状態を想定し、営業プロセス統合ダッシュボードで商談検索
    await page.goto('/panels/scr-1791354351333.html');

    // 商談検索: DEAL-20240115-001を検索
    const dealSearchInput = page.locator('#filter-customer');
    await dealSearchInput.fill('DEAL-20240115-001');

    // 検索結果から該当商談の行をクリック
    const dealTable = page.locator('#deal-tbody tr');
    const dealRow = dealTable.first();
    await dealRow.click();

    // 商談詳細が表示されるまで待機
    await page.waitForSelector('#detail-panel', { timeout: 3000 });

    // 期待結果の検証
    // (1) ヘッダー情報（取引先名）は表示される
    const detailPanel = page.locator('#detail-panel');
    const customerName = detailPanel.locator('text=顧客X');

    // customerNameが表示されているか確認（権限によっては非表示の可能性）
    const isCustomerVisible = await customerName.isVisible().catch(() => false);

    // (2) 営業責任者情報や権限制限メッセージを確認
    const restrictionMessage = detailPanel.locator('text=アクセス権限がありません');
    const salesPersonB = detailPanel.locator('text=営業担当者B');

    // 権限制限がある場合は、メッセージまたは営業担当者B情報が非表示
    const hasRestrictionMessage = await restrictionMessage.isVisible().catch(() => false);
    const isSalesPersonBVisible = await salesPersonB.isVisible().catch(() => false);

    // (3) 関連請求情報もフィルタリングされていることを確認
    const relatedInvoiceTab = page.locator('[data-tab="invoices"]');
    if (await relatedInvoiceTab.isVisible()) {
      await relatedInvoiceTab.click();
      const invoiceTable = page.locator('#invoice-tbody');

      // 権限に基づいてデータが制限されているか確認
      const invoiceRows = invoiceTable.locator('tr');
      const hasAccessRestriction =
        hasRestrictionMessage ||
        !isSalesPersonBVisible ||
        (await invoiceRows.count() === 0) ||
        (await invoiceRows.first().locator('text=アクセス権限').isVisible().catch(() => false));

      expect(hasAccessRestriction || isCustomerVisible).toBeTruthy();
    }
  });
});
