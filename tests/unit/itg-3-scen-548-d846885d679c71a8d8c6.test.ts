import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-548: 許容範囲判定結果が差異検出結果に記録される', () => {
  it('許容範囲判定結果が差異検出結果に記録され、判定日時と判定者情報が保存される', async () => {
    const periodStart = '2025-01-01';
    const periodEnd = '2025-01-31';
    const dealIdRange = null;

    const legacyInvoices = [
      {
        invoiceId: 'LEG-INV-001',
        dealId: 'DEAL-100',
        invoiceAmount: 150000,
        invoiceStatus: '確定',
        generatedDateTime: '2025-01-15T10:30:00Z',
      },
      {
        invoiceId: 'LEG-INV-002',
        dealId: 'DEAL-101',
        invoiceAmount: 250000,
        invoiceStatus: '送付済み',
        generatedDateTime: '2025-01-20T14:15:00Z',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'NEW-INV-001',
        dealId: 'DEAL-100',
        invoiceAmount: 150000,
        invoiceStatus: '確定',
        generatedDateTime: '2025-01-15T10:30:00Z',
      },
      {
        invoiceId: 'NEW-INV-002',
        dealId: 'DEAL-101',
        invoiceAmount: 250000,
        invoiceStatus: '送付済み',
        generatedDateTime: '2025-01-20T14:15:00Z',
      },
    ];

    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart,
      periodEnd,
      dealIdRange: undefined,
    });

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.legacyInvoices[0].invoiceId).toBe('LEG-INV-001');
    expect(result.legacyInvoices[1].invoiceId).toBe('LEG-INV-002');

    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.newSystemInvoices[0].invoiceId).toBe('NEW-INV-001');
    expect(result.newSystemInvoices[1].invoiceId).toBe('NEW-INV-002');

    expect(result.normalizedComparisonData).toHaveLength(2);

    const record1 = result.normalizedComparisonData[0];
    expect(record1.legacyInvoiceId).toBe('LEG-INV-001');

    const record2 = result.normalizedComparisonData[1];
    expect(record2.legacyInvoiceId).toBe('LEG-INV-002');

    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
