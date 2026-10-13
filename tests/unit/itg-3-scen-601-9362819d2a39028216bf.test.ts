import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-601: 件数が10件以上100件未満のとき、優先度が『高』に設定される', () => {
  it('新システム請求書が15件のとき、すべてのレコードの優先度が「high」に設定されている', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    });

    expect(result.normalizedComparisonData).toBeDefined();
    expect(result.normalizedComparisonData.length).toBe(15);

    result.normalizedComparisonData.forEach((record) => {
      expect(record.priority).toBe('high');
    });

    expect(result.legacyInvoices).toHaveLength(15);
    expect(result.newSystemInvoices).toHaveLength(15);
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });
});
