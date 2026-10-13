import { retrieveLegacyAndNewSystemSalesData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-280: 新システムから取得されたレコードが空の場合、空の配列を含めて正常に返却する', () => {
  it('新システム営業データが空配列の場合、空の配列を含めて正常に返却される', async () => {
    const result = await retrieveLegacyAndNewSystemSalesData({
      periodStart: '2025-01-01T00:00:00Z',
      periodEnd: '2025-01-31T23:59:59Z',
      dealIdRange: null,
    });

    // 旧システムから2件の営業レコードが取得されること
    expect(result.legacySalesRecords).toHaveLength(2);
    expect(result.legacySalesRecords[0].dealId).toBe('DEAL-001');
    expect(result.legacySalesRecords[1].dealId).toBe('DEAL-002');

    // 新システムから取得されたレコードが空配列であること
    expect(result.newSystemSalesRecords).toEqual([]);

    // 正規化済みの比較データとして2件が返却されること
    expect(result.normalizedComparisonData).toHaveLength(2);
    expect(result.normalizedComparisonData[0].dealId).toBe('DEAL-001');
    expect(result.normalizedComparisonData[1].dealId).toBe('DEAL-002');

    // ISO 8601形式の抽出実行日時が格納されること
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
