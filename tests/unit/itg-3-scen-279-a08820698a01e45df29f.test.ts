import { retrieveLegacyAndNewSystemSalesData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-279: 旧システムから取得されたレコードが空の場合、空の配列を含めて正常に返却する', () => {
  it('旧システム営業データが空配列の場合、空の配列を含めて正常に返却される', async () => {
    const result = await retrieveLegacyAndNewSystemSalesData({
      periodStart: '2025-01-01T00:00:00Z',
      periodEnd: '2025-01-31T23:59:59Z',
      dealIdRange: null,
    });

    // 旧システムから取得されたレコードが空配列であること
    expect(result.legacySalesRecords).toEqual([]);

    // 新システムから1件の営業レコードが取得されること
    expect(result.newSystemSalesRecords).toHaveLength(1);
    expect(result.newSystemSalesRecords[0].dealId).toBe('DEAL-2025-001');

    // 正規化済みの比較データとして1件が返却されること
    expect(result.normalizedComparisonData).toHaveLength(1);
    expect(result.normalizedComparisonData[0].dealId).toBe('DEAL-2025-001');

    // ISO 8601形式の抽出実行日時が格納されること
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
  });
});
