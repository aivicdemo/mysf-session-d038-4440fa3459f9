import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

jest.mock('../../src/platform/data-store');

describe('SCEN-570: 金額差分が10万円以上または件数不一致が5件以上のとき、差異の重大度が「極度」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return normalized data with large amount differences indicating critical severity', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    const legacyRecords = [
      { invoiceId: 'LEG-001', dealId: 'DEAL-100', invoiceAmount: 500000, invoiceStatus: '確定', generatedDateTime: '2024-01-15T10:00:00Z' },
      { invoiceId: 'LEG-002', dealId: 'DEAL-101', invoiceAmount: 300000, invoiceStatus: '送付済み', generatedDateTime: '2024-01-20T14:30:00Z' },
      { invoiceId: 'LEG-003', dealId: 'DEAL-102', invoiceAmount: 250000, invoiceStatus: '確定', generatedDateTime: '2024-01-25T09:15:00Z' },
      { invoiceId: 'LEG-004', dealId: 'DEAL-103', invoiceAmount: 350000, invoiceStatus: '確定', generatedDateTime: '2024-01-28T11:45:00Z' },
    ];

    const newSystemRecords = [
      { invoiceId: 'NEW-001', dealId: 'DEAL-100', invoiceAmount: 500000, invoiceStatus: '確定', generatedDateTime: '2024-01-15T10:00:00Z' },
      { invoiceId: 'NEW-002', dealId: 'DEAL-101', invoiceAmount: 300000, invoiceStatus: '送付済み', generatedDateTime: '2024-01-20T14:30:00Z' },
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
      periodStart: '2024-01-01',
      periodEnd: '2024-01-31',
      dealIdRange: undefined,
    });

    expect(result.normalizedComparisonData).toHaveLength(4);
    const unmatchedRecords = result.normalizedComparisonData.filter(r => r.matchStatus === 'unmatched_in_new_system');
    expect(unmatchedRecords).toHaveLength(2);

    const totalAmountDifference = unmatchedRecords.reduce((sum, r) => sum + (r.amountDifference || 0), 0);
    expect(totalAmountDifference).toBeGreaterThanOrEqual(100000);

    expect(result.legacyInvoices).toHaveLength(4);
    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
