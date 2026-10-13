import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-592: 旧システムに存在するレコードが新システムに存在しないとき、差異が「新システムでの欠落」として記録される', () => {
  it('should record difference as legacy_only when record exists only in legacy system', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(1);
    expect(result.normalizedComparisonData).toHaveLength(2);
    expect(result.normalizedComparisonData[1].matchStatus).toBe('legacy_only');
    expect(result.normalizedComparisonData[1].differenceType).toBe('新システムでの欠落');
    expect(result.normalizedComparisonData[1].newSystemInvoiceId).toBeNull();
    expect(result.normalizedComparisonData[1].amountDifference).toBe(250000);
  });
});
