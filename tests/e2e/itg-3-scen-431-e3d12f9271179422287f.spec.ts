import { test, expect } from '@playwright/test'

test('SCEN-431: コンプライアンス保管期間ポリシーが未設定の場合、分類処理でエラーメッセージが表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html')

  // ページ読み込み完了待ち
  await page.waitForSelector('#discrepancy-tbody')

  // 差異検出済みレコード一覧を確認
  const discrepancyCount = await page.textContent('#discrepancy-count')
  expect(parseInt(discrepancyCount || '0')).toBeGreaterThan(0)

  // コンプライアンス保管期間ポリシーが未設定の状態を模擬
  await page.evaluate(() => {
    ;(window as any).AIVIC_COMPLIANCE_POLICY = null
  })

  // 分類処理を実行するボタンをクリック
  // 「差異を分類」または「分類実行」ボタンを探す
  const classifyButton = page.locator('button').filter({ hasText: /分類|分類実行/ }).first()
  if (await classifyButton.isVisible()) {
    await classifyButton.click()
  } else {
    // 代替：CSV出力開始で分類処理が走る想定
    const detailButton = page.locator('[data-testid="detail-button"]').first()
    if (await detailButton.isVisible()) {
      await detailButton.click()
      const csvOutputButton = page.locator('button:has-text("CSV出力")').first()
      if (await csvOutputButton.isVisible()) {
        await csvOutputButton.click()
      }
    }
  }

  // エラーメッセージが表示されるまで待機
  const errorMessage = page.locator(
    'text=コンプライアンス保管期間ポリシーが設定されていません'
  )
  await expect(errorMessage).toBeVisible({ timeout: 10000 })

  // エラーメッセージの内容確認
  const messageText = await errorMessage.textContent()
  expect(messageText).toContain('コンプライアンス保管期間ポリシーが設定されていません')
  expect(messageText).toContain('管理者設定画面')

  // 分類処理が中断されたことを確認
  // 差異データの状態が変更されていない
  const currentDiscrepancyCount = await page.textContent('#discrepancy-count')
  expect(currentDiscrepancyCount).toBe(discrepancyCount)

  // エラーメッセージが画面上に表示されている
  await expect(errorMessage).toBeVisible()
})
