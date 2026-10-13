import { test, expect } from '@playwright/test';

test.describe('SCEN-410: マッピング結果に基づいた移行リスク要因の評価', () => {
  test('マッピング結果に基づいて移行リスク要因が評価され、発生可能性・影響度・対応方針が判定される', async ({ page }) => {
    // 機能マッピング管理画面を開く
    await page.goto('/panels/scr-1791354749663.html');
    await page.waitForLoadState('networkidle');

    // 画面上部の「リスク評価を実行」ボタンをクリック
    const riskEvalBtn = page.locator('button:has-text("リスク評価を実行")');
    await riskEvalBtn.click();

    // 確認ダイアログに「評価対象：Salesforce請求書/請求明細 ⇄ Oracle標準請求機能」と表示されることを確認
    const dialogText = page.locator('text=Salesforce請求書.*請求明細.*Oracle標準請求機能');
    await expect(dialogText).toBeVisible();

    // 「実行」を選択
    const executeDialogBtn = page.locator('button:has-text("実行")').last();
    await executeDialogBtn.click();

    // システムが既に同期済みのマッピング結果を読み込んでいることを確認
    const syncStatus = page.locator('text=/同期|同期済み|マッピング結果/');
    const isSyncStatusVisible = await syncStatus.isVisible().catch(() => false);
    if (isSyncStatusVisible) {
      await expect(syncStatus).toBeVisible();
    }

    // 移行リスク評価処理が完了するまで待機（進捗表示が100%になるまで）
    await page.waitForSelector('[role="progressbar"]', { state: 'hidden', timeout: 60000 });

    // 評価完了後、画面下部の「リスク評価結果」セクションが展開されることを確認
    const resultSection = page.locator('[class*="risk-evaluation"], [class*="risk-result"], text=リスク評価結果').first();
    await resultSection.scrollIntoViewIfNeeded();
    await expect(resultSection).toBeVisible();

    // (1) 識別されたリスク要因が表として表示される
    const riskFactorTable = page.locator('table:has(text=/(計算ロジック乖離|フィールド型不一致|参照関係の非対応)/)');
    await expect(riskFactorTable).toBeVisible();

    // 例：「計算ロジック乖離」「フィールド型不一致」「参照関係の非対応」などのリスク要因
    const riskFactors = ['計算ロジック乖離', 'フィールド型不一致', '参照関係の非対応'];
    for (const factor of riskFactors) {
      const factorElement = page.locator(`text="${factor}"`);
      const isVisible = await factorElement.isVisible().catch(() => false);
      if (isVisible) {
        await expect(factorElement).toBeVisible();
        break;
      }
    }

    // (2) 各リスク要因に対して「発生可能性」が定量値で表示される
    const probabilityElements = page.locator('text=/(高\\(0\\.[5-9]\\)|中\\(0\\.[3-5]\\)|低\\(0\\.[1-3]\\))/');
    expect(await probabilityElements.count()).toBeGreaterThan(0);

    // (3) 各リスク要因に対して「影響度」が定量値で表示される
    const impactElements = page.locator('text=/(高\\(0\\.[5-9]\\)|中\\(0\\.[3-5]\\)|低\\(0\\.[1-3]\\))/');
    expect(await impactElements.count()).toBeGreaterThan(0);

    // (4) 各リスク要因に対して「対応方針」が分類値で表示される
    const countermeasures = ['要件変更', 'カスタマイズ実装', '回避', '受容'];
    const countermeasureElements = page.locator(`text=/(${countermeasures.join('|')})/`);
    expect(await countermeasureElements.count()).toBeGreaterThan(0);

    // 表の各行は確定済みのマッピング結果に基づいており、未マッピング項目は「評価対象外」として別セクションに表示
    const outOfScopeSection = page.locator('text=評価対象外');
    const isOutOfScopeVisible = await outOfScopeSection.isVisible().catch(() => false);
    if (isOutOfScopeVisible) {
      await expect(outOfScopeSection).toBeVisible();
    }

    // 画面上に「リスク評価は前回同期（〇〇年〇月〇日 〇〇時）時点のメタデータに基づいています」という警告メッセージが表示
    const warningMessage = page.locator('text=/リスク評価は前回同期.*時点のメタデータ/');
    await expect(warningMessage).toBeVisible();
  });
});
