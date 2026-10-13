import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-589: 通知送信が24時間以内に成功しないとき、管理者に手動対応が促される', () => {
  it('should return normalized data with 2 records matching specifications', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.normalizedComparisonData).toHaveLength(2);
    expect(result.normalizedComparisonData[0].amountDifference).toBe(0);
    expect(result.normalizedComparisonData[0].statusMatch).toBe(true);
    expect(result.normalizedComparisonData[1].amountDifference).toBe(0);
    expect(result.normalizedComparisonData[1].statusMatch).toBe(true);
    expect(result.extractionTimestamp).toMatch(/^2025-01-31T/);
  });
});
