import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-593: 新システムに存在するレコードが旧システムに存在しないとき、差異が「新システムでの追加」として記録される', () => {
  it('should record difference as new_system_addition when record exists only in new system', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(3);
    expect(result.normalizedComparisonData).toHaveLength(3);
    expect(result.normalizedComparisonData[2].legacyExists).toBe(false);
    expect(result.normalizedComparisonData[2].newSystemExists).toBe(true);
    expect(result.normalizedComparisonData[2].differenceType).toBe('新システムでの追加');
    expect(result.extractionTimestamp).toMatch(/^2024-01-31T/);
  });
});
