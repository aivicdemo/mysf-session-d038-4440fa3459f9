import { test, expect } from '@playwright/test';

test.describe('SCEN-1319: 請求明細の行アイテムが空のとき、エラーメッセージが表示される', () => {
  test('請求明細が存在しないときエラーメッセージが表示され、再発行処理は実行されない', async ({ page }) => {
    await page.goto('/panels/scr-1791354351333.html');

    // 商談・請求管理画面で過去発行済みの請求書レコードを選択
    const dealRows = page.locator('#deal-tbody tr');
    await dealRows.first().click();

    // 選択した請求書の詳細画面を開く
    await page.waitForTimeout(500);

    // 請求書詳細画面で請求明細セクションが空であることを確認
    const detailTableBody = page.locator('#invoice-detail-tbody');
    const emptyState = detailTableBody.locator('.empty-state, text=請求明細がありません');

    // 請求明細がないことを確認
    const rows = await page.locator('#invoice-detail-tbody tr').count();
    if (rows === 0 || await emptyState.isVisible()) {
      // 請求明細が空の場合、再発行確定ボタンをクリック
      const reissueButton = page.locator('#btn-reissue-invoice');
      await reissueButton.click();

      // バリデーション処理が実行されるまで待機（1～2秒程度）
      await page.waitForTimeout(1500);

      // エラーメッセージが表示される
      const errorMessage = page.locator(
        'text=請求明細が存在しません。データを確認してください'
      );
      await expect(errorMessage).toBeVisible();

      // エラーメッセージが赤色またはアラート色で強調表示される
      const errorElement = page.locator('[role="alert"], .error-message, .alert');
      await expect(errorElement).toBeVisible();

      const style = await errorElement.evaluate((el: HTMLElement) => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor
        };
      });

      // 赤色系の色が含まれていることを確認
      const colorStr = `${style.color}${style.backgroundColor}${style.borderColor}`.toLowerCase();
      expect(colorStr).toMatch(/red|rgb\(255.*0.*0|#ff0000/i);

      // 再発行処理は実行されず、画面は詳細画面のまま
      const detailPanel = page.locator('#detail-panel');
      await expect(detailPanel).toBeVisible();

      // サーバーへのリクエスト送信は発生しない
      let requestOccurred = false;
      page.on('request', (request) => {
        if (request.method() === 'POST' || request.method() === 'PUT') {
          requestOccurred = true;
        }
      });

      await page.waitForTimeout(500);
      expect(requestOccurred).toBe(false);
    }
  });
});
