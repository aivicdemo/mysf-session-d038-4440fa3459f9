import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

describe('SCEN-547: 検出された差異の詳細情報が永続化される', () => {
  it('検出された差異の詳細情報が永続化される', async () => {
    const periodStart = '2025-01-01';
    const periodEnd = '2025-01-31';
    const dealIdRange = { startDealId: 'DEAL-001', endDealId: 'DEAL-010' };

    const legacyInvoices = [
      {
        invoiceId: 'INV-SF-001',
        dealId: 'DEAL-005',
        invoiceAmount: 150000,
        invoiceStatus: '確定',
        generatedDateTime: '2025-01-15T10:30:00Z',
      },
      {
        invoiceId: 'INV-SF-002',
        dealId: 'DEAL-008',
        invoiceAmount: 250000,
        invoiceStatus: '送付済み',
        generatedDateTime: '2025-01-20T14:15:00Z',
      },
    ];

    const newSystemInvoices = [
      {
        invoiceId: 'INV-NEW-001',
        dealId: 'DEAL-005',
        invoiceAmount: 150000,
        invoiceStatus: '確定',
        generatedDateTime: '2025-01-15T10:30:00Z',
      },
      {
        invoiceId: 'INV-NEW-002',
        dealId: 'DEAL-008',
        invoiceAmount: 260000,
        invoiceStatus: '送付済み',
        generatedDateTime: '2025-01-20T14:15:00Z',
      },
    ];

    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart,
      periodEnd,
      dealIdRange,
    });

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.legacyInvoices[0].invoiceId).toBe('INV-SF-001');
    expect(result.legacyInvoices[1].invoiceId).toBe('INV-SF-002');

    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.newSystemInvoices[0].invoiceId).toBe('INV-NEW-001');
    expect(result.newSystemInvoices[1].invoiceId).toBe('INV-NEW-002');

    expect(result.normalizedComparisonData).toHaveLength(2);

    const deal005 = result.normalizedComparisonData[0];
    expect(deal005.dealId).toBe('DEAL-005');

    const deal008 = result.normalizedComparisonData[1];
    expect(deal008.dealId).toBe('DEAL-008');

    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
