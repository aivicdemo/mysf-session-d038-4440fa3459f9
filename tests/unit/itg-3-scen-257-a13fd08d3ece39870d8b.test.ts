import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-257: データ抽出実行日時がISO 8601形式で出力に含まれる', () => {
  it('should include extractionTimestamp in ISO 8601 format', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    expect(result.extractionTimestamp).toBeDefined();
    expect(typeof result.extractionTimestamp).toBe('string');
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/;
    expect(iso8601Pattern.test(result.extractionTimestamp)).toBe(true);

    expect(result.legacyInvoices).toBeDefined();
    expect(Array.isArray(result.legacyInvoices)).toBe(true);
    expect(result.newSystemInvoices).toBeDefined();
    expect(Array.isArray(result.newSystemInvoices)).toBe(true);
    expect(result.normalizedComparisonData).toBeDefined();
    expect(Array.isArray(result.normalizedComparisonData)).toBe(true);
  });
});
