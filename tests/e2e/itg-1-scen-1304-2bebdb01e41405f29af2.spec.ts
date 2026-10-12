import { test, expect } from '@playwright/test';

test('SCEN-1304: 再発行対象の請求書・請求明細データが検証ルールに適合し、検証が成功と判定される', async ({ page }) => {
  // 営業担当者は商談・請求管理画面へログイン
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('[id="deal-tbody"]');

  // 検索条件に請求書ID「INV-2024-001」を入力し、検索ボタンをクリック
  const filterField = page.locator('[id="filter-customer"]');
  await filterField.fill('INV-2024-001');

  // 検索結果に請求書INV-2024-001が表示されることを確認
  const dealRow = page.locator('[id="deal-tbody"] tr').first();
  await expect(dealRow).toBeVisible();
  await dealRow.click();

  // 請求書行のアクションメニューから「再発行」ボタンをクリック
  const reissueBtn = page.locator('[id="btn-reissue-invoice"]');
  await expect(reissueBtn).toBeVisible();
  await reissueBtn.click();

  // 再発行確認ダイアログが表示され、請求書ID・金額・明細件数が表示される
  const modal = page.locator('[id="modal-reissue"]');
  await expect(modal).toBeVisible();
  await expect(modal.locator('text=INV-2024-001')).toBeVisible();

  // ダイアログ内の「検証を実行」ボタンをクリック
  const validateBtn = modal.locator('button:has-text("検証を実行")').or(modal.locator('[id="btn-confirm-reissue"]'));
  await validateBtn.click();

  // システムが検証処理を実行し、完了を待機
  await page.waitForTimeout(1000);

  // 検証結果が画面に反映されるまで待機
  const validationResult = page.locator('text=検証成功');
  await expect(validationResult).toBeVisible({ timeout: 5000 });

  // 期待結果：検証結果として「検証成功」のステータスメッセージが画面に表示される
  // (1)金額計算検証：「請求明細の合計1,000,000円 = 請求書金額1,000,000円」と一致と表示
  await expect(page.locator('text=請求明細の合計')).toBeVisible();
  await expect(page.locator('text=1,000,000円')).toBeVisible();
  await expect(page.locator('text=一致')).toBeVisible();

  // (2)参照整合性検証：「請求書 ← 商談DEAL-001 ← 取引先CUST-001のチェーンが完全」と表示
  await expect(page.locator('text=参照整合性検証')).toBeVisible();
  await expect(page.locator('text=チェーンが完全')).toBeVisible();

  // (3)必須項目検証：「請求先・金額・明細・ステータスすべて入力済み」と表示
  await expect(page.locator('text=必須項目検証')).toBeVisible();
  await expect(page.locator('text=すべて入力済み')).toBeVisible();

  // (4)総合判定：「すべての検証ルールをクリア。再発行可能」と表示されて、
  // 「再発行を確定」ボタンが有効状態（クリック可能）になる
  await expect(page.locator('text=すべての検証ルールをクリア')).toBeVisible();
  await expect(page.locator('text=再発行可能')).toBeVisible();

  const confirmReissueBtn = page.locator('button:has-text("再発行を確定")').or(page.locator('[id="btn-confirm-reissue"]'));
  await expect(confirmReissueBtn).not.toBeDisabled();
});
