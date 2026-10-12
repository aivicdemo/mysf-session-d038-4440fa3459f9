import { test, expect } from '@playwright/test';

test('SCEN-1369: 商談ステータスが失注または保留で、請求書が存在しない場合、差異理由として「キャンセル」が表示される', async ({ page }) => {
  // ブラウザで営業プロセス統合ダッシュボードにアクセス
  await page.goto('/panels/scr-1791354337614.html');

  // ダッシュボード上の取引先一覧から「テスト用取引先A」を検索・特定
  await page.locator('input[placeholder*="検索"], input[id*="search"]').fill('テスト用取引先A');
  await page.keyboard.press('Enter');

  // 「テスト用取引先A」のリンク（または詳細表示ボタン）をクリック
  await page.getByText('テスト用取引先A').first().click();

  // 取引先詳細表示画面に遷移
  await page.waitForLoadState('networkidle');

  // 取引先詳細表示画面の「商談」セクションまたは関連リストにおいて、商談「OPP-001」が表示されていることを確認
  const dealSection = page.locator('[class*="deal"], [class*="商談"]');
  await expect(dealSection.locator('text=OPP-001')).toBeVisible();

  // 商談「OPP-001」の行内に表示される「差異理由」フィールドを確認
  const dealRow = page.locator('[class*="row"], tr', { has: page.locator('text=OPP-001') });
  await expect(dealRow).toBeVisible();

  // 「差異理由」フィールドに『キャンセル』という値が表示されている
  const discrepancyField = dealRow.locator('[class*="reason"], [class*="discrepancy"], [class*="差異"]');
  await expect(discrepancyField.locator('text=キャンセル')).toBeVisible();

  // ステータスが失注または保留であることを確認
  const statusCell = dealRow.locator('[class*="status"], [class*="ステージ"], [class*="ステータス"]');
  const statusText = await statusCell.innerText();
  expect(statusText).toMatch(/失注|保留/);
});
