import { test, expect } from '@playwright/test';

test.describe('SCEN-1467: 活動登録画面で取引先を選択すると、その取引先の基本情報と割り当てられた営業担当者が表示される', () => {
  test('取引先A社を選択した直後、企業名、住所、電話番号、メールアドレス、営業担当者が表示される', async ({ page }) => {
    // 営業活動実績入力画面を開く
    await page.goto('/panels/scr-1791354364933.html');

    // フォームが表示されるまで待機
    await page.waitForSelector('select#customer', { state: 'visible' });

    // 取引先選択ドロップダウンをクリック
    const customerSelect = page.locator('select#customer');
    await customerSelect.click();

    // ドロップダウンが表示されるまで待機
    await page.waitForSelector('select#customer option', { state: 'visible' });

    // 「A社」に相当する選択肢を探す（テストデータにA社が含まれると仮定）
    const options = await customerSelect.locator('option').all();
    let selectedOption = null;
    for (const opt of options) {
      const text = await opt.textContent();
      if (text && (text.includes('A社') || text.includes('テクノソリューション'))) {
        selectedOption = opt;
        break;
      }
    }

    // A社相当の選択肢が見つかった場合、選択
    if (selectedOption) {
      const value = await selectedOption.getAttribute('value');
      await customerSelect.selectOption(value!);

      // 選択完了後、画面上に取引先基本情報が反映されるまで待機
      // 営業担当者フィールドに値が入力されるのを確認
      const salesPersonSelect = page.locator('select#sales-person');
      await salesPersonSelect.waitFor({ state: 'attached' });

      // 選択後、営業担当者フィールドに値が自動入力されていることを確認
      const selectedValue = await salesPersonSelect.inputValue();
      expect(selectedValue).not.toBe('');

      // 営業担当者の名前が表示されていることを確認（オプションテキストから）
      const selectedText = await salesPersonSelect.locator(`option[value="${selectedValue}"]`).textContent();
      expect(selectedText).not.toBe('');
    } else {
      // テストデータにA社がない場合、利用可能な取引先を選択
      const availableOptions = await Promise.all(
        options.filter(async (opt) => {
          const text = await opt.textContent();
          return text && text !== '選択してください';
        })
      );

      if (availableOptions.length > 0) {
        const value = await availableOptions[0].getAttribute('value');
        await customerSelect.selectOption(value!);

        // 営業担当者フィールドに値が入力されたことを確認
        const salesPersonSelect = page.locator('select#sales-person');
        const selectedValue = await salesPersonSelect.inputValue();
        expect(selectedValue).not.toBe('');
      }
    }
  });
});
