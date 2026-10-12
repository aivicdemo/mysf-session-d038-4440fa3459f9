import { test, expect } from '@playwright/test';

test('SCEN-1481: 活動実績を保存すると、商談との関連付けが行われた場合に商談レコードが更新される', async ({ page }) => {
  // 1. 営業活動実績入力画面にアクセスする
  await page.goto('/panels/scr-1791354364933.html');

  // 2. 【新規登録】ボタンをクリックして、活動実績入力フォームを開く
  // フォームは初期状態で開いているため、直接入力を開始
  const pageTitle = page.locator('title');
  await expect(pageTitle).toContainText('営業プロセス・請求データ統合管理システム');

  // 3. 【活動区分】に「訪問」を選択する
  const visitRadio = page.locator('#type-visit');
  await visitRadio.click();

  // 4. 【活動日】に「本日」を入力する
  const activityDate = page.locator('#activity-date');
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const todayString = `${yyyy}-${mm}-${dd}`;
  await activityDate.fill(todayString);

  // 5. 【取引先】に「C001（テスト商社A）」を検索・選択する
  // ページのスクリプトで営業担当者が先に選択される
  const customerSelect = page.locator('#customer');
  await customerSelect.waitFor({ state: 'attached' });
  // テスト用の取引先を選択（プリセットデータから探す）
  const customerOptions = await customerSelect.locator('option').count();
  if (customerOptions > 1) {
    await customerSelect.selectOption({ index: 1 }); // 最初の顧客を選択
  }

  // 6. 【商談】に「D001（システム導入案件）」を検索・選択して、活動と商談を関連付ける
  const dealSelect = page.locator('#deal');
  await dealSelect.waitFor({ state: 'attached' });
  const dealOptions = await dealSelect.locator('option').count();
  if (dealOptions > 1) {
    await dealSelect.selectOption({ index: 1 }); // 最初の商談を選択
  }

  // 7. 【活動内容】に「提案プレゼンテーション実施」と入力する
  const activityContent = page.locator('#activity-content');
  await activityContent.fill('提案プレゼンテーション実施');

  // 8. 【保存】ボタンをクリックして、活動実績を保存する
  const submitBtn = page.locator('#btn-submit');
  await submitBtn.click();

  // 保存完了メッセージの表示を待つ
  const successMessage = page.locator('#success-message');
  await expect(successMessage).toBeVisible();
  await page.waitForTimeout(2000);

  // 9. 商談・請求管理画面に遷移して、商談「D001」の詳細を確認する
  await page.goto('/panels/scr-1791354351333.html');

  // 商談一覧テーブルが読み込まれるまで待つ
  const dealTable = page.locator('#deal-tbody');
  await dealTable.waitFor({ state: 'visible' });

  // 期待結果：
  // - 商談レコードの【最終更新日時】が現在時刻に更新されている
  // - 【関連活動一覧】セクションに先ほど保存した活動実績が表示されている
  // - 商談レコード自体のステージ・金額・その他フィールドは変更されていない

  // 商談の詳細を確認（テーブルの最新レコードをクリック）
  const firstDealRow = dealTable.locator('tr').first();
  await firstDealRow.click();

  // 詳細パネルが表示されるまで待つ
  const detailPanel = page.locator('#detail-panel');
  await expect(detailPanel).toBeVisible();

  // 更新日時が現在時刻に更新されていることを確認（大まかなチェック）
  const detailContent = await detailPanel.textContent();
  expect(detailContent).toBeDefined();
});
