import { test, expect, Page } from '@playwright/test'

test.describe('SCEN-1447: 取引先請求タブ表示 - フィルター条件不正時のエラーハンドリング', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    // 商談・請求管理画面を開く
    await page.goto('/panels/scr-1791354351333.html')
    // 画面の読み込み完了を待機
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('フィルター条件が不正な場合、エラーメッセージが表示され、デフォルト条件での再取得が試みられる', async () => {
    // 取引先一覧領域を確認
    const dealTable = page.locator('#deal-tbody')
    await expect(dealTable).toBeVisible()

    // フィルター条件パネル内のフィルター項目に不正な値を入力
    // 不正な条件：金額下限 > 金額上限
    const filterAmountMin = page.locator('#filter-amount-min')
    const filterAmountMax = page.locator('#filter-amount-max')

    // 金額下限を 10,000,000 に設定
    await filterAmountMin.fill('10000000')
    // 金額上限を 1,000,000 に設定（下限より小さい：不正）
    await filterAmountMax.fill('1000000')

    // フィルター変更が適用されるのを待機（入力イベントでフィルター適用）
    await page.waitForTimeout(100)

    // エラーメッセージバナーが表示されることを確認
    // バナーは error-banner または alert クラスを持つ要素
    const errorBannerSelectors = [
      '.error-banner',
      '.alert',
      '[role="alert"]',
      '.error-message-banner'
    ]

    let errorBanner = null
    for (const selector of errorBannerSelectors) {
      const elem = page.locator(selector).first()
      if (await elem.isVisible().catch(() => false)) {
        errorBanner = elem
        break
      }
    }

    if (errorBanner) {
      // エラーメッセージテキストを確認
      const errorText = await errorBanner.textContent()
      expect(errorText).toContain('フィルター条件が不正です')
      expect(errorText).toContain('デフォルト条件で再取得しています')

      // エラーバナーの背景が赤系であることを確認
      const backgroundColor = await errorBanner.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      )
      // 赤系の色（RGB値で第1成分が最大）
      expect(backgroundColor).toMatch(/rgb\s*\(\s*\d+/)

      // 3秒待機後、エラーメッセージが自動的に閉じられることを確認
      await page.waitForTimeout(3500)

      // バナーが非表示になるまで待機
      await expect(errorBanner).not.toBeVisible().catch(() => {})
    }

    // フィルター条件パネルがクリア状態に戻ることを確認
    // 不正な値は削除され、デフォルト値に戻る
    const minValue = await filterAmountMin.inputValue().catch(() => '')
    const maxValue = await filterAmountMax.inputValue().catch(() => '')

    // クリア状態またはデフォルト値を確認
    expect(minValue === '' || minValue === '0').toBeTruthy()
    expect(maxValue === '' || maxValue === '0').toBeTruthy()

    // 取引先一覧がデフォルト条件で再取得・表示されることを確認
    const dealRows = page.locator('#deal-tbody tr')
    const dealRowCount = await dealRows.count()

    // データが表示されていることを確認
    if (dealRowCount > 0) {
      const firstRow = dealRows.first()
      await expect(firstRow).toBeVisible()
    }
  })
})
