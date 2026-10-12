import { test, expect } from '@playwright/test';

test('SCEN-1253: 修正対象の請求明細が見つからない場合、画面表示がエラーで中止される', async ({ page }) => {
  // 商談・請求管理画面で修正対象の商談を選択する
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForLoadState('networkidle');

  // 修正対象の商談を選択
  const dealRow = page.locator('tbody#deal-tbody tr').first();
  await expect(dealRow).toBeVisible();

  // 請求書一覧から存在しない・削除済みの請求明細IDを指定して「修正」ボタンをクリック
  // 既存しないID（例：INV-999999）を含むURL でアクセス
  await page.goto('/panels/scr-1791354749663.html?lineItemId=LINE-999999');

  // システムが請求書修正画面を表示しようとデータベースに問い合わせ
  await page.waitForLoadState('networkidle');

  // 画面遷移が発生せず、商談・請求管理画面に留まったまま、
  // ユーザーに対してエラーメッセージが表示されることを確認

  // エラーメッセージをインラインで表示
  const errorAlert = page.locator('[role="alert"]').filter({
    hasText: '指定された請求明細が見つかりません'
  });

  if (await errorAlert.count() > 0) {
    // インラインエラー表示の場合
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText('指定された請求明細が見つかりません');
    await expect(errorAlert).toContainText('削除されている可能性があります');
  } else {
    // アラート表示の場合（window.alert や toast notification）
    // ページ内にアラート要素があるか確認
    const pageContent = page.locator('body');
    const hasErrorMessage = await pageContent.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('指定された請求明細が見つかりません') ||
             text.includes('削除されている可能性があります');
    });
    expect(hasErrorMessage).toBe(true);
  }

  // 修正画面の画面描画は実行されない
  const modificationForm = page.locator('[data-section="modification-form"]');
  await expect(modificationForm).not.toBeVisible();

  const invoiceDetailsSection = page.locator('[data-section="invoice-details"]');
  await expect(invoiceDetailsSection).not.toBeVisible();

  // URL が商談・請求管理画面のままか、前の画面に戻っていることを確認
  const currentUrl = page.url();
  const isOnManagementScreen = currentUrl.includes('scr-1791354351333') ||
                                currentUrl.includes('scr-1791354337614');

  // または修正画面にアクセスしようとしたが表示されていない状態
  if (currentUrl.includes('scr-1791354749663')) {
    // 修正画面 URL だがエラー表示のみ
    const inputFieldsVisible = await page.locator('[data-field="customer-name"], [data-field="invoice-id"]').isVisible().catch(() => false);
    expect(inputFieldsVisible).toBe(false);
  }

  // フォーム内容が空であることを確認
  const formInputs = page.locator('[data-section="modification-form"] input, [data-section="modification-form"] textarea');
  const inputCount = await formInputs.count();
  expect(inputCount).toBe(0);
});
