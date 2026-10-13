import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-256: 抽出データが正規化され、旧新システムの請求書が照合可能な形式に統合される', () => {
  it('should normalize and integrate legacy and new system invoice data for comparison', async () => {
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
