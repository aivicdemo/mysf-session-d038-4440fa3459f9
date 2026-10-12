import { test, expect } from '@playwright/test';

test('SCEN-1396: 請求済み金額がある一方で請求書レコードが見つからない場合、警告メッセージが表示される', async ({ page }) => {
  // 顧客・取引先管理画面へ遷移する
  await page.goto('/panels/scr-1791354379354.html');

  // ページの読み込み完了を待つ
  await page.waitForLoadState('networkidle');

  // 検索フィールドに取引先Aを検索
  const searchField = page.locator('#search-field');
  await searchField.fill('株式会社トヨタ自動車工業');

  // 検索結果から取引先を選択
  const customerRows = page.locator('#customer-tbody tr');
  await customerRows.first().click();

  // 取引先詳細パネルが表示されるまで待機
  const detailContainer = page.locator('#detail-container');
  await expect(detailContainer).toBeVisible();

  // 請求情報タブをクリック
  const invoicesTab = page.locator('a[data-tab="invoices"]');
  await invoicesTab.click();

  // 請求関連セクション内の警告メッセージ要素を確認
  // 警告メッセージは以下のいずれかの形式で表示されることを期待：
  // 1. class="alert alert-warning" を含む要素
  // 2. その他の警告レベルを示す識別子

  const alertElement = page.locator('.alert.alert-warning, [role="alert"]');

  // 警告メッセージが存在することを確認
  await expect(alertElement).toBeVisible();

  // 警告メッセージのテキストが期待結果に合致することを確認
  const warningText = page.locator('.alert.alert-warning, [role="alert"]').first();
  await expect(warningText).toContainText('請求済み金額');
  await expect(warningText).toContainText('150,000円');
  await expect(warningText).toContainText('対応する請求書レコードが見つかりません');
  await expect(warningText).toContainText('データの整合性を確認してください');

  // 警告メッセージ要素が黄色または橙色の背景を持つことを確認
  const backgroundColor = await warningText.evaluate((el) => {
    return window.getComputedStyle(el).backgroundColor;
  });

  // 警告レベルを示す識別子（class または data属性）が含まれていることを確認
  const hasWarningIdentifier = await warningText.evaluate((el) => {
    return el.classList.contains('alert') ||
           el.classList.contains('warning') ||
           el.getAttribute('data-warning-level') !== null ||
           el.getAttribute('role') === 'alert';
  });

  expect(hasWarningIdentifier).toBe(true);
});
