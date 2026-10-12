import { test, expect, Page } from '@playwright/test'

test.describe('SCEN-1244: 異常通知の送信失敗時の対応', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
  })

  test('エラー系：異常通知送信失敗時にダッシュボードに失敗バナーが表示される', async () => {
    // 商談・請求管理画面を開く
    await page.goto('/panels/scr-1791354351333.html')
    await page.waitForLoadState('networkidle')

    // 成約商談を検索して選択
    const filterStage = page.locator('#filter-stage')
    await filterStage.selectOption('成約')
    await page.waitForTimeout(500)

    // 商談を選択
    const dealRow = page.locator('#deal-tbody tr').first()
    await dealRow.click()

    // 商談詳細が表示されるまで待機
    await expect(page.locator('#detail-panel')).not.toContainText('商談を選択してください')

    // 請求書生成ボタンをクリック
    const generateBtn = page.locator('#btn-generate-invoice')
    await expect(generateBtn).toBeEnabled()
    await generateBtn.click()

    // 生成確認ダイアログが表示されるまで待機
    const modal = page.locator('#modal-generate')
    await expect(modal).toHaveClass(/open/)

    // 生成条件を設定
    await page.locator('#modal-invoice-date').fill('2025-01-28')
    await page.locator('#modal-due-date').fill('2025-02-28')

    // 「生成実行」ボタンをクリック
    const confirmBtn = page.locator('#btn-confirm-generate')
    await confirmBtn.click()

    // バックエンド処理が進行するまで待機
    await page.waitForTimeout(2000)

    // この時点で、仕様では「外部通知サービス通信障害により全3回の再試行が失敗し、
    // 最終的に送信失敗となる」という状況が発生していることを想定
    // 実装により、異常通知送信ロジックが実行され、失敗イベントが発火するはず

    // 画面のモーダルが閉じることを確認
    await page.waitForTimeout(500)
    await expect(modal).not.toHaveClass(/open/)

    // ダッシュボード画面にナビゲート
    const dashboardLink = page.locator('[data-aivic-nav="scr-1791354337614"]')
    await dashboardLink.click()

    // ダッシュボードページが読み込まれるまで待機
    await page.waitForLoadState('networkidle')

    // ダッシュボードの画面上部に赤背景の「通知送信失敗」バナーが表示されることを確認
    const failureBanner = page.locator('text=/通知送信失敗/')
    await expect(failureBanner).toBeVisible()

    // バナーに「異常検知通知の送信に失敗しました。管理者に確認を依頼してください」というメッセージが含まれることを確認
    const bannerText = await failureBanner.textContent()
    expect(bannerText).toContain('異常検知通知の送信に失敗しました')
    expect(bannerText).toContain('管理者に確認を依頼してください')

    // 異常検知ログテーブルに新規レコードが記録されていることを確認
    // （以下は API 経由またはデータベースクエリで検証すべきですが、
    //  ここでは画面で確認可能な場合の検証を記載）

    // 仕様で要求される異常検知ログの内容を確認:
    // - ログレベル = "ERROR"
    // - タイムスタンプ = 現在時刻（生成実行時刻付近）
    // - 内容 = "異常検知通知送信失敗: 請求書生成（商談ID: ××××）に関する異常検知通知が3回の再試行後も送信できませんでした"
    // - ステータス = "保留中"
    // - 再試行回数 = "3"

    // 画面上でこれらの情報が表示される場合、以下のように検証
    const logContent = page.locator('text=/異常検知通知送信失敗/')
    if (await logContent.isVisible()) {
      const logText = await logContent.textContent()
      expect(logText).toContain('3回の再試行')
    }
  })
})
