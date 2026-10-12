import { test, expect } from '@playwright/test';

test.describe('SCEN-1162: 商談詳細タブ表示 - 基本情報と成約状態が画面に表示される', () => {
  test('should display deal basic information and contract status', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 商談一覧から DEAL-001 を検索
    const dealSearchInput = page.locator('#filter-customer');
    await dealSearchInput.fill('DEAL-001');

    // 商談リストから DEAL-001 を選択
    const dealTable = page.locator('#deal-tbody tr');
    await dealTable.first().click();

    // 商談詳細タブが表示されるまで待機
    await page.waitForSelector('#detail-panel', { timeout: 5000 });

    const detailPanel = page.locator('#detail-panel');

    // 【基本情報】の検証
    // 商談ID「DEAL-001」
    expect(detailPanel).toContainText('DEAL-001');

    // 商談名「ABC社向けシステム導入」
    expect(detailPanel).toContainText('ABC社向けシステム導入');

    // ステージ「提案段階」
    expect(detailPanel).toContainText('提案');

    // 金額「5,000,000円」
    expect(detailPanel).toContainText('5,000,000');

    // 取引先「ABC社」
    expect(detailPanel).toContainText('ABC');

    // 営業担当者名
    const salesPersonElement = detailPanel.locator('.detail-value').filter({ hasText: /営業|sales/ }).first();
    await expect(salesPersonElement).toBeVisible();

    // 【成約状態】「未成約」が表示される
    expect(detailPanel).toContainText('未成約');

    // 各項目が視認可能（フォーム形式またはテーブル形式）
    const detailRows = detailPanel.locator('.detail-row');
    const rowCount = await detailRows.count();
    expect(rowCount).toBeGreaterThan(0);

    // 値の欠落や空白がない確認
    const detailLabels = detailPanel.locator('.detail-label');
    const labelCount = await detailLabels.count();
    for (let i = 0; i < labelCount; i++) {
      const valueElement = detailPanel.locator('.detail-value').nth(i);
      const valueText = await valueElement.textContent();
      expect(valueText?.trim()).not.toBe('');
    }
  });
});
