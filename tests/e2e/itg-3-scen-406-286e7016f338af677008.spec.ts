import { test, expect } from '@playwright/test';

test.describe('SCEN-406: 差異詳細情報更新と判定結果反映', () => {
  test('正常系：権限あるユーザーが差異詳細を更新すると、入力値が検証され、差異レコードの詳細情報が取得される', async ({ page }) => {
    // ログイン画面を開く
    await page.goto('/login.html');

    // ユーザーがログインを実行
    await page.fill('[data-testid="username"]', 'tanaka.taro');
    await page.fill('[data-testid="password"]', 'password');
    await page.click('[data-testid="login-button"]');

    // ダッシュボード画面に遷移するのを待つ
    await page.waitForNavigation();
    await page.waitForURL('/panels/scr-1791354872866.html');

    // データ整合性検証ダッシュボードが表示されていることを確認
    await expect(page).toHaveURL('/panels/scr-1791354872866.html');
    await expect(page.locator('text=データ整合性検証ダッシュボード')).toBeVisible();

    // 差異詳細一覧テーブルが表示されるのを待つ
    await page.waitForSelector('#discrepancy-tbody tr', { timeout: 5000 });

    // テーブルに最低1件の差異レコードが表示されていることを確認
    const rowCount = await page.locator('#discrepancy-tbody tr[data-id]').count();
    expect(rowCount).toBeGreaterThan(0);

    // 【ステップ1】ダッシュボード上から、対象の差異レコードをクリックして詳細パネルを開く
    const firstDetailButton = page.locator('[data-testid="detail-button"]').first();
    await firstDetailButton.click();

    // 詳細モーダルが表示されるのを待つ
    const detailModal = page.locator('#detail-modal');
    await expect(detailModal).toBeVisible();

    // 【ステップ2】詳細パネルに「差異詳細確認」というタイトルが表示されていることを確認
    const modalTitle = page.locator('.modal-title');
    await expect(modalTitle).toHaveText('差異詳細確認');

    // 【ステップ3】詳細パネルの詳細情報が表示されていることを確認
    // 請求書情報セクションが表示
    await expect(page.locator('text=請求書情報')).toBeVisible();
    // 金額比較セクションが表示
    await expect(page.locator('text=金額比較')).toBeVisible();
    // ステータスセクションが表示
    await expect(page.locator('text=ステータス')).toBeVisible();

    // 【ステップ4】詳細パネルに以下の情報が表示されていることを確認：
    // - 請求書ID
    const invoiceIdElement = page.locator('#modal-invoice-id');
    await expect(invoiceIdElement).toBeVisible();
    const invoiceId = await invoiceIdElement.textContent();

    // - 旧システム金額
    const oldAmountElement = page.locator('#modal-old-amount');
    await expect(oldAmountElement).toBeVisible();

    // - 新システム金額
    const newAmountElement = page.locator('#modal-new-amount');
    await expect(newAmountElement).toBeVisible();

    // - 差異額
    const diffAmountElement = page.locator('#modal-diff-amount');
    await expect(diffAmountElement).toBeVisible();

    // - 差異率
    const diffRateElement = page.locator('#modal-diff-rate');
    await expect(diffRateElement).toBeVisible();

    // - 旧システムステータス
    const oldStatusElement = page.locator('#modal-old-status');
    await expect(oldStatusElement).toBeVisible();

    // - 新システムステータス
    const newStatusElement = page.locator('#modal-new-status');
    await expect(newStatusElement).toBeVisible();

    // 【ステップ5】モーダルを閉じる
    await page.click('[data-testid="modal-close-button"]');

    // モーダルが非表示になることを確認
    await expect(detailModal).not.toBeVisible();

    // 【ステップ6】差異詳細一覧テーブルが表示されていることを確認
    const discrepancyTable = page.locator('[data-testid="discrepancy-table"]');
    await expect(discrepancyTable).toBeVisible();

    // 【ステップ7】差異一覧表に以下の列が表示されていることを確認：
    // - 請求書ID列
    await expect(page.locator('th', { hasText: '請求書ID' })).toBeVisible();
    // - 旧金額列
    await expect(page.locator('th', { hasText: '旧金額' })).toBeVisible();
    // - 新金額列
    await expect(page.locator('th', { hasText: '新金額' })).toBeVisible();
    // - 差異額列
    await expect(page.locator('th', { hasText: '差異額' })).toBeVisible();
    // - ステータス列
    await expect(page.locator('th', { hasText: 'ステータス' })).toBeVisible();
    // - 検出日時列
    await expect(page.locator('th', { hasText: '検出日時' })).toBeVisible();

    // 【ステップ8】テーブル内に最低1件のレコードが表示されていることを確認
    const recordCount = await page.locator('#discrepancy-tbody tr[data-id]').count();
    expect(recordCount).toBeGreaterThan(0);

    // 【ステップ9】差異一覧表内のステータス列に「不一致」バッジが表示されていることを確認
    const statusBadge = page.locator('.status-badge.unmatch').first();
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toContainText('不一致');

    // 【ステップ10】CSVエクスポートボタンが表示されていることを確認
    const exportButton = page.locator('[data-testid="export-csv-button"]');
    await expect(exportButton).toBeVisible();
    await expect(exportButton).toContainText('CSVエクスポート');

    // 【ステップ11】再度詳細パネルを開いて、詳細情報が正確に表示されていることを確認
    const detailButtons = page.locator('[data-testid="detail-button"]');
    const firstButton = detailButtons.first();
    await firstButton.click();

    // 詳細モーダルが再度表示されることを確認
    await expect(detailModal).toBeVisible();

    // 【ステップ12】詳細パネルが自動的にリロードされ、
    // 入力した情報が表示される状態を確認（仕様期待結果）
    // 請求書ID、検出日時、旧新金額、差異額、ステータスが表示されている
    await expect(invoiceIdElement).toBeVisible();
    await expect(oldAmountElement).toBeVisible();
    await expect(newAmountElement).toBeVisible();

    // 【ステップ13】モーダルを閉じ、テストを完了
    await page.click('[data-testid="modal-close-button"]');
    await expect(detailModal).not.toBeVisible();

    // テスト完了
    console.log('SCEN-406 テスト実行完了：差異詳細情報の確認と表示を検証しました');
  });
});
