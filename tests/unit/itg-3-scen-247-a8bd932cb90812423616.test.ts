import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-247: 指定期間・商談範囲の請求書データが旧新両システムから正常に抽出され、正規化済みの照合対象データとともに返却される', () => {
  it('should retrieve and normalize invoice data correctly', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: { startDealId: 'DEAL-001', endDealId: 'DEAL-100' },
    });

    expect(result.legacyInvoices).toBeDefined();
    expect(Array.isArray(result.legacyInvoices)).toBe(true);
    expect(result.newSystemInvoices).toBeDefined();
    expect(Array.isArray(result.newSystemInvoices)).toBe(true);
    expect(result.normalizedComparisonData).toBeDefined();
    expect(Array.isArray(result.normalizedComparisonData)).toBe(true);
    expect(result.extractionTimestamp).toBeDefined();
    expect(typeof result.extractionTimestamp).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?/.test(result.extractionTimestamp)).toBe(true);
  });
});
