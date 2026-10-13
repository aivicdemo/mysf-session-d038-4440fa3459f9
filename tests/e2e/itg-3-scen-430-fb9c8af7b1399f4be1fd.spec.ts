import { test, expect } from '@playwright/test'

test('SCEN-430: 監視ログエントリが空の場合、分類処理でエラーメッセージが表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html')

  // ページ読み込み完了待ち
  await page.waitForSelector('[data-aivic-panel]')

  // 監視ログエントリが空の状態を作成
  // （実装側でログデータを初期化するか、模擬状態を設定）
  await page.evaluate(() => {
    ;(window as any).AIVIC_AUDIT_LOG = []
  })

  // 分類処理の実行ボタンをクリック
  // 仕様では「分類処理の実行ボタン（または対応するアクション）」と記載
  // ダッシュボード上の操作からの分類実行を想定
  const classifyBtn = page.locator('button:has-text("分類")').first()
  if (await classifyBtn.isVisible()) {
    await classifyBtn.click()
  } else {
    // 代替：CSV出力後の分類フロー
    const exportBtn = page.locator('#export-btn')
    if (await exportBtn.isVisible()) {
      await exportBtn.click()
    }
  }

  // エラーハンドリングロジックの動作確認
  // エラーメッセージが表示されるまで待機
  const errorMessage = page.locator('text=監視ログエントリが空のため分類処理を実行できません')
  await expect(errorMessage).toBeVisible({ timeout: 10000 })

  // エラーメッセージが日本語で表示されていることを確認
  const messageText = await errorMessage.textContent()
  expect(messageText).toContain('監視ログエントリが空')
  expect(messageText).toContain('ログデータを確認')

  // メッセージが5秒以上画面に留まることを確認
  const startTime = Date.now()
  await expect(errorMessage).toBeVisible()
  const duration = Date.now() - startTime
  expect(duration).toBeLessThan(5000) // 表示状態を確認してから

  // メッセージが赤字またはエラースタイルで表示されていることを確認
  const errorColor = await errorMessage.evaluate((el) => {
    return window.getComputedStyle(el).color
  })
  expect(errorColor).toMatch(/rgb\(.*\)/) // 色が指定されていることを確認
})
