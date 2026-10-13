import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-596: 同じ記録IDを持つレコードの件数が異なるとき、差異が「件数ズレ」として記録される', () => {
  it('should record count discrepancy when record counts differ', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(3);
    expect(result.normalizedComparisonData).toHaveLength(3);
    expect(result.normalizedComparisonData[2].isMatched).toBe(false);
    expect(result.normalizedComparisonData[2].discrepancyReason).toBe('件数ズレ');
    expect(result.normalizedComparisonData[2].legacyRecordCount).toBe(0);
    expect(result.normalizedComparisonData[2].newSystemRecordCount).toBe(1);
  });
});
