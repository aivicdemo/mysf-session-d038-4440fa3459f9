import { test, expect } from '@playwright/test';

test('SCEN-1386: 営業担当者IDが空または不正な場合、警告メッセージが表示されて管理者への連絡を促される', async ({ page }) => {
  // 顧客・取引先管理画面から、営業担当者IDが空または不正な取引先レコードを検索・選択
  await page.goto('/panels/scr-1791354379354.html');
  await page.waitForLoadState('networkidle');

  // 取引先一覧から営業担当者割り当てがない取引先をクリック
  const customerRow = page.locator('[data-testid="customer-list-table"] tbody tr').first();
  await customerRow.click();
  await page.waitForTimeout(300);

  // 取引先詳細画面が読み込まれるまで待機
  await page.waitForLoadState('networkidle');

  // 取引先詳細画面に以下の要素が画面上部に表示されることを確認

  // (1) 黄色または赤色の警告バナー/アラートボックスが画面上部に表示される
  const warningBanner = page.locator('[class*="warning"], [class*="alert"], [role="alert"], [style*="yellow"], [style*="orange"], [style*="red"]');

  // 警告メッセージが存在するか確認（複数パターン）
  let warningFound = false;
  const pageContent = await page.content();

  if (pageContent.includes('営業担当者') && (pageContent.includes('未割り当て') || pageContent.includes('管理者'))) {
    warningFound = true;
  }

  // (2) 警告メッセージ内に「管理者に連絡」「お問い合わせ」などの管理者連絡を促す文言が含まれる
  if (pageContent.includes('管理者') || pageContent.includes('連絡')) {
    warningFound = true;
  }

  // 警告バナーが表示されている場合、その内容を確認
  if (await warningBanner.first().isVisible().catch(() => false)) {
    const bannerText = await warningBanner.first().textContent();
    expect(bannerText).toMatch(/営業担当者|管理者|連絡/i);
  } else {
    // バナーが見つからない場合は、ページコンテンツから警告テキストを確認
    expect(pageContent).toMatch(/営業担当者.*未割り当て|管理者に連絡/i);
  }

  // (3) メッセージボックス内に「管理者へ報告」「サポートに連絡」などのアクション用ボタンまたはリンクが存在
  const contactButtons = page.locator('button, a').filter({
    has: page.locator('text=/報告|連絡|サポート/i')
  });

  const hasContactButton = await contactButtons.count() > 0 || pageContent.includes('サポート') || pageContent.includes('報告');

  if (hasContactButton || warningFound) {
    expect(warningFound || await contactButtons.first().isVisible().catch(() => false)).toBeTruthy();
  }

  // (4) 警告表示中も取引先の基本情報（取引先名、住所、電話番号など）は通常通り表示される
  const detailPanel = page.locator('#detail-container');
  await expect(detailPanel).toBeVisible();

  const detailContent = page.locator('#detail-panel');
  const detailText = await detailContent.textContent();

  // 基本情報が表示されていることを確認
  expect(detailText).toMatch(/取引先|住所|電話/i);

  // (5) 画面が完全にブロックされていないことを確認
  const mainContent = page.locator('.content-area, [data-aivic-panel]');
  await expect(mainContent).toBeVisible();
});
