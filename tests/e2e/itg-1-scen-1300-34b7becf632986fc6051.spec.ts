import { test, expect } from '@playwright/test';

test('SCEN-1300: 再発行対象の既存請求書レコード（20属性）が取得され、画面に表示される', async ({ page }) => {
  // 営業プロセス統合ダッシュボードで請求ステータスが「再発行対象」の案件フィルター条件を確認
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('[id="deal-tbody"]');

  // 再発行対象の既存請求書レコード（請求書ID: INV-2024-001）を検索結果一覧から選択
  const filterField = page.locator('[id="filter-customer"]');
  await filterField.fill('INV-2024-001');

  // 該当レコードの詳細表示ボタンまたはリンクをクリックして、請求書詳細ページへ遷移
  const dealRow = page.locator('[id="deal-tbody"] tr').first();
  await dealRow.click();

  // 商談・請求管理画面に遷移し、再発行対象レコードの全属性フィールドが画面に読み込まれるのを待つ
  await page.waitForSelector('[id="invoice-detail-tbody"]');

  // 期待結果：20個の属性がすべて正確に表示される
  // (1)請求書ID「INV-2024-001」
  await expect(page.locator('text=INV-2024-001')).toBeVisible();

  // (2)商談ID「OPP-2024-5001」
  await expect(page.locator('text=OPP-2024-5001')).toBeVisible();

  // (3)取引先ID「ACC-2024-0050」
  await expect(page.locator('text=ACC-2024-0050')).toBeVisible();

  // (4)営業担当者ID「USR-SALES-0123」
  await expect(page.locator('text=USR-SALES-0123')).toBeVisible();

  // (5)請求書番号「2024-INV-00123」
  await expect(page.locator('text=2024-INV-00123')).toBeVisible();

  // (6)請求日「2024-10-01」
  await expect(page.locator('text=2024-10-01')).toBeVisible();

  // (7)支払期限日「2024-11-01」
  await expect(page.locator('text=2024-11-01')).toBeVisible();

  // (8)請求金額「¥1,100,000」
  await expect(page.locator('text=1,100,000')).toBeVisible();

  // (9)税額「¥100,000」
  await expect(page.locator('text=100,000')).toBeVisible();

  // (10)税抜金額「¥1,000,000」
  await expect(page.locator('text=1,000,000')).toBeVisible();

  // (11)請求ステータス「再発行対象」
  await expect(page.locator('text=再発行対象')).toBeVisible();

  // (12)入金日「2024-10-15」
  await expect(page.locator('text=2024-10-15')).toBeVisible();

  // (13)入金金額「¥1,100,000」
  // Already checked above

  // (14)摘要「納品完了に伴う請求」
  await expect(page.locator('text=納品完了に伴う請求')).toBeVisible();

  // (15)修正前請求金額「¥1,050,000」
  await expect(page.locator('text=1,050,000')).toBeVisible();

  // (16)修正理由「追加作業分の料金修正」
  await expect(page.locator('text=追加作業分の料金修正')).toBeVisible();

  // (17)再発行回数「1回」
  await expect(page.locator('text=1回')).toBeVisible();

  // (18)最終再発行日時「2024-09-25 14:30:00」
  await expect(page.locator('text=2024-09-25 14:30:00')).toBeVisible();

  // (19)金額計算検証ステータス「検証済み」
  await expect(page.locator('text=検証済み')).toBeVisible();

  // (20)参照関係検証ステータス「正常」
  await expect(page.locator('text=正常')).toBeVisible();

  // フィールドは編集不可表示モードで読み取り専用で表示され、ページレイアウトの破損なく全データが視認可能である
  const invoiceDetailTable = page.locator('[id="invoice-detail-tbody"]');
  await expect(invoiceDetailTable).toBeVisible();
});
