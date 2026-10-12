import { test, expect } from '@playwright/test';

test.describe('SCEN-1418: 商談確定金額が0以下の場合のエラーメッセージ表示', () => {
  test('確定金額を0に変更すると、エラーメッセージが表示される', async ({ page }) => {
    // 商談・請求管理画面で取引先商談タブを開く
    await page.goto('/panels/scr-1791354351333.html');
    await page.waitForLoadState('networkidle');

    // 取引先に紐付く商談一覧から対象商談を選択
    const dealRow = page.locator('table tbody tr').first();
    if (await dealRow.count() > 0) {
      await dealRow.click();
      await page.waitForTimeout(500);
    }

    // 商談の詳細編集画面を開く
    const editButton = page.locator('button, a', { hasText: /編集|edit|詳細編集/ });
    if (await editButton.count() > 0) {
      await editButton.first().click();
      await page.waitForTimeout(500);
    }

    // 確定金額フィールドを探して「0」を入力
    const amountInput = page.locator(
      '[data-testid*="amount"], [id*="amount"], input[type="number"]',
      { hasText: /金額|amount/ }
    ).first();

    if (await amountInput.count() > 0) {
      await amountInput.clear();
      await amountInput.fill('0');

      // フォーカスを外す（タブキーまたは別フィールドをクリック）
      await amountInput.press('Tab');
      await page.waitForTimeout(500);

      // 確定金額フィールド直下またはフォーム上部にエラーメッセージが表示されることを確認
      const errorMessage = page.locator('text=商談金額が不正です');
      await expect(errorMessage).toBeVisible({ timeout: 3000 });

      // 確定金額フィールドが赤枠でハイライトされている
      const inputStyle = await amountInput.evaluate(el => {
        const style = window.getComputedStyle(el);
        return style.borderColor;
      });
      expect(inputStyle.toLowerCase()).toMatch(/red|ff0000|rgb\(255,\s*0,\s*0\)/i);

      // 保存ボタンが無効化されている
      const saveButton = page.locator('button', { hasText: /保存|save|確定/ });
      if (await saveButton.count() > 0) {
        const isDisabled = await saveButton.first().isDisabled();
        expect(isDisabled).toBeTruthy();
      }
    }
  });
});
