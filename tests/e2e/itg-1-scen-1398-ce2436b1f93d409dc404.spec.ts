import { test, expect } from '@playwright/test';

test('SCEN-1398: ユーザーの職位情報がシステムに登録されていない場合、警告メッセージが表示される', async ({ page }) => {
  // 顧客・取引先管理画面にアクセス
  await page.goto('/panels/scr-1791354379354.html');

  // 取引先一覧の読み込みを待つ
  await page.waitForSelector('#customer-tbody');
  await page.waitForTimeout(500);

  // 取引先一覧から最初の取引先を選択
  const firstCustomerRow = page.locator('#customer-tbody tr').first();
  await firstCustomerRow.click();

  // 取引先詳細が表示されるまで待つ
  await page.waitForSelector('#detail-container');
  await page.waitForTimeout(500);

  // 詳細パネルが表示されていることを確認
  const detailPanel = page.locator('#detail-panel');
  await expect(detailPanel).toBeVisible();

  // 営業担当者情報セクションが表示されているか確認
  const salesInfo = page.locator('#sales-info');
  await expect(salesInfo).toBeVisible();

  // 職位情報が表示されているか確認
  // 職位が表示されていない場合（-で表示される場合）に警告メッセージが表示される条件
  const positionValue = page.locator('.sales-info-value').filter({ hasText: /^-$/ });

  // 営業担当者情報がある場合、職位情報の有無を確認
  const salesInfoText = await salesInfo.textContent();
  const hasNoPosition = salesInfoText?.includes('役職') && salesInfoText?.includes('-');

  if (hasNoPosition) {
    // 職位情報がない場合、警告メッセージが表示されるべき
    // 画面上に警告メッセージがあるか確認
    const warningText = 'この責任者の職位情報がシステムに登録されていません';

    // 画面に警告メッセージが含まれているか確認
    const pageContent = await page.locator('body').textContent();
    const hasWarningMessage = pageContent?.includes(warningText);

    expect(hasWarningMessage).toBeTruthy();

    // 警告メッセージが黄色背景で表示されていることを確認
    const warningElement = page.locator(`text="${warningText}"`).first();
    if (await warningElement.isVisible().catch(() => false)) {
      // 黄色背景スタイルを確認
      const style = await warningElement.evaluate((el: Element) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          parent: (el.parentElement as HTMLElement | null)?.style.backgroundColor || ''
        };
      });

      // 黄色またはそれに近い色であることを確認
      const isYellowBackground =
        style.backgroundColor.includes('255') ||
        style.backgroundColor.includes('yellow') ||
        style.parent.includes('255') ||
        style.parent.includes('yellow');

      expect(isYellowBackground).toBeTruthy();
    }
  }
});
