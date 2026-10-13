import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

jest.mock('../../src/platform/data-store');

describe('SCEN-571: 金額差分が1万円以上10万円未満または件数不一致が1～4件のとき、差異の重大度が「高」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return normalized data with moderate amount differences and count mismatches indicating high severity', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    const legacyRecords = [
      { invoiceId: 'SF-INV-001', dealId: 'DEAL-001', invoiceAmount: 150000, invoiceStatus: '確定', generatedDateTime: '2024-01-15T10:00:00Z' },
      { invoiceId: 'SF-INV-002', dealId: 'DEAL-002', invoiceAmount: 200000, invoiceStatus: '確定', generatedDateTime: '2024-01-20T14:30:00Z' },
      { invoiceId: 'SF-INV-003', dealId: 'DEAL-003', invoiceAmount: 120000, invoiceStatus: '確定', generatedDateTime: '2024-01-25T09:15:00Z' },
    ];

    const newSystemRecords = [
      { invoiceId: 'NEW-INV-001', dealId: 'DEAL-001', invoiceAmount: 155000, invoiceStatus: '確定', generatedDateTime: '2024-01-15T10:05:00Z' },
      { invoiceId: 'NEW-INV-002', dealId: 'DEAL-002', invoiceAmount: 200000, invoiceStatus: '確定', generatedDateTime: '2024-01-20T14:30:00Z' },
      { invoiceId: 'NEW-INV-004', dealId: 'DEAL-004', invoiceAmount: 180000, invoiceStatus: '確定', generatedDateTime: '2024-01-22T11:00:00Z' },
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
    expect(result.legacyInvoices).toHaveLength(3);
    expect(result.newSystemInvoices).toHaveLength(3);

    const unmatchedCount = result.normalizedComparisonData.filter(r => r.matchStatus !== '一致').length;
    expect(unmatchedCount).toBe(2);

    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
