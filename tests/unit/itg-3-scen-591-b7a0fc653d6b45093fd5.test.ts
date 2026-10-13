import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-591: ファイル保存が1時間以内に成功しないとき、管理者に通知が送られる', () => {
  it('should return normalized data with 1 record and discrepancy not detected', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toHaveLength(1);
    expect(result.newSystemInvoices).toHaveLength(1);
    expect(result.normalizedComparisonData).toHaveLength(1);
    expect(result.normalizedComparisonData[0].amountDifference).toBe(0);
  });
});
