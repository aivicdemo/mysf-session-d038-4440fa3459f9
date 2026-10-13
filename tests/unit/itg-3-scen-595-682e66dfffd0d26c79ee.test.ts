import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-595: 同じ記録IDを持つレコードの金額が異なるとき、差異が「金額ズレ」として記録される', () => {
  it('should record amount difference when same record has different amounts', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toHaveLength(1);
    expect(result.newSystemInvoices).toHaveLength(1);
    expect(result.normalizedComparisonData).toHaveLength(1);
    expect(result.normalizedComparisonData[0].legacyAmount).toBe(150000);
    expect(result.normalizedComparisonData[0].newSystemAmount).toBe(155000);
    expect(result.normalizedComparisonData[0].difference).toBe(5000);
    expect(result.normalizedComparisonData[0].differenceCategory).toBe('金額ズレ');
  });
});
