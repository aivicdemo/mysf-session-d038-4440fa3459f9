import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-594: 同じ記録IDを持つレコードのステータスが異なるとき、差異が「ステータス不整合」として記録される', () => {
  it('should record status mismatch when same invoice has different statuses', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toHaveLength(1);
    expect(result.newSystemInvoices).toHaveLength(1);
    expect(result.normalizedComparisonData).toHaveLength(1);
    expect(result.normalizedComparisonData[0].comparisonStatus).toBe('ステータス不整合');
    expect(result.normalizedComparisonData[0].legacyInvoiceStatus).toBe('確定');
    expect(result.normalizedComparisonData[0].newSystemInvoiceStatus).toBe('下書き');
  });
});
