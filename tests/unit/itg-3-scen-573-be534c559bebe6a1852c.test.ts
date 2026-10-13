import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

jest.mock('../../src/platform/data-store');

describe('SCEN-573: 月次締め日まで3営業日以内のとき、差異の重大度が1段階上げられる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return normalized data with escalated severity when close to month-end', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    const legacyRecords = [
      { invoiceId: 'SF-2025-001', dealId: 'DEAL-001', invoiceAmount: 100000, invoiceStatus: '確定', generatedDateTime: '2025-02-27T10:00:00Z' },
      { invoiceId: 'SF-2025-002', dealId: 'DEAL-002', invoiceAmount: 250000, invoiceStatus: '送付済み', generatedDateTime: '2025-02-28T14:30:00Z' },
    ];

    const newSystemRecords = [
      { invoiceId: 'NEW-2025-001', dealId: 'DEAL-001', invoiceAmount: 100000, invoiceStatus: '確定', generatedDateTime: '2025-02-27T10:00:00Z' },
      { invoiceId: 'NEW-2025-002', dealId: 'DEAL-002', invoiceAmount: 250000, invoiceStatus: '送付済み', generatedDateTime: '2025-02-28T14:30:00Z' },
      { invoiceId: 'NEW-2025-003', dealId: 'DEAL-003', invoiceAmount: 75000, invoiceStatus: '下書き', generatedDateTime: '2025-02-28T16:00:00Z' },
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
      periodStart: '2025-02-26',
      periodEnd: '2025-02-28',
      dealIdRange: undefined,
    });

    expect(result.normalizedComparisonData).toHaveLength(3);

    const warningRecords = result.normalizedComparisonData.filter(r => r.severity === 'WARNING');
    const criticalRecords = result.normalizedComparisonData.filter(r => r.severity === 'CRITICAL');

    expect(warningRecords).toHaveLength(2);
    expect(criticalRecords).toHaveLength(1);

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(3);
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
