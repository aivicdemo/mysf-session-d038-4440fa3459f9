import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-600: 金額差分が10万円以上100万円未満のとき、優先度が『高』に設定される', () => {
  it('金額差分が100000円のレコードの優先度が「高」に設定されている', async () => {
    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    expect(result.normalizedComparisonData).toBeDefined();
    expect(result.normalizedComparisonData.length).toBe(1);

    const record = result.normalizedComparisonData[0];
    expect(record.dealId).toBe('DEAL-A001');
    expect(record.legacyInvoiceAmount).toBe(500000);
    expect(record.newSystemInvoiceAmount).toBe(600000);
    expect(record.invoiceAmountDifference).toBe(100000);
    expect(record.differencePriority).toBe('高');

    expect(result.legacyInvoices).toHaveLength(1);
    expect(result.newSystemInvoices).toHaveLength(1);
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });
});
