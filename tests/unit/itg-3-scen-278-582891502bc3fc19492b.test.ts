import { retrieveLegacyAndNewSystemSalesData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-278: 商談範囲が指定されない場合、全商談を対象として営業データを取得する', () => {
  it('dealIdRange=nullの場合、全商談を対象として旧新両システムから営業データを取得し、正規化済み比較データと共に返却する', async () => {
    const result = await retrieveLegacyAndNewSystemSalesData({
      periodStart: '2026-01-01',
      periodEnd: '2026-01-31',
      dealIdRange: null,
    });

    // 旧システムから3件の営業レコードが取得されること
    expect(result.legacySalesRecords).toHaveLength(3);
    expect(result.legacySalesRecords[0].dealId).toBe('DEAL-001');
    expect(result.legacySalesRecords[1].dealId).toBe('DEAL-150');
    expect(result.legacySalesRecords[2].dealId).toBe('DEAL-999');

    // 新システムから3件の営業レコードが取得されること
    expect(result.newSystemSalesRecords).toHaveLength(3);
    expect(result.newSystemSalesRecords[0].dealId).toBe('DEAL-001');
    expect(result.newSystemSalesRecords[1].dealId).toBe('DEAL-150');
    expect(result.newSystemSalesRecords[2].dealId).toBe('DEAL-999');

    // 正規化済みの比較データとして3件が返却されること
    expect(result.normalizedComparisonData).toHaveLength(3);
    expect(result.normalizedComparisonData[0].dealId).toBe('DEAL-001');
    expect(result.normalizedComparisonData[1].dealId).toBe('DEAL-150');
    expect(result.normalizedComparisonData[2].dealId).toBe('DEAL-999');

    // ISO 8601形式の抽出実行日時が格納されること
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
