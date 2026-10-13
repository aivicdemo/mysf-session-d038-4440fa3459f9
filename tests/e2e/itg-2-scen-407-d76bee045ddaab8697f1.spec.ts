import { test, expect } from '@playwright/test';

test.describe('SCEN-407: マッピング表に100行を超える機能が含まれる場合の警告表示', () => {
  test('マッピング表生成時に101行以上の機能が存在する場合、警告メッセージが表示される', async ({ page }) => {
    // 機能マッピング管理画面を開く
    await page.goto('/panels/scr-1791354749663.html');

    // 画面が読み込まれるまで待機
    await page.waitForLoadState('networkidle');

    // 画面に表示されているマッピング対象機能リストが101行以上であることを確認
    const mappingRows = await page.locator('table tbody tr').count();
    expect(mappingRows).toBeGreaterThanOrEqual(101);

    // 「マッピング表生成」ボタンをクリック
    const generateBtn = page.locator('button:has-text("マッピング表生成")');
    await generateBtn.click();

    // マッピング表生成処理が実行されるまで待機（最大30秒）
    await page.waitForTimeout(3000);

    // 画面をスクロールして警告メッセージ表示エリアを視認範囲に入れる
    const warningArea = page.locator('[role="alert"], .warning-message, [class*="warning"]').first();
    await warningArea.scrollIntoViewIfNeeded();

    // 警告メッセージが表示されていることを確認
    const warningMessage = page.locator(
      'text=/マッピング対象の機能が多数です。優先度を付けて段階的に検証することを推奨します/'
    );

    await expect(warningMessage).toBeVisible();

    // 警告メッセージの背景色が黄色またはオレンジであることを確認
    const warningElement = warningMessage.locator('..');
    const backgroundColor = await warningElement.evaluate(el => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // 黄色またはオレンジのRGB値チェック
    const isYellowOrOrange = /rgb\((255|254|253),\s*(200|201|202|203|204|205|206|207|208|209|210|211|212|213|214|215),\s*\d+\)/.test(backgroundColor) ||
                              /rgb\(255,\s*165,\s*\d+\)/.test(backgroundColor);
    expect(isYellowOrOrange || backgroundColor.includes('yellow') || backgroundColor.includes('orange')).toBeTruthy();

    // 警告メッセージの表示状態が画面から消えず、ユーザーがマッピング表をスクロール・操作しても表示し続けることを確認
    const initialMessage = await warningMessage.textContent();

    // マッピング表をスクロール
    await page.locator('table').first().evaluate(el => {
      el.scrollTop = el.scrollHeight;
    });

    // スクロール後も警告メッセージが表示されていることを確認
    await expect(warningMessage).toBeVisible();
    const scrolledMessage = await warningMessage.textContent();
    expect(scrolledMessage).toBe(initialMessage);

    // マッピング表のセルをクリックして操作
    const tableCell = page.locator('table tbody td').first();
    await tableCell.click();

    // 操作後も警告メッセージが表示されていることを確認
    await expect(warningMessage).toBeVisible();
  });
});
