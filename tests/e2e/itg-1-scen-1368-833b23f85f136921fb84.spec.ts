import { test, expect } from '@playwright/test';

test('SCEN-1368: 営業成績金額と請求金額の差異が1000円以上ある場合、金額ズレとしてerrorハイライトが表示される', async ({ page }) => {
  // ブラウザを開き、営業プロセス・請求データ統合管理システムのログイン画面に遷移
  await page.goto('/panels/scr-1791354337614.html');

  // 左側ナビゲーションメニューから「顧客・取引先管理画面」を選択
  await page.getByText('顧客・取引先管理').click();

  // 取引先一覧から該当の取引先をクリック
  await page.getByText('CUST-001').click();

  // 取引先詳細ページを表示
  await page.waitForLoadState('networkidle');

  // 取引先詳細ページ内の関連商談セクションから、営業成績金額1,500,000円の商談行を特定
  const dealRow = page.locator('[class*="row"], tr', {
    has: page.locator('text=/営業成績.*1,500,000|150万/')
  });
  await expect(dealRow).toBeVisible();

  // その商談行の請求情報カラムを確認（請求金額: 500,000円）
  await expect(dealRow.locator('text=/請求金額.*500,000|50万/')).toBeVisible();

  // 画面をスクロール、またはそのセクションをリロード
  await dealRow.scrollIntoViewIfNeeded();
  await page.reload();
  await page.waitForLoadState('networkidle');

  // 該当する商談情報行の再描画を実行
  const reloadedDealRow = page.locator('[class*="row"], tr', {
    has: page.locator('text=/営業成績.*1,500,000|150万/')
  });
  await expect(reloadedDealRow).toBeVisible();

  // 商談一覧テーブルにおいて、営業成績金額1,500,000円と請求金額500,000円が表示されている該当商談の行背景
  // が赤色または黄色のerrorハイライト（エラー強調表示）で表示される
  const highlightColor = await reloadedDealRow.evaluate((el: HTMLElement) => {
    const styles = window.getComputedStyle(el);
    return styles.backgroundColor;
  });

  // 赤系またはオレンジ系の色であることを確認
  expect(highlightColor).toMatch(/red|orange|rgb\((2[0-4][0-9]|25[0-5]|[01]?[0-9][0-9]?),\s*([0-9]|[1-9][0-9]|1[0-4][0-9]),\s*([0-9]|[1-9][0-9]|1[0-4][0-9])\)/i);

  // ハイライトが適用された行には、視覚的に異常値であることが一目で識別可能
  const hasVisualIndicator = await reloadedDealRow.evaluate((el: HTMLElement) => {
    const styles = window.getComputedStyle(el);
    const bgColor = styles.backgroundColor;
    const borderColor = styles.borderColor;
    const borderWidth = styles.borderWidth;

    return bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent' ||
           borderWidth !== '0px';
  });

  expect(hasVisualIndicator).toBeTruthy();
});
