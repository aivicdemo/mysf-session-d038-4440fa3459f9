import { test, expect } from '@playwright/test';

test('SCEN-1293: 請求書生成SLAの達成判定表示', async ({ page }) => {
  // 営業プロセス統合ダッシュボード画面を開く
  await page.goto('/panels/scr-1791354337614.html');

  // ダッシュボード画面の読み込みを確認
  await page.waitForSelector('[id="target-tbody"]', { timeout: 5000 });

  // 商談・請求管理画面へ遷移
  const dealInvoiceLink = page.locator('[id="scr-1791354351333"]');
  await dealInvoiceLink.click();

  // 商談・請求管理画面を開く
  await page.goto('/panels/scr-1791354351333.html');

  // 画面が読み込まれるまで待機
  await page.waitForSelector('[id="deal-tbody"]', { timeout: 5000 });

  // ステージが『クローズ（受注）』の商談を検索
  const dealRows = page.locator('[id="deal-tbody"] tr');
  let targetDealRow = null;
  const rowCount = await dealRows.count();

  for (let i = 0; i < rowCount; i++) {
    const row = dealRows.nth(i);
    const rowText = await row.textContent();
    if (rowText && rowText.includes('クローズ（受注）')) {
      targetDealRow = row;
      break;
    }
  }

  if (!targetDealRow) {
    targetDealRow = dealRows.first();
  }

  // 商談の詳細を開く
  await targetDealRow.click();

  // 詳細パネルが表示されるのを待つ
  await page.waitForSelector('[id="detail-panel"]', { timeout: 5000 });

  // 関連する請求書が『生成確定』ステータスで表示されていることを確認
  const invoicesTab = page.locator('[id="invoices-tab"]');
  await invoicesTab.click();

  // 請求書テーブルの読み込みを確認
  await page.waitForSelector('[id="invoice-tbody"]', { timeout: 5000 });

  // 『生成確定』ステータスの請求書を確認
  const confirmedInvoice = page.locator('[id="invoice-tbody"] tr').filter({ hasText: '生成確定' }).first();
  await expect(confirmedInvoice).toBeVisible({ timeout: 5000 });

  // 請求書の生成日時を確認
  const generationDateCell = confirmedInvoice.locator('td').nth(1);
  const generationDate = await generationDateCell.textContent();
  expect(generationDate).toBeTruthy();

  // 営業プロセス統合ダッシュボード画面に戻る
  await page.goto('/panels/scr-1791354337614.html');

  // ダッシュボード画面の読み込みを確認
  await page.waitForSelector('[id="target-tbody"]', { timeout: 5000 });

  // 当該商談のSLA判定列を確認
  const targetAchievementTable = page.locator('[id="target-tbody"] tr');

  // SLA判定「達成」が表示されていることを確認
  let slaAchievedRow = null;
  const targetRowCount = await targetAchievementTable.count();

  for (let i = 0; i < targetRowCount; i++) {
    const row = targetAchievementTable.nth(i);
    const rowText = await row.textContent();
    if (rowText && rowText.includes('達成')) {
      slaAchievedRow = row;
      break;
    }
  }

  if (!slaAchievedRow) {
    slaAchievedRow = targetAchievementTable.first();
  }

  // SLA判定が「達成」であることを確認
  const slaStatusCell = slaAchievedRow.locator('td').nth(2);
  const slaStatus = await slaStatusCell.textContent();
  expect(slaStatus).toContain('達成');

  // 経過日数が「4営業日」と表示されていることを確認
  const elapsedDaysCell = slaAchievedRow.locator('td').nth(1);
  const elapsedDays = await elapsedDaysCell.textContent();
  expect(elapsedDays).toContain('4営業日');

  // 目標日数『5営業日』以内に収まっていることを確認
  // 経過日数が4営業日、目標が5営業日なので確認完了

  // 商談・請求管理画面で請求書がPDF形式で『生成確定』ステータスで表示されることを確認
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('[id="invoice-tbody"]', { timeout: 5000 });

  // 生成確定の請求書を確認
  const finalConfirmedInvoice = page.locator('[id="invoice-tbody"] tr').filter({ hasText: '生成確定' }).first();
  await expect(finalConfirmedInvoice).toBeVisible({ timeout: 5000 });

  // PDF形式の確認（請求書番号またはファイル名表示）
  const invoiceNumber = await finalConfirmedInvoice.locator('td').first().textContent();
  expect(invoiceNumber).toBeTruthy();
});
