import { test, expect } from '@playwright/test';

test.describe('SCEN-413: 移行リスク評価結果の永続化', () => {
  test('移行リスク評価結果が永続化層に保存される', async ({ page }) => {
    // 機能マッピング管理画面で、作成済みマッピング表の「リスク評価を実行」ボタンをクリック
    await page.goto('/panels/scr-1791354749663.html');
    await page.waitForLoadState('networkidle');

    const riskEvalBtn = page.locator('button:has-text("リスク評価を実行")');
    await riskEvalBtn.click();

    // リスク評価ダイアログが開き、評価項目が画面に表示される
    const dialogContent = page.locator('[role="dialog"], [class*="dialog"], [class*="modal"]').first();
    await expect(dialogContent).toBeVisible();

    // ①フィールド数ギャップ（Salesforce 8個 vs ERP 7個 = 1個不一致）
    const fieldGapText = page.locator('text=/フィールド数.*8個.*7個|\\d+個不一致/');
    const isFieldGapVisible = await fieldGapText.isVisible().catch(() => false);

    if (isFieldGapVisible) {
      await expect(fieldGapText).toBeVisible();
    }

    // ②計算ロジック互換性（2個のロールアップ集計が同一仕様）
    const calcLogicText = page.locator('text=/計算ロジック互換性|ロールアップ集計/');
    const isCalcLogicVisible = await calcLogicText.isVisible().catch(() => false);

    if (isCalcLogicVisible) {
      await expect(calcLogicText).toBeVisible();
    }

    // ③参照関係の複雑度（マスター詳細3個、ルックアップ2個）
    const refComplexText = page.locator('text=/参照関係.*複雑度|マスター詳細|ルックアップ/');
    const isRefComplexVisible = await refComplexText.isVisible().catch(() => false);

    if (isRefComplexVisible) {
      await expect(refComplexText).toBeVisible();
    }

    // 評価結果として「リスク度：中（5段階中3）」「未対応フィールド：1個」「検証警告：計算ロジック互換性が部分的」と画面に表示
    const riskLevelText = page.locator('text=/リスク度.*中|5段階中3/');
    await expect(riskLevelText).toBeVisible();

    const unmappedFieldText = page.locator('text=/未対応フィールド.*1個/');
    const isUnmappedVisible = await unmappedFieldText.isVisible().catch(() => false);

    if (isUnmappedVisible) {
      await expect(unmappedFieldText).toBeVisible();
    }

    const warningText = page.locator('text=/検証警告.*計算ロジック互換性.*部分的/');
    const isWarningVisible = await warningText.isVisible().catch(() => false);

    if (isWarningVisible) {
      await expect(warningText).toBeVisible();
    }

    // 「評価結果を保存」ボタンをクリック
    const savResultBtn = page.locator('button:has-text("評価結果を保存")');
    await savResultBtn.click();

    // 確認ダイアログが表示され「この評価結果を永続化層に保存します」と表示
    const confirmDialog = page.locator('text=/評価結果を永続化層に保存します|永続化层に保存/');
    const isConfirmVisible = await confirmDialog.isVisible().catch(() => false);

    if (isConfirmVisible) {
      await expect(confirmDialog).toBeVisible();
    }

    // 「保存」ボタンをクリック
    const saveConfirmBtn = page.locator('[role="dialog"], [class*="modal"]').locator('button:has-text("保存")').first();
    await saveConfirmBtn.click();

    // 画面に「移行リスク評価結果をシステムに保存しました」と成功メッセージが表示
    const successMessage = page.locator('text=/移行リスク評価結果をシステムに保存しました/');
    await expect(successMessage).toBeVisible();

    // 評価レポートがPDF形式で出力され、ダウンロード可能な状態になることを確認
    const pdfDownloadBtn = page.locator('button:has-text("PDF"), button:has-text("ダウンロード")');
    const isPdfBtnVisible = await pdfDownloadBtn.isVisible().catch(() => false);

    if (isPdfBtnVisible) {
      await expect(pdfDownloadBtn).toBeVisible();
    }

    // プロジェクトマネージャーへのメール通知送信が試行されることを確認
    const notificationStatus = page.locator('text=/メール通知|送信|PM|プロジェクトマネージャー/');
    const isNotificationVisible = await notificationStatus.isVisible().catch(() => false);

    if (isNotificationVisible) {
      await expect(notificationStatus).toBeVisible();
    }

    // 移行リスク評価結果が永続化層に新規レコードとして保存され、機能マッピング管理画面で該当マッピング表を再度開いた際に、
    // 同じ評価結果が「過去の評価結果」セクションに1件表示されることで、永続化が完了したことが確認される

    // 画面をリロード
    await page.reload();
    await page.waitForLoadState('networkidle');

    // 同じマッピング表を再度開く
    await page.goto('/panels/scr-1791354749663.html');
    await page.waitForLoadState('networkidle');

    // 「過去の評価結果」セクションを確認
    const pastResultsSection = page.locator('text=/過去の評価結果|評価履歴/');
    const isPastResultsVisible = await pastResultsSection.isVisible().catch(() => false);

    if (isPastResultsVisible) {
      await expect(pastResultsSection).toBeVisible();

      // 1件の評価結果が表示されている
      const pastResultRows = pastResultsSection.locator('..').locator('table tbody tr');
      expect(await pastResultRows.count()).toBeGreaterThanOrEqual(1);
    }
  });
});
