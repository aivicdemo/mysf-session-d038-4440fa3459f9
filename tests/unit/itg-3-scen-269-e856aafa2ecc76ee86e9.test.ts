import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-269: データなし警告の処理（処理完了ケース）', () => {
  it('指定期間・ステータスに該当する請求書がない場合、正常に処理完了', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    expect(result).toBeDefined();
    expect(result.legacyInvoices).toEqual([]);
    expect(result.newSystemInvoices).toEqual([]);
    expect(result.normalizedComparisonData).toEqual([]);
    expect(result.extractionTimestamp).toBeDefined();
    expect(typeof result.extractionTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(result.extractionTimestamp)).toBe(true);
  });
});
