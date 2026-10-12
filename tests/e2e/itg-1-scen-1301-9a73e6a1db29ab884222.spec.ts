import { test, expect } from '@playwright/test';

test('SCEN-1301: 再発行対象の商談基本情報（7属性）が取得され、画面に表示される', async ({ page }) => {
  // ブラウザで「商談・請求管理画面」にアクセス
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('[id="deal-tbody"]');

  // 検索条件に商談ID『DL-2025-001』を入力して検索ボタンをクリック
  const filterField = page.locator('[id="filter-customer"]');
  await filterField.fill('DL-2025-001');

  // 検索結果に該当の商談行が表示されたことを確認
  const dealRow = page.locator('[id="deal-tbody"] tr').first();
  await expect(dealRow).toBeVisible();

  // その行の「再発行」ボタンをクリック
  await dealRow.click();
  const reissueBtn = page.locator('[id="btn-reissue-invoice"]');
  await expect(reissueBtn).toBeVisible();
  await reissueBtn.click();

  // 請求書再発行確定ダイアログが開き、画面に以下の商談基本情報が表示されるまで待機
  const modal = page.locator('[id="modal-reissue"]');
  await expect(modal).toBeVisible();

  // 期待結果：請求書再発行確定ダイアログに以下の情報が正確に表示されること
  // - 商談ID：『DL-2025-001』
  await expect(modal.locator('text=DL-2025-001')).toBeVisible();

  // - 取引先ID：『ACC-5001』
  await expect(modal.locator('text=ACC-5001')).toBeVisible();

  // - 営業担当者ID：『SALES-0042』
  await expect(modal.locator('text=SALES-0042')).toBeVisible();

  // - 商談名：『○○システム導入』
  await expect(modal.locator('text=○○システム導入')).toBeVisible();

  // - 商談金額：『¥5,000,000』（通貨記号付き、3桁区切り表示）
  await expect(modal.locator('text=5,000,000')).toBeVisible();

  // - ステージ：『成約』
  await expect(modal.locator('text=成約')).toBeVisible();

  // - 成約日：『2025年1月15日』（YYYY年M月D日形式）
  await expect(modal.locator('text=2025年1月15日')).toBeVisible();

  // 各項目は読み取り専用の表示フィールドとして表示され、編集は不可
  const confirmBtn = modal.locator('[id="btn-confirm-reissue"]');
  const cancelBtn = modal.locator('[id="btn-cancel-reissue"]');

  // ダイアログには「確定」「キャンセル」の2つのボタンが存在
  await expect(confirmBtn).toBeVisible();
  await expect(cancelBtn).toBeVisible();
});
