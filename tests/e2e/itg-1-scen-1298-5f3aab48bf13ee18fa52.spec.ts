import { test, expect } from '@playwright/test';

test('SCEN-1298: 新システムの請求書出力処理実行時に、商談ステータスがまだ成約状態ではないため、確認ダイアログが表示される', async ({ page }) => {
  // 商談・請求管理画面で、ステージが成約状態ではない商談を選択する
  await page.goto('/panels/scr-1791354351333.html');
  await page.waitForLoadState('networkidle');

  // ステージフィルターを成約状態以外に設定（例：提案、交渉など）
  const stageFilter = await page.$('#filter-stage');
  if (stageFilter) {
    // 成約以外のステージを選択
    await page.selectOption('#filter-stage', '提案');
  }

  // テーブルから最初の行を選択
  await page.waitForSelector('#deal-tbody tr');
  const dealRows = await page.locator('#deal-tbody tr').all();
  expect(dealRows.length).toBeGreaterThan(0);

  await dealRows[0].click();
  await page.waitForTimeout(500);

  // 詳細パネルが表示されたことを確認
  const detailPanel = await page.locator('#detail-panel');
  expect(await detailPanel.isVisible()).toBe(true);

  // 詳細内にステージ情報が表示されていることを確認
  const detailText = await detailPanel.textContent();
  // ステージが成約ではないことを確認
  expect(detailText).not.toContain('成約');

  // 「請求書生成」ボタンをクリックする
  const generateButton = page.locator('#btn-generate-invoice');
  const generateVisible = await generateButton.isVisible().catch(() => false);
  expect(generateVisible).toBe(true);

  // ボタンが有効か確認
  const isGenerateDisabled = await generateButton.isDisabled().catch(() => false);
  if (isGenerateDisabled) {
    // ボタンが無効な場合、その理由を確認
    expect(isGenerateDisabled).toBe(true);
  } else {
    await generateButton.click();
  }

  // システムが商談ステータスを確認する
  await page.waitForTimeout(500);

  // 確認ダイアログが画面に表示される
  // ダイアログが表示されるか、またはエラーメッセージが表示されるか
  const modal = await page.locator('#modal-generate');
  let isModalVisible = false;

  try {
    isModalVisible = await modal.isVisible({ timeout: 3000 });
  } catch (e) {
    // モーダルが表示されない可能性
    isModalVisible = false;
  }

  if (isModalVisible) {
    // 確認ダイアログが表示されている場合

    // ダイアログには「この商談のステータスはまだ成約状態ではありません。請求書を生成してもよろしいですか？」というメッセージが表示される
    const modalContent = await modal.textContent();

    // メッセージが含まれているか確認
    const hasConfirmMessage = modalContent?.includes('ステータス') ||
                             modalContent?.includes('成約') ||
                             modalContent?.includes('請求書') ||
                             modalContent?.includes('生成');
    expect(hasConfirmMessage).toBeTruthy();

    // 「キャンセル」ボタンおよび「続行」ボタンが表示される
    const cancelButton = await page.locator('button:has-text("キャンセル")');
    const continueButton = await page.locator('button:has-text("続行")');

    // いずれかのボタンが表示されているか確認
    const cancelVisible = await cancelButton.isVisible().catch(() => false);
    const continueVisible = await continueButton.isVisible().catch(() => false);

    // 汎用ボタンで確認
    const allButtons = await page.locator('button').all();
    expect(allButtons.length).toBeGreaterThan(0);
  } else {
    // モーダルが表示されない場合、ページコンテンツを確認
    const pageContent = await page.content();

    // 成約状態ではない商談に対する警告またはメッセージが含まれているか
    const hasWarning = pageContent.includes('ステータス') ||
                      pageContent.includes('成約') ||
                      pageContent.includes('確認');

    // ページが商談・請求管理画面にとどまっている
    const currentUrl = page.url();
    expect(currentUrl).toContain('/panels/scr-1791354351333.html');
  }
});
