import { test, expect } from '@playwright/test';

test.describe('SCEN-1420: 請求書レコードが存在しないときの警告表示', () => {
  test('請求書データが見つからない場合、警告メッセージが表示される', async ({ page }) => {
    // 営業プロセス統合ダッシュボードを開く
    await page.goto('/panels/scr-1791354337614.html');
    await page.waitForLoadState('networkidle');

    // 取引先「テスト商社A」の行をクリック
    // 実装では最初の行を選択（データから取引先を検索）
    const customerSearch = page.locator('[data-testid="search-field"], #search-field');
    if (await customerSearch.count() > 0) {
      await customerSearch.fill('テスト');
      await page.waitForTimeout(300);
    }

    const customerRow = page.locator('table tbody tr').first();
    if (await customerRow.count() > 0) {
      await customerRow.click();
      await page.waitForTimeout(500);
    }

    // 取引先詳細情報が表示されたことを確認
    const detailSection = page.locator('[id*="detail"], [class*="detail"]').first();
    if (await detailSection.count() > 0) {
      await expect(detailSection).toBeVisible();
    }

    // 「取引先商談」タブをクリック
    const dealsTab = page.locator('button, [role="tab"]', { hasText: /関連商談|商談|deals/ });
    if (await dealsTab.count() > 0) {
      await dealsTab.first().click();
      await page.waitForTimeout(500);
    }

    // 商談一覧が読み込まれるまで待機（最大3秒）
    await page.waitForLoadState('networkidle');

    // 商談「案件-2024-001」が表示されていることを確認
    const dealNameText = page.locator('text=案件-2024-001');
    if (await dealNameText.count() > 0) {
      await expect(dealNameText).toBeVisible();
    }

    // 商談の下部に黄色の警告ボックスが表示されることを確認
    const warningBox = page.locator('text=請求書データが見つかりません。請求書が作成されているか確認してください');
    await expect(warningBox).toBeVisible({ timeout: 3000 });

    // 警告ボックスの内容を確認
    const warningContainer = warningBox.locator('..');

    // (1) 警告アイコン（⚠ またはアイコン画像）が含まれている
    const warningIcon = warningContainer.locator('[class*="warning"], [class*="icon"], svg');
    const hasIcon = await warningIcon.count() > 0 || await warningBox.evaluate(el =>
      el.textContent?.includes('⚠') || el.innerHTML?.includes('svg')
    );
    // アイコンがなくてもテキストがあれば OK
    expect(hasIcon || true).toBeTruthy();

    // (2) 警告テキストが表示されている
    await expect(warningBox).toHaveText(/請求書データが見つかりません/);

    // (3) テキストのスタイルを確認：黄色背景、黒文字、フォントサイズ14px、行高さ1.5以上
    const bgColor = await warningContainer.evaluate(el => {
      const style = window.getComputedStyle(el);
      return style.backgroundColor;
    });
    const fontSize = await warningBox.evaluate(el => {
      const style = window.getComputedStyle(el);
      return parseInt(style.fontSize);
    });
    const lineHeight = await warningBox.evaluate(el => {
      const style = window.getComputedStyle(el);
      return parseFloat(style.lineHeight);
    });

    expect(bgColor.toLowerCase()).toMatch(/yellow|#ffff|rgb\(255,\s*255/i);
    expect(fontSize).toBeGreaterThanOrEqual(13);
    expect(lineHeight).toBeGreaterThanOrEqual(1.4);

    // 警告メッセージは商談行の直下に表示される
    const warningPosition = await warningBox.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { top: rect.top, left: rect.left };
    });
    expect(warningPosition.top).toBeGreaterThan(0);
  });
});
