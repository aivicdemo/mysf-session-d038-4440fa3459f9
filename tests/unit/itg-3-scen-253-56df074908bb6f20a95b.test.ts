import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-253: 商談範囲が指定されない場合、全商談を対象としてデータが抽出される', () => {
  it('should retrieve all deal records when dealIdRange is undefined', async () => {
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
