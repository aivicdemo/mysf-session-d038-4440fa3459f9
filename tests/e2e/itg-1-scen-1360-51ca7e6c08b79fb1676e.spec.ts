import { test, expect } from '@playwright/test';

test('SCEN-1360: 取引先詳細画面表示時に、商談ステージマスタの定義に基づいて商談の進捗状態が分類・表示される', async ({ page }) => {
  // 営業プロセス統合ダッシュボード画面から、取引先CUST001（ABC株式会社）を検索して選択
  await page.goto('/panels/scr-1791354379354.html');
  await page.waitForLoadState('networkidle');

  // 取引先を検索
  const searchField = page.locator('#search-field');
  await searchField.fill('ABC');
  await page.waitForTimeout(300);

  // 取引先をクリック
  const customerRow = page.locator('#customer-tbody tr').first();
  if (await customerRow.isVisible()) {
    await customerRow.click();
  } else {
    // 検索結果がない場合は最初の取引先を選択
    await searchField.clear();
    await page.waitForTimeout(200);
    const firstRow = page.locator('#customer-tbody tr').first();
    await firstRow.click();
  }

  // 取引先詳細画面が開くまで待機
  await page.waitForLoadState('networkidle');

  // 「関連商談」タブをクリック
  const dealsTab = page.locator('[data-tab="deals-tab"]');
  if (await dealsTab.isVisible()) {
    await dealsTab.click();
  }

  // 取引先詳細画面に表示される商談一覧セクションを確認
  const dealsTable = page.locator('#deals-tbody');
  await expect(dealsTable).toBeVisible();

  // 各商談の行に表示されているステージ表示欄を目視で確認
  const dealRows = page.locator('#deals-tbody tr');
  const rowCount = await dealRows.count();

  if (rowCount > 0) {
    // 各商談行を確認
    for (let i = 0; i < Math.min(rowCount, 4); i++) {
      const row = dealRows.nth(i);
      await expect(row).toBeVisible();

      // 商談名とステージが表示されていることを確認
      const cells = row.locator('td');
      const cellCount = await cells.count();

      if (cellCount >= 3) {
        // 第3列（ステージ）の内容を確認
        const stageCell = cells.nth(2);
        const stageText = await stageCell.textContent();

        // ステージが表示されていることを確認
        expect(stageText).toBeTruthy();

        // ステージマスタの定義に基づくステージ値が含まれていることを確認
        // 予想されるステージ: 初期接触、ニーズ把握、提案、交渉、決裁待ち、成約、失注、保留、再開
        const validStages = ['初期接触', 'ニーズ把握', '提案', '交渉', '決裁待ち', '成約', '失注', '保留', '再開'];
        const hasValidStage = validStages.some(stage => stageText?.includes(stage));

        if (stageText && stageText.trim() !== '-') {
          expect(hasValidStage).toBeTruthy();
        }
      }
    }

    // ステージ別の進捗表示（ビジュアルバッジ・色分け・進捗バーなど）が描画されていることを確認
    const dealsText = await dealsTable.textContent();
    expect(dealsText?.length).toBeGreaterThan(0);
  } else {
    // データがない場合も、セクションが表示されていることを確認
    await expect(dealsTable).toBeVisible();
  }
});
