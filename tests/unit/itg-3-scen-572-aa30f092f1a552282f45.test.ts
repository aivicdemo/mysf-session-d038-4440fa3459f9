import { retrieveLegacyAndNewSystemInvoiceData } from '../../src/logic/legacy-new-system-data-retrieval';

jest.mock('../../src/platform/data-store');

describe('SCEN-572: ステータス不整合のみで金額ズレがないとき、差異の重大度が「中」と判定される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return normalized data with status discrepancies only and medium severity', async () => {
    const { listRecords } = require('../../src/platform/data-store');

    const legacyRecords = [
      { invoiceId: 'LEG-001', dealId: 'DEAL-001', invoiceAmount: 100000, invoiceStatus: '確定', generatedDateTime: '2025-01-15T10:00:00Z' },
      { invoiceId: 'LEG-002', dealId: 'DEAL-002', invoiceAmount: 250000, invoiceStatus: '下書き', generatedDateTime: '2025-01-20T14:30:00Z' },
    ];

    const newSystemRecords = [
      { invoiceId: 'NEW-001', dealId: 'DEAL-001', invoiceAmount: 100000, invoiceStatus: '送付済み', generatedDateTime: '2025-01-15T10:00:00Z' },
      { invoiceId: 'NEW-002', dealId: 'DEAL-002', invoiceAmount: 250000, invoiceStatus: '下書き', generatedDateTime: '2025-01-20T14:30:00Z' },
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
    const firstRecord = result.normalizedComparisonData[0];
    expect(firstRecord.legacyInvoiceId).toBe('LEG-001');
    expect(firstRecord.newSystemInvoiceId).toBe('NEW-001');
    expect(firstRecord.legacyAmount).toBe(100000);
    expect(firstRecord.newSystemAmount).toBe(100000);
    expect(firstRecord.legacyStatus).toBe('確定');
    expect(firstRecord.newSystemStatus).toBe('送付済み');
    expect(firstRecord.discrepancySeverity).toBe('中');

    expect(result.legacyInvoices).toHaveLength(2);
    expect(result.newSystemInvoices).toHaveLength(2);
    expect(result.extractionTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
