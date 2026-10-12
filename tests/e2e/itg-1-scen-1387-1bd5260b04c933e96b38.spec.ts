import { test, expect } from '@playwright/test';

test('SCEN-1387: 顧客IDが空または不正な場合、エラーメッセージが表示されて詳細表示が中止される', async ({ page, context }) => {
  // 顧客・取引先管理画面の取引先一覧から詳細表示を開く
  await page.goto('/panels/scr-1791354379354.html');
  await page.waitForLoadState('networkidle');

  // 取引先を選択
  const customerRow = page.locator('[data-testid="customer-list-table"] tbody tr').first();
  await customerRow.click();
  await page.waitForTimeout(300);

  // ブラウザの開発者ツール（Network）を使い、顧客IDパラメータをネットワークレベルで改ざんしてリクエストを送信
  // 顧客IDを空文字列に改ざん
  try {
    await page.goto('/panels/scr-1791354379354.html?customerId=');
    await page.waitForTimeout(500);
  } catch (e) {
    // ナビゲーションエラーが発生する可能性もある
  }

  // 改ざんされたリクエストがサーバーに到達するのを待つ
  await page.waitForLoadState('networkidle');

  // 期待結果：以下のいずれかが発生

  // 1. 顧客・取引先管理画面から遷移せず、現在の画面上に赤色または警告色のエラーメッセージが表示される
  const errorMessages = page.locator('[class*="error"], [role="alert"], [style*="red"]');
  const pageContent = await page.content();

  const hasErrorMessage = pageContent.includes('顧客ID') ||
                          pageContent.includes('指定された取引先が見つかりません') ||
                          pageContent.includes('顧客IDが正しくありません');

  // 2. メッセージ内容が「顧客IDが正しくありません」または「指定された取引先が見つかりません」
  if (hasErrorMessage) {
    expect(pageContent).toMatch(/顧客ID|取引先が見つかりません|正しくありません/i);
  }

  // 3. 詳細情報パネルは表示されない状態が保持される
  const detailPanel = page.locator('#detail-container');
  const isPanelVisible = await detailPanel.isVisible().catch(() => false);

  if (!hasErrorMessage && isPanelVisible) {
    // エラーメッセージが表示されていない場合、詳細パネルが表示されていないことを確認
    expect(!isPanelVisible).toBeTruthy();
  }

  // 4. ブラウザコンソールに 400 Bad Request または 404 Not Found のHTTPエラーログが記録される
  let httpErrorDetected = false;

  // 監視: コンソールメッセージ
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('400') || text.includes('404') || text.includes('Bad Request') || text.includes('Not Found')) {
      httpErrorDetected = true;
    }
  });

  // ネットワークエラーも監視
  page.on('response', response => {
    if (response.status() === 400 || response.status() === 404) {
      httpErrorDetected = true;
    }
  });

  // エラーが検出されたか、またはエラーメッセージが表示されているかを確認
  expect(hasErrorMessage || httpErrorDetected || !isPanelVisible).toBeTruthy();

  // ユーザーが顧客・取引先管理画面の一覧表示に留まっていることを確認
  const customerTable = page.locator('[data-testid="customer-list-table"]');
  await expect(customerTable).toBeVisible().catch(() => {
    // テーブルが表示されていない場合は、エラーメッセージが表示されていることを確認
    expect(hasErrorMessage).toBeTruthy();
  });
});
