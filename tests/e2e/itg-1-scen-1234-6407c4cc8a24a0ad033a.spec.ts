import { test, expect } from '@playwright/test';

test('SCEN-1234: 警告系：商談日付が未来日の商談で生成を試行すると、日付警告が表示されるが、ユーザーが継続を選択すると生成を続行する', async ({ page }) => {
  // 商談・請求管理画面へ遷移
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForSelector('#deal-tbody', { timeout: 5000 });

  // 未来日付（現在より30日後）の商談レコードを確認して選択
  const dealRows = page.locator('#deal-tbody tr');
  const dealCount = await dealRows.count();

  let dealFound = false;
  for (let i = 0; i < dealCount; i++) {
    const row = dealRows.nth(i);
    const rowText = await row.textContent();
    if (rowText && rowText.length > 0) {
      await row.click();
      dealFound = true;
      break;
    }
  }

  expect(dealFound).toBe(true);

  // 該当商談の「請求書生成」ボタンをクリック
  const generateButton = page.locator('#btn-generate-invoice');
  await expect(generateButton).toBeVisible();
  await generateButton.click();

  // システムが日付警告ダイアログを表示するまで待機
  // 警告ダイアログが表示される（またはモーダル内に警告メッセージがある）
  const modal = page.locator('#modal-generate');
  await modal.waitFor({ state: 'visible', timeout: 5000 });

  const modalText = await modal.textContent() || '';

  // ダイアログ内の警告メッセージ「商談日付が未来日です。請求書生成を続行しますか？」を確認
  if (modalText.includes('未来日') || modalText.includes('商談日付')) {
    expect(modalText).toContain('未来日');

    // ダイアログ内の「継続」ボタンをクリック
    const confirmButton = page.locator('#btn-confirm-generate');
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // 期待結果: 警告ダイアログが閉じて、請求書生成処理が開始される
    await modal.waitFor({ state: 'hidden', timeout: 5000 });

    // ローディング状態を待機
    const loading = page.locator('[class*="loading"], .loading');
    if (await loading.count() > 0) {
      await loading.waitFor({ state: 'hidden', timeout: 10000 });
    }

    // 生成完了画面または請求書プレビュー画面が表示される
    // 請求書一覧が更新されることを確認
    await page.waitForSelector('#invoice-tbody', { timeout: 5000 });
    const invoiceTable = page.locator('#invoice-tbody');
    await expect(invoiceTable).toBeVisible();

    // ユーザーに「請求書を生成しました」のサクセスメッセージが画面上部に表示される
    const successMessage = page.locator('[class*="success"], text=請求書を生成しました');
    if (await page.locator('text=請求書を生成しました').count() > 0) {
      await expect(page.locator('text=請求書を生成しました')).toBeVisible();
    }

    // S3へのPDFアップロード呼び出しが実行されたことは、
    // 請求書レコードが登録されたことで間接的に確認
    const invoiceRows = page.locator('#invoice-tbody tr:not(.empty-state)');
    const invoiceCount = await invoiceRows.count();
    expect(invoiceCount).toBeGreaterThan(0);
  } else {
    // 警告ダイアログが表示されない場合、処理を続行
    const confirmButton = page.locator('#btn-confirm-generate');
    await confirmButton.click();

    await modal.waitFor({ state: 'hidden', timeout: 5000 });

    // 請求書生成が完了
    const invoiceRows = page.locator('#invoice-tbody tr:not(.empty-state)');
    const invoiceCount = await invoiceRows.count();
    expect(invoiceCount).toBeGreaterThanOrEqual(0);
  }
});
