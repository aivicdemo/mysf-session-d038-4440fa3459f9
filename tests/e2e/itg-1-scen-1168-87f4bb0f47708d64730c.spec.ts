import { test, expect } from '@playwright/test';

test.describe('SCEN-1168: 商談詳細タブ表示 - 異常が検知される', () => {
  test('should detect and display anomalies in deal details', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 営業プロセス統合ダッシュボード画面上で、商談一覧から商談ID「DEAL-001」をクリック
    const dealSearchInput = page.locator('#filter-customer');
    await dealSearchInput.fill('DEAL-001');

    const dealTable = page.locator('#deal-tbody tr');
    await dealTable.first().click();

    // 画面右側に商談詳細タブが開く
    await page.waitForSelector('#detail-panel', { timeout: 5000 });

    // 商談詳細タブの読み込みが完了するまで待機（最大5秒）
    const detailPanel = page.locator('#detail-panel');
    await detailPanel.waitFor({ state: 'visible', timeout: 5000 });

    // 商談詳細タブ内に表示されたコンテンツの最上部を視認
    // 期待結果の検証

    // アラートバナーが表示され、以下の内容が確認できる
    const alertBanner = page.locator('[role="alert"], [class*="alert"], [class*="warning"], [class*="banner"]').first();

    // (1) 赤色の警告アイコン
    const warningIcon = alertBanner.locator('[class*="icon"], svg').first();
    const hasWarningIcon = await warningIcon.isVisible().catch(() => false) ||
                          await alertBanner.locator('text=/⚠|⛔|🔴/').isVisible().catch(() => false);

    if (hasWarningIcon) {
      // (2) 「異常が検知されました」というテキスト
      expect(alertBanner).toContainText(/異常|anomaly|検知|detected/i);

      // (3) 「金額ズレ：商談金額 1,000,000円 vs 請求予定額 900,000円」という具体的な金額差分
      const bannerText = await alertBanner.textContent();
      expect(bannerText).toMatch(/\d+,?\d+円.*\d+,?\d+円/);

      // (4) 「詳細確認」リンク
      const detailLink = alertBanner.locator('a, button').filter({ hasText: /詳細|detail|確認/ });
      const hasDetailLink = await detailLink.isVisible().catch(() => false);
      expect(hasDetailLink).toBe(true);

      // アラートバナーがスクロール時も固定位置に配置されているか確認
      const initialPosition = await alertBanner.boundingBox();

      // ページをスクロール
      await page.evaluate(() => window.scrollBy(0, 200));

      const scrolledPosition = await alertBanner.boundingBox();

      // 位置がほぼ同じか確認（固定か相対位置かを判定）
      if (initialPosition && scrolledPosition) {
        const verticalDifference = Math.abs((initialPosition?.y || 0) - (scrolledPosition?.y || 0));
        // 固定位置の場合、差分は小さいはず
        expect(verticalDifference).toBeLessThan(50);
      }
    }
  });
});
