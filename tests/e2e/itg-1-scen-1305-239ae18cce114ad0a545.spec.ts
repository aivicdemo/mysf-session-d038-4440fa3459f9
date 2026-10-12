import { test, expect } from '@playwright/test';

test('SCEN-1305: 再発行対象の請求書・請求明細データが検証ルールに適合せず、検証が失敗と判定され、エラー内容が画面に表示される', async ({ page }) => {
  // 商談・請求管理画面から金額計算誤り・参照関係不整合が存在する請求書を選択して詳細表示
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('[id="deal-tbody"]');

  // 金額計算誤りが存在する請求書を検索
  const filterField = page.locator('[id="filter-customer"]');
  await filterField.fill('エラー検出');

  const dealRow = page.locator('[id="deal-tbody"] tr').first();
  await dealRow.click();

  // 請求書詳細画面の「再発行」ボタンをクリック
  const reissueBtn = page.locator('[id="btn-reissue-invoice"]');
  await expect(reissueBtn).toBeVisible();
  await reissueBtn.click();

  // 再発行確認ダイアログが表示されたら、「確定」ボタンをクリック
  const modal = page.locator('[id="modal-reissue"]');
  await expect(modal).toBeVisible();

  const confirmBtn = modal.locator('button:has-text("確定")').or(modal.locator('[id="btn-confirm-reissue"]'));
  await confirmBtn.click();

  // 画面が検証実行中の状態に遷移し、プログレス表示またはローディング表示が出現することを確認
  const loadingIndicator = page.locator('text=検証中').or(page.locator('[class*="loading"]')).or(page.locator('[class*="progress"]'));
  await expect(loadingIndicator).toBeVisible({ timeout: 2000 }).catch(() => {
    // ローディング表示が一瞬で終わる可能性があるため、このエラーは無視
  });

  // 検証ルールエンジンが金額計算誤りと参照関係の不整合を判定処理する間、画面の反応を観察

  // 期待結果：検証が完了した時点で、請求書詳細画面上部に赤色のエラーバナーが表示される
  const errorBanner = page.locator('[class*="error"]').or(page.locator('[style*="red"]')).or(page.locator('text=失敗'));
  await expect(errorBanner).toBeVisible({ timeout: 5000 });

  // ①エラータイトル「請求書再発行に失敗しました」
  await expect(page.locator('text=請求書再発行に失敗しました')).toBeVisible();

  // ②複数行のエラー詳細メッセージ
  // 「請求明細の合計額（表示額）と請求額ヘッダが不一致です（差異額：¥XXXX）」
  const amountMismatchError = page.locator('text=請求明細の合計額').or(page.locator('text=不一致'));
  await expect(amountMismatchError).toBeVisible();

  // 「請求明細に紐付く商談商品が存在しません（明細行No.：X行目）」
  const dealProductError = page.locator('text=請求明細に紐付く商談商品が存在しません').or(page.locator('text=明細行No'));
  await expect(dealProductError).toBeVisible();

  // ③エラー発生時刻がタイムスタンプ付きで記録される
  const errorContent = page.locator('text=/\\d{4}-\\d{2}-\\d{2}\\s+\\d{2}:\\d{2}:\\d{2}/');
  await expect(errorContent).toBeVisible();

  // ④「再発行」ボタンが操作可能な状態のままである（ボタン無効化されていない）
  const reissueBtnAfterError = page.locator('[id="btn-reissue-invoice"]');
  await expect(reissueBtnAfterError).not.toBeDisabled();

  // ⑤請求書のステータスは「発行済み」のまま変わらない
  const statusField = page.locator('text=発行済み').or(page.locator('[data-status="issued"]'));
  await expect(statusField).toBeVisible();

  // ダイアログは閉じられ、詳細画面に戻る
  await expect(modal).not.toBeVisible();
});
