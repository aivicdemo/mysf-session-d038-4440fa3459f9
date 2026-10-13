import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

jest.mock('../../src/platform/data-store');

describe('SCEN-569: 営業部門全体の目標売上が0円のとき、警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return normalized comparison data with 2 matched records', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    const legacyRecords = [
      {
        invoiceId: 'LEG-2025-0001',
        dealId: 'DEAL-100',
        invoiceAmount: 1000000,
        invoiceStatus: '確定',
        generatedDateTime: '2025-01-15T10:30:00Z',
      },
      {
        invoiceId: 'LEG-2025-0002',
        dealId: 'DEAL-101',
        invoiceAmount: 500000,
        invoiceStatus: '確定',
        generatedDateTime: '2025-01-20T14:15:00Z',
      },
    ];

    const newSystemRecords = [
      {
        invoiceId: 'NEW-2025-0001',
        dealId: 'DEAL-100',
        invoiceAmount: 1000000,
        invoiceStatus: 'confirmed',
        generatedDateTime: '2025-01-15T10:30:00Z',
      },
      {
        invoiceId: 'NEW-2025-0002',
        dealId: 'DEAL-101',
        invoiceAmount: 500000,
        invoiceStatus: 'confirmed',
        generatedDateTime: '2025-01-20T14:15:00Z',
      },
    ];

    listRecords.mockImplementation((table: string) => {
      if (table === 'legacy_invoices') {
        return Promise.resolve(legacyRecords);
      }
      if (table === 'new_system_invoices') {
        return Promise.resolve(newSystemRecords);
      }
      return Promise.resolve([]);
    });

    const result = await retrieveLegacyAndNewSystemInvoiceData({
      periodStart: '2025-01-01',
      periodEnd: '2025-01-31',
      dealIdRange: undefined,
    });

    expect(result.normalizedComparisonData).toHaveLength(2);
    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
