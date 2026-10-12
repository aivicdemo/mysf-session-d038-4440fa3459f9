import { judgeInvoiceStatusConsistency } from '../../src/logic/invoice-status-judgment';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-282: 請求書の発行日付が未来日の場合、業務ルールの制約により警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return warning when invoice date is in the future', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const executedAt = new Date('2026-10-15T10:00:00Z');

    const mockDeal = {
      dealId,
      dealStatus: 'closed',
      dealClosedDate: new Date('2026-10-15T00:00:00Z'),
      dealAmount: 100000,
    };

    const mockInvoice = {
      invoiceId: 'inv-2026-10-001',
      invoiceStatus: 'issued',
      invoiceDate: new Date('2026-10-20T00:00:00Z'),
      invoiceAmount: 100000,
      lineItems: [
        {
          lineItemId: 'line-001',
          invoiceId: 'inv-2026-10-001',
          quantity: 10,
          unitPrice: 10000,
          lineAmount: 100000,
        },
      ],
    };

    (dataPersistence.fetchDealById as jest.Mock) = jest.fn().mockResolvedValue(mockDeal);
    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock) = jest.fn().mockResolvedValue(mockInvoice);

    const result = await judgeInvoiceStatusConsistency({
      dealId,
      executedAt,
    });

    expect(result.isConsistent).toBe(false);
    expect(result.dealStatus).toBe('closed');
    expect(result.invoiceStatus).toBe('issued');
    expect(result.mismatchDetails).toEqual({
      dealStatus: 'closed',
      invoiceStatus: 'issued',
      reason: '請求書の発行日付が未来日になっています',
    });
    expect(result.invoiceId).toBe('inv-2026-10-001');
  });
});
