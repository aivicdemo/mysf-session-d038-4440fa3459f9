import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-598: 件数が100件以上のとき、優先度が『緊急』に設定される', () => {
  it('新システム請求書が10件以上のとき、新システムのみのレコードの優先度がすべて「緊急」に設定されている', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    expect(result.normalizedComparisonData).toBeDefined();
    expect(result.normalizedComparisonData.length).toBe(10);

    const newSystemOnlyRecords = result.normalizedComparisonData.filter(
      (r) => r.matchStatus === '新システムのみ'
    );
    expect(newSystemOnlyRecords).toHaveLength(8);
    newSystemOnlyRecords.forEach((record) => {
      expect(record.priority).toBe('緊急');
    });

    const matchedRecords = result.normalizedComparisonData.filter(
      (r) => r.matchStatus === '一致'
    );
    expect(matchedRecords).toHaveLength(2);
    matchedRecords.forEach((record) => {
      expect(record.priority).toBe('通常');
    });

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(10);
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });
});
