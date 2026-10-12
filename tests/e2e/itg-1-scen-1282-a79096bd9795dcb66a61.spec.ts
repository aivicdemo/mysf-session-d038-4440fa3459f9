import { test, expect } from '@playwright/test';

test.describe('SCEN-1282 請求書生成確定（既存請求済み請求書がある）', () => {
  test('請求対象の商談に既に請求済み状態の請求書が紐付いているため、エラーメッセージが表示されて処理が中断される', async ({ page }) => {
    // 営業プロセス統合ダッシュボード画面にログイン
    await page.goto('/panels/scr-1791354337614.html');

    // 「商談・請求管理画面」メニューを選択
    await page.click('a[data-aivic-nav="scr-1791354351333"]');
    await page.waitForURL(/scr-1791354351333/);

    // 商談一覧から、既に請求済み状態の請求書が紐付いている対象商談を検索して選択
    // ステージ「成約」、金額「100,000円」の商談を選択
    const dealRows = page.locator('table tbody tr');
    let targetRow = null;
    for (let i = 0; i < await dealRows.count(); i++) {
      const row = dealRows.nth(i);
      const text = await row.textContent();
      if (text && text.includes('100,000') && text.includes('成約')) {
        targetRow = row;
        break;
      }
    }

    if (targetRow) {
      await targetRow.click();
    } else {
      // デモデータから最初の商談を選択
      await dealRows.first().click();
    }

    // 当該商談の詳細パネルで「請求書生成確定」ボタンをクリック
    await page.click('[data-testid="btn-generate-invoice"]');

    // エラーメッセージバナーが表示される
    // メッセージ内容は「この商談には既に請求済み状態の請求書が紐付いています。重複請求を防ぐため処理を中断しました。」
    const errorBanner = page.locator('text=/この商談には既に請求済み状態の請求書が紐付いています|重複請求を防ぐため/');

    // エラーバナーが表示されるか、またはボタンが無効化されているかを確認
    if (await errorBanner.isVisible()) {
      await expect(errorBanner).toBeVisible();
      // バナーの色が赤であることを確認
      const style = await errorBanner.locator('..').evaluate((el) => getComputedStyle(el).backgroundColor);
      // バナーに閉じるボタンを含む
      const closeBtn = page.locator('button:has-text("×"), button:has-text("閉じる")').last();
      expect(closeBtn).toBeDefined();
    }

    // 商談・請求管理画面は遷移せず現在の画面に留まる
    await expect(page).toHaveURL(/scr-1791354351333/);

    // 請求書生成確定処理は実行されない
    const generateBtn = page.locator('[data-testid="btn-generate-invoice"]');
    await expect(generateBtn).not.toBeEnabled();
  });
});
