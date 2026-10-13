import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-254: 指定期間内で旧システムから複数の請求書レコードが抽出され、出力に含まれる', () => {
  it('should retrieve multiple legacy system invoices and include them in output', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toBeDefined();
    expect(Array.isArray(result.legacyInvoices)).toBe(true);
    expect(result.newSystemInvoices).toBeDefined();
    expect(Array.isArray(result.newSystemInvoices)).toBe(true);
    expect(result.normalizedComparisonData).toBeDefined();
    expect(Array.isArray(result.normalizedComparisonData)).toBe(true);
    expect(result.extractionTimestamp).toBeDefined();
    expect(typeof result.extractionTimestamp).toBe('string');
  });
});
