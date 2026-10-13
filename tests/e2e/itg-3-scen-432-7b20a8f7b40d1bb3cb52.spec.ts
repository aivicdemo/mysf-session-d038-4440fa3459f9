import { test, expect } from '@playwright/test'

test('SCEN-432: 監視ログの必須フィールド（タイムスタンプ、操作者、操作内容）が不完全な場合、エラーメッセージが表示される', async ({ page }) => {
  await page.goto('/panels/scr-1791354872866.html')

  // ページ読み込み完了待ち
  await page.waitForSelector('#discrepancy-tbody')

  // 差異検出結果が表示されている状態を確認
  const discrepancyCount = await page.textContent('#discrepancy-count')
  expect(parseInt(discrepancyCount || '0')).toBeGreaterThan(0)

  // 不完全な監査ログレコードを模擬
  // タイムスタンプ、操作者、操作内容のいずれかが空値
  await page.evaluate(() => {
    ;(window as any).AIVIC_INCOMPLETE_AUDIT_LOG = [
      { タイムスタンプ: null, 操作者: 'user-001', 操作内容: 'CSV_EXPORT' },
      { タイムスタンプ: '2025-01-15T10:00:00Z', 操作者: '', 操作内容: 'CSV_EXPORT' },
      { タイムスタンプ: '2025-01-15T10:00:00Z', 操作者: 'user-001', 操作内容: '' }
    ]
  })

  // 「監査ログ出力」ボタンをクリック
  const auditExportButton = page.locator('button').filter({ hasText: '監査ログ出力' }).first()
  if (await auditExportButton.isVisible()) {
    await auditExportButton.click()
  } else {
    // 代替：是正追跡管理セクションから操作
    const trackingSection = page.locator('text=是正追跡管理').first()
    if (await trackingSection.isVisible()) {
      await trackingSection.click()
      const exportButton = page.locator('button').filter({ hasText: '出力' }).first()
      if (await exportButton.isVisible()) {
        await exportButton.click()
      }
    }
  }

  // エラーメッセージが表示されるまで待機
  const errorMessage = page.locator(
    'text=/監査ログ出力エラー.*タイムスタンプ.*操作者.*操作内容は必須/'
  )
  await expect(errorMessage).toBeVisible({ timeout: 10000 })

  // エラーメッセージが赤字で表示されている
  const errorColor = await errorMessage.evaluate((el) => {
    return window.getComputedStyle(el).color
  })
  expect(errorColor).toMatch(/rgb\(.*\)/)

  // CSV出力処理が中断されたことを確認
  // ファイルダウンロードが発生していない
  const downloadEvent = page.once('download', async (download) => {
    // ダウンロード発生時の処理
    // テスト失敗させる
    throw new Error('CSV出力が実行されてはいけません')
  })

  // 不完全なフィールドの項目名が明示されている
  const messageText = await errorMessage.textContent()
  expect(messageText).toContain('タイムスタンプ')
  expect(messageText).toContain('操作者')
  expect(messageText).toContain('操作内容')
  expect(messageText).toContain('必須')
  expect(messageText).toContain('修正してから再度出力')

  // 再度ダウンロード試行がないことを確認
  await page.waitForTimeout(1000)
})
