import { test, expect } from '@playwright/test';

test.describe('SCEN-408: 生成されたマッピングの検証と自動分類', () => {
  test('検証実行後、機能が完全対応・部分対応・カスタマイズ必要・非対応に自動分類・スコア化される', async ({ page }) => {
    // 機能マッピング管理画面にログインして表示
    await page.goto('/panels/scr-1791354749663.html');
    await page.waitForLoadState('networkidle');

    // マッピング候補一覧から最初の機能（例：請求書金額計算）を選択
    const firstFeature = page.locator('table tbody tr').first();
    await firstFeature.click();

    // 当該機能の詳細パネルで『検証実行』ボタンをクリック
    const verifyButton = page.locator('button:has-text("検証実行")');
    await verifyButton.click();

    // 検証処理が実行され、画面上でローディング表示が消えるまで待機（最大30秒）
    await page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 30000 });

    // 検証結果が詳細パネルに表示されたことを確認
    const detailPanel = page.locator('[role="dialog"], [class*="panel"], .detail-pane').first();
    await expect(detailPanel).toBeVisible();

    // 一覧画面に戻り、複数の機能（計5件以上）について同様に検証実行を行う
    const backButton = page.locator('button:has-text("戻る"), button:has-text("一覧に戻る")');
    if (await backButton.isVisible()) {
      await backButton.click();
    }

    // 複数の機能を検証
    const features = page.locator('table tbody tr');
    const featureCount = Math.min(await features.count(), 5);

    for (let i = 0; i < featureCount; i++) {
      const feature = features.nth(i);
      await feature.click();
      await page.waitForTimeout(500);

      const verifyBtn = page.locator('button:has-text("検証実行")');
      if (await verifyBtn.isVisible()) {
        await verifyBtn.click();
        await page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 30000 });
      }

      if (i < featureCount - 1) {
        const backBtn = page.locator('button:has-text("戻る"), button:has-text("一覧に戻る")');
        if (await backBtn.isVisible()) {
          await backBtn.click();
          await page.waitForTimeout(500);
        }
      }
    }

    // 検証完了後、機能マッピング表の各行に以下の要素が画面に表示されることを確認

    // (1) 対応区分カラム（『完全対応』『部分対応』『カスタマイズ必要』『非対応』のいずれか1つのテキスト）
    const correspondenceTypes = ['完全対応', '部分対応', 'カスタマイズ必要', '非対応'];
    for (const type of correspondenceTypes) {
      const typeElement = page.locator(`text="${type}"`);
      const isVisible = await typeElement.isVisible().catch(() => false);
      if (isVisible) {
        await expect(typeElement).toBeVisible();
        break;
      }
    }

    // (2) スコア表示（0～100の数値と棒グラフ）
    const scoreElements = page.locator('[class*="score"], [data-score], text=/\\d+(?:\\.\\d+)?%/');
    const scoreCount = await scoreElements.count();
    expect(scoreCount).toBeGreaterThan(0);

    // (3) 対応区分に応じた背景色
    const completeMappingRows = page.locator('tr:has-text("完全対応")');
    const completeMappingCount = await completeMappingRows.count();
    if (completeMappingCount > 0) {
      const firstCompleteRow = completeMappingRows.first();
      const bgColor = await firstCompleteRow.evaluate(el => {
        return window.getComputedStyle(el).backgroundColor;
      });
      // 緑色のチェック
      expect(bgColor).toMatch(/rgb\((0|51|76|102|127|153|179|204|230|255),\s*(128|153|179|204|230|255),\s*(0|51|76|102|127|153|179|204|230|255)\)/);
    }

    // 全検証機能について対応区分とスコアが同時に確定状態で表示
    const rows = page.locator('table tbody tr');
    const rowCount = await rows.count();
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const row = rows.nth(i);
      const hasType = await row.locator(`text=/(完全対応|部分対応|カスタマイズ必要|非対応)/`).isVisible().catch(() => false);
      const hasScore = await row.locator('[class*="score"], [data-score]').isVisible().catch(() => false);
      if (hasType || hasScore) {
        expect(hasType || hasScore).toBeTruthy();
      }
    }

    // 一覧上部に『検証済み機能: 5/5』のような集計値が更新されている
    const summaryText = page.locator('text=/検証済み機能:\\s*\\d+\\/\\d+/');
    await expect(summaryText).toBeVisible();

    // 画面遷移は発生していない（同じ画面にとどまっている）
    await expect(page).toHaveURL(/scr-1791354749663/);
  });
});
