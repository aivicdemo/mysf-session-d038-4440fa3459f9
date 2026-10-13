import { test, expect } from '@playwright/test';

test('SCEN-433: カスタムオブジェクトの計算ロジックが不明確な場合、警告メッセージが表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354749663.html');

  // 『計算ロジック』セクションを表示
  const logicSection = page.locator('[data-role="calculation-logic-section"]');
  await expect(logicSection).toBeVisible();

  // 計算項目『請求合計（合計金額）』の行を確認
  const totalAmountRow = logicSection.locator('[data-calculation-field="total-amount"]');
  await expect(totalAmountRow).toBeVisible();

  // マッピング検証機能を実行
  const validationBtn = page.locator('[data-role="run-validation-btn"]');
  await validationBtn.click();

  // ローディング表示
  const loading = page.locator('[data-role="loading-indicator"]');
  await expect(loading).toBeVisible();

  // 検証完了を待機
  await loading.waitFor({ state: 'hidden', timeout: 10000 });

  // 『請求合計（合計金額）』フィールド行に警告アイコンが表示
  const warningIcon = totalAmountRow.locator('[data-role="warning-icon"]');
  await expect(warningIcon).toBeVisible();

  // アイコンが黄色または橙色
  const warningColor = await warningIcon.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.color;
  });
  expect(warningColor).toMatch(/yellow|orange|#FFD700|#FFA500/i);

  // ツールチップに警告メッセージが表示
  const tooltip = page.locator('[data-role="warning-tooltip"]');
  await expect(tooltip).toBeVisible();
  await expect(tooltip).toContainText('警告：計算ロジックが不明確です');
  await expect(tooltip).toContainText('Salesforce内の計算式定義を確認するか、管理者に問い合わせてください');
});
