import { test, expect } from '@playwright/test';

test.describe('SCEN-415: 要件整理不完全時の警告表示', () => {
  test('経理部門の要件が整理されていない場合、警告メッセージが表示される', async ({ page }) => {
    // 機能マッピング管理画面で『新規マッピング作成』ボタンをクリック
    await page.goto('/panels/scr-1791354749663.html');
    await page.waitForLoadState('networkidle');

    const newMappingBtn = page.locator('button:has-text("新規マッピング作成")');
    await newMappingBtn.click();

    // 対象部門として『経理部門』を選択
    const departmentSelect = page.locator('select, [role="combobox"]').first();
    await departmentSelect.click();
    await page.locator('text=経理部門').click();

    // 対象機能として『請求書・請求明細』を選択
    const functionSelect = page.locator('select, [role="combobox"]').nth(1);
    await functionSelect.click();
    await page.locator('text=請求書').click();
    await page.locator('text=請求明細').click();

    // マッピングテンプレートの入力前に『要件整理状況の確認』セクションを表示
    const requirementCheckSection = page.locator('text=/要件整理状況の確認/');
    await requirementCheckSection.scrollIntoViewIfNeeded();
    await expect(requirementCheckSection).toBeVisible();

    // 『要件整理状況の確認』セクション内の『請求データフロー』『計算ルール』『検証ロジック』の3項目のチェックボックスのうち、
    // 少なくとも1項目が未チェック（未確認）のままの状態を確認

    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();

    // 少なくとも1つのチェックボックスが未チェック状態であることを確認
    let hasUncheckedBox = false;
    for (let i = 0; i < Math.min(checkboxCount, 3); i++) {
      const checkbox = checkboxes.nth(i);
      const isChecked = await checkbox.isChecked();
      if (!isChecked) {
        hasUncheckedBox = true;
        break;
      }
    }

    // 未チェック状態のボックスがない場合、意図的に1つをアンチェック
    if (!hasUncheckedBox) {
      const firstCheckbox = checkboxes.first();
      await firstCheckbox.click();
    }

    // 『マッピング表を生成する』または『次へ進む』ボタンをクリック
    const generateOrNextBtn = page.locator('button:has-text("マッピング表を生成する"), button:has-text("次へ進む")').first();
    await generateOrNextBtn.click();

    // 画面に警告メッセージ『経理部門の要件定義が不完全です。協働で整理してからテンプレート入力を進めてください』が赤色または警告アイコン付きで表示され、
    // 同時にマッピング表の生成は進行せず、入力フォームは活性化されない状態が保持される

    const warningMessage = page.locator(
      'text=/経理部門の要件定義が不完全です。協働で整理してからテンプレート入力を進めてください/'
    );
    await expect(warningMessage).toBeVisible();

    // 警告メッセージの色が赤色であることを確認
    const warningColor = await warningMessage.evaluate(el => {
      return window.getComputedStyle(el).color;
    });
    expect(warningColor).toMatch(/rgb\(\d+,\s*0,\s*0\)|red|#ff0000|#f00/i);

    // マッピング表生成が進行していないことを確認
    const resultSection = page.locator('[class*="result"], [class*="generated"], text=生成完了');
    const isResultVisible = await resultSection.isVisible().catch(() => false);
    expect(isResultVisible).toBeFalsy();

    // 入力フォームが活性化されていないことを確認
    const inputForm = page.locator('form, [class*="form"]').first();
    const inputElements = inputForm.locator('input:not([disabled]), textarea:not([disabled])');
    const enabledInputCount = await inputElements.count();

    // 入力フォームは存在するが、主要な入力要素が非活性状態であることを確認
    if (enabledInputCount > 0) {
      const firstInput = inputElements.first();
      const isDisabled = await firstInput.isDisabled();
      expect(isDisabled).toBeTruthy();
    }
  });
});
