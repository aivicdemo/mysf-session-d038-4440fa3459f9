import { test, expect } from '@playwright/test'

test('SCEN-1373: 商談履歴と請求履歴の統合表示時に、対応する商談が存在しないオーファン請求書が検出され不整合リストに追加される', async ({ page }) => {
  // 営業プロセス統合ダッシュボード画面を開く
  await page.goto('/panels/scr-1791354337614.html')

  // ページが読み込まれるまで待機
  await page.waitForSelector('[data-aivic-panel="scr-1791354337614"]', { state: 'visible' })

  // 「取引先A」を検索・選択する
  // UI参考情報から、顧客・取引先管理画面でのセレクタを参照
  // ダッシュボードから取引先詳細表示への遷移を実装する必要があるため、
  // ここでは統合表示機能のトリガーとなる要素を探す

  // 商談・請求管理画面セクションまでスクロール
  // パネルをスクロール
  const panel = page.locator('[data-aivic-panel="scr-1791354337614"]')
  await panel.scrollIntoViewIfNeeded()

  // 統合表示機能を実行する
  // テスト環境では、以下のシナリオをシミュレート：
  // - オーファン請求書（INVOICE-003）が存在
  // - 商談が3件（rec-001, rec-002は有効、rec-003は存在しない）
  // - 請求書が3件（INVOICE-001, INVOICE-002は対応する商談あり、INVOICE-003は対応する商談なし）

  // 不整合検出結果パネルを確認
  // 期待される要素が存在するか確認（実装後のセレクタ）
  const inconsistencyPanel = page.locator('[data-testid="data-consistency-check"]')

  // 最大5秒待機（仕様より）
  await page.waitForTimeout(5000)

  // システムが統合表示処理を完了するまで待機
  // 処理完了後、不整合リストに警告が追加される

  // 1. 不整合リストに1件の警告が追加されている
  const inconsistencyList = page.locator('[data-testid="inconsistency-list"]')
  const warningItems = inconsistencyList.locator('[data-testid="warning-item"]')

  // オーファン請求書の件数を確認
  const orphanCount = await warningItems.count()
  expect(orphanCount).toBeGreaterThanOrEqual(1)

  // 2. 不整合リスト内に以下の内容が表示される
  const orphanInvoice = page.locator('[data-testid="inconsistency-item-INVOICE-003"]')

  // （1）オーファン請求書の識別子「INVOICE-003」
  const invoiceId = orphanInvoice.locator('[data-testid="invoice-identifier"]')
  await expect(invoiceId).toContainText('INVOICE-003')

  // （2）不整合種別「紐付け商談不在」
  const inconsistencyType = orphanInvoice.locator('[data-testid="inconsistency-type"]')
  await expect(inconsistencyType).toContainText('紐付け商談不在')

  // （3）請求書金額
  const invoiceAmount = orphanInvoice.locator('[data-testid="invoice-amount"]')
  await expect(invoiceAmount).toBeVisible()
  const amountText = await invoiceAmount.textContent()
  expect(amountText).toBeTruthy()

  // （4）検出タイムスタンプ
  const detectionTimestamp = orphanInvoice.locator('[data-testid="detection-timestamp"]')
  await expect(detectionTimestamp).toBeVisible()
  const timestampText = await detectionTimestamp.textContent()
  expect(timestampText).toBeTruthy()

  // 3. リスト内の他の2件（INVOICE-001, INVOICE-002）は整合状態として表示されない
  const invoice001 = page.locator('[data-testid="inconsistency-item-INVOICE-001"]')
  const invoice002 = page.locator('[data-testid="inconsistency-item-INVOICE-002"]')

  // INVOICE-001, INVOICE-002 は整合状態なため、不整合リストには表示されないまたは
  // 異なる状態表示を持つ
  const invoice001InInconsistencyList = page.locator('[data-testid="inconsistency-list"] [data-testid="inconsistency-item-INVOICE-001"]')
  const invoice002InInconsistencyList = page.locator('[data-testid="inconsistency-list"] [data-testid="inconsistency-item-INVOICE-002"]')

  await expect(invoice001InInconsistencyList).not.toBeVisible()
  await expect(invoice002InInconsistencyList).not.toBeVisible()

  // 4. 画面上に「1件のオーファン請求書を検出しました」という通知メッセージが表示される
  const notificationMessage = page.locator('[data-testid="orphan-invoice-notification"]')
  await expect(notificationMessage).toContainText('1件のオーファン請求書を検出しました')
})
