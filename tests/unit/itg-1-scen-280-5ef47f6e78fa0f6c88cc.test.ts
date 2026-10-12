import { judgeInvoiceStatusConsistency } from '../../src/logic/invoice-status-judgment';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-280: 請求書レコードが存在しないのに商談がクローズ状態の場合、業務ルールの制約により警告が記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return warning when deal is closed but no invoice exists', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const executedAt = new Date('2025-01-15T10:30:00Z');

    const mockDeal = {
      dealId,
      dealStatus: 'closed',
      dealAmount: 100000,
      dealClosedDate: new Date('2025-01-15T00:00:00Z'),
    };

    const mockEmptyInvoice = {
      invoiceRecords: [],
      invoiceLineItems: [],
    };

    (dataPersistence.fetchDealById as jest.Mock) = jest.fn().mockResolvedValue(mockDeal);
    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock) = jest.fn().mockResolvedValue(mockEmptyInvoice);

    const result = await judgeInvoiceStatusConsistency({
      dealId,
      executedAt,
    });

    expect(result.isConsistent).toBe(false);
    expect(result.dealStatus).toBe('closed');
    expect(result.invoiceStatus).toBeNull();
    expect(result.mismatchDetails).toEqual({
      dealStatus: 'closed',
      invoiceStatus: null,
      reason: 'クローズされた商談に請求書が紐付いていません',
    });
    expect(result.invoiceId).toBeNull();
  });
});
