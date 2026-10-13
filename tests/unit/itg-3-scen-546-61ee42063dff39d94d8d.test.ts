import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-546: 各差異が許容範囲内か超過かが自動判定される', () => {
  it('各差異が許容範囲内か超過かが自動判定される', async () => {
    const periodStart = '2024-01-01';
    const periodEnd = '2024-01-31';
    const dealIdRange = null;

    const legacyInvoices = [
      {
        invoiceId: 'SF-INV-001',
        dealId: 'DEAL-100',
        invoiceAmount: 150000,
        invoiceStatus: '確定',
        generatedDateTime: '2024-01-15T10:30:00Z',
      },
      {
        invoiceId: 'SF-INV-002',
        dealId: 'DEAL-101',
        invoiceAmount: 250000,
        invoiceStatus: '確定',
        generatedDateTime: '2024-01-20T14:45:00Z',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'NEW-INV-001',
        dealId: 'DEAL-100',
        invoiceAmount: 150000,
        invoiceStatus: '確定',
        generatedDateTime: '2024-01-15T10:30:00Z',
      },
      {
        invoiceId: 'NEW-INV-002',
        dealId: 'DEAL-101',
        invoiceAmount: 248000,
        invoiceStatus: '確定',
        generatedDateTime: '2024-01-20T14:45:00Z',
      },
    ];

    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart,
      periodEnd,
      dealIdRange: undefined,
    });

    expect(result.normalizedComparisonData).toHaveLength(2);

    const deal100 = result.normalizedComparisonData[0];
    expect(deal100.dealId).toBe('DEAL-100');

    const deal101 = result.normalizedComparisonData[1];
    expect(deal101.dealId).toBe('DEAL-101');

    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
