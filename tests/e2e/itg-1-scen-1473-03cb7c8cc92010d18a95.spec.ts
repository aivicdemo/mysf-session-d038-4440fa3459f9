import { test, expect } from '@playwright/test';

test.describe('SCEN-1473: 取引先から活動登録 - 検証エラー', () => {
  test('対象取引先が登録済みマスタに存在しない、または削除済みのステータスで保存しようとすると、検証エラーとなり保存が拒否される', async ({ page }) => {
    // 画面を開く
    await page.goto('/panels/scr-1791354364933.html');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 営業担当者を選択（デフォルト）
    const salesPersonSelect = page.locator('#sales-person');
    await expect(salesPersonSelect).toBeVisible();

    // 営業担当者の選択肢が存在することを確認
    const salesPersonOptions = await salesPersonSelect.locator('option').count();
    expect(salesPersonOptions).toBeGreaterThan(1);

    // 営業担当者を選択（最初の有効な選択肢を自動的に選択される）
    const firstSalesPersonId = await salesPersonSelect.locator('option').nth(1).getAttribute('value');
    await salesPersonSelect.selectOption(firstSalesPersonId);

    // 取引先セレクトが更新されるのを待機
    await page.waitForTimeout(300);

    // 取引先フィールドを操作
    const customerSelect = page.locator('#customer');
    await expect(customerSelect).toBeVisible();

    // 手動入力: 存在しない取引先ID（CUS-999）を入力
    // 注: select要素への直接入力はできないため、スクリプト実行で存在しない値を設定
    await page.evaluate(() => {
      const select = document.querySelector('#customer') as HTMLSelectElement;
      if (select) {
        // 存在しないvalue（CUS-999）を作成してセット
        const option = document.createElement('option');
        option.value = 'CUS-999';
        option.text = '存在しない取引先';
        select.appendChild(option);
        select.value = 'CUS-999';

        // changeイベントをトリガー
        const event = new Event('change', { bubbles: true });
        select.dispatchEvent(event);
      }
    });

    // 活動タイプを選択
    const visitRadio = page.locator('#type-visit');
    await visitRadio.check();

    // 活動日付を設定
    const activityDate = page.locator('#activity-date');
    const today = new Date().toISOString().split('T')[0];
    await activityDate.fill(today);

    // 活動内容を入力
    const activityContent = page.locator('#activity-content');
    await activityContent.fill('テスト営業活動');

    // 保存ボタンをクリック
    const submitBtn = page.locator('#btn-submit');
    await submitBtn.click();

    // エラーメッセージが表示されるのを待機
    await page.waitForTimeout(500);

    // 取引先フィールドの下に赤色のエラーメッセージが表示されていることを確認
    const customerField = page.locator('#customer').locator('..').filter({ has: page.locator('.form-field') });
    const customerFormField = page.locator('.form-field').filter({ has: page.locator('#customer') });
    await expect(customerFormField).toHaveClass(/error/);

    const errorMessage = customerFormField.locator('.error-message');
    await expect(errorMessage).toBeVisible();

    // エラーメッセージのテキストを確認
    const errorText = await errorMessage.textContent();
    expect(errorText).toContain('選択された取引先は登録済みマスタに存在しないか、削除済みのため保存できません');

    // フォーム入力内容が保持されていることを確認
    await expect(activityContent).toHaveValue('テスト営業活動');

    // 保存が実行されず、画面状態が変わっていないことを確認
    await expect(submitBtn).toBeVisible();
  });

  test('削除済みステータスの取引先で保存しようとすると、検証エラーとなり保存が拒否される', async ({ page }) => {
    // 画面を開く
    await page.goto('/panels/scr-1791354364933.html');

    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 営業担当者を選択
    const salesPersonSelect = page.locator('#sales-person');
    const firstSalesPersonId = await salesPersonSelect.locator('option').nth(1).getAttribute('value');
    await salesPersonSelect.selectOption(firstSalesPersonId);

    // 取引先セレクトが更新されるのを待機
    await page.waitForTimeout(300);

    // 削除済みの取引先を手動でセット
    await page.evaluate(() => {
      const select = document.querySelector('#customer') as HTMLSelectElement;
      if (select) {
        // 削除済み取引先（ステータス=無効）を作成
        const option = document.createElement('option');
        option.value = 'DELETE-001';
        option.text = '削除済み取引先';
        select.appendChild(option);
        select.value = 'DELETE-001';

        // changeイベントをトリガー
        const event = new Event('change', { bubbles: true });
        select.dispatchEvent(event);
      }
    });

    // 活動タイプを選択
    const phoneRadio = page.locator('#type-phone');
    await phoneRadio.check();

    // 活動日付を設定
    const activityDate = page.locator('#activity-date');
    const today = new Date().toISOString().split('T')[0];
    await activityDate.fill(today);

    // 保存ボタンをクリック
    const submitBtn = page.locator('#btn-submit');
    await submitBtn.click();

    // エラーメッセージが表示されるのを待機
    await page.waitForTimeout(500);

    // 取引先フィールドにエラーが表示されていることを確認
    const customerFormField2 = page.locator('.form-field').filter({ has: page.locator('#customer') });
    await expect(customerFormField2).toHaveClass(/error/);

    const errorMessage2 = customerFormField2.locator('.error-message');
    await expect(errorMessage2).toBeVisible();

    const errorText2 = await errorMessage2.textContent();
    expect(errorText2).toContain('選択された取引先は登録済みマスタに存在しないか、削除済みのため保存できません');

    // 正しい取引先を選択して再度保存を試みることができる状態を確認
    const customerSelect = page.locator('#customer');
    const validOptions = await customerSelect.locator('option').count();
    expect(validOptions).toBeGreaterThan(2); // 元々の選択肢が複数ある
  });
});
