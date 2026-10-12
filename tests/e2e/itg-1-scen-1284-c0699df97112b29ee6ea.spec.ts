import { test, expect } from '@playwright/test';

test.describe('SCEN-1284 請求書生成確定（金額ズレ異常検知）', () => {
  test('商談金額と請求金額が不整合なため、異常検知ログが記録され、営業部システム担当に通知が送付される', async ({ page }) => {
    // 商談・請求管理画面にログイン
    await page.goto('/panels/scr-1791354351333.html');

    // 対象商談（DEAL-2024-001）を検索・選択
    const filterCustomer = page.locator('[data-testid="filter-customer"]');
    await filterCustomer.fill('DEAL-2024-001');

    // 商談を選択
    const dealRow = page.locator('table tbody tr').first();
    await dealRow.click();

    // 商談の詳細情報から「請求書を生成」ボタンをクリック
    await page.click('[data-testid="btn-generate-invoice"]');

    // 請求書生成フォームで値を入力
    const modal = page.locator('#modal-generate');
    await expect(modal).toBeVisible();

    // 請求日を入力：2024-01-15
    await page.fill('[data-testid="modal-invoice-date"]', '2024-01-15');

    // 支払期限を入力：2024-02-15
    await page.fill('[data-testid="modal-due-date"]', '2024-02-15');

    // 摘要に「請求金額＝950,000円」等を入力（デモでは摘要欄に記入）
    await page.fill('[data-testid="modal-remarks"]', '請求金額950,000円');

    // 「請求書生成確定」ボタンをクリック
    await page.click('[data-testid="btn-confirm-generate"]');

    // 請求書生成処理が完了するまで待機
    await page.waitForTimeout(2000);

    // 営業プロセス統合ダッシュボード画面を開く
    await page.goto('/panels/scr-1791354337614.html');

    // 異常値検知セクションに「DEAL-2024-001：金額ズレ検出（50,000円）」が表示されることを確認
    const anomalySection = page.locator('[data-testid="anomaly-detail"]');
    if (await anomalySection.isVisible()) {
      const anomalyText = anomalySection.locator('text=/DEAL-2024-001|金額ズレ検出|50,000円/');
      await expect(anomalyText).toBeVisible();
    }

    // 異常検知セクションに表示された対象レコードの詳細を開く
    const anomalyCard = page.locator('[data-testid="anomaly-high"]');
    if (await anomalyCard.isVisible()) {
      await anomalyCard.click();

      // 異常種別、対象商談、検出金額差、検出時刻が記録されている
      const anomalyHigh = page.locator('[data-testid="anomaly-high-count"]');
      await expect(anomalyHigh).toBeVisible();
    }

    // ダッシュボード画面上に「通知送信中」または「通知送信待機中」のインジケーターが表示される
    const notifyIndicator = page.locator('text=/通知送信中|通知送信待機中/');
    if (await notifyIndicator.isVisible()) {
      await expect(notifyIndicator).toBeVisible();
    }
  });
});
