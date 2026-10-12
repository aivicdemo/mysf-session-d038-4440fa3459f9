import { judgeInvoiceStatusConsistency, StatusMismatchDetected } from '../../src/logic/invoice-status-judgment';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-277: 商談ステータスと請求ステータスが不整合である場合、StatusMismatchDetectedエラーが発生し、不整合の詳細が返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return mismatch details when deal is closed but invoice is not billed', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const executedAt = new Date('2026-10-07T10:00:00.000Z');

    const mockDeal = {
      dealId,
      dealStatus: 'closed',
      dealAmount: 1000000,
      dealClosedDate: new Date('2026-09-30T18:00:00.000Z'),
    };

    const mockInvoice = {
      invoiceId: 'inv-2026-001',
      invoiceStatus: '未請求',
      invoiceAmount: 500000,
      invoiceDate: new Date('2026-10-01T09:00:00.000Z'),
      lineItems: [
        {
          lineItemId: 'line-001',
          invoiceId: 'inv-2026-001',
          quantity: 10,
          unitPrice: 50000,
          lineAmount: 500000,
        },
      ],
    };

    (dataPersistence.fetchDealById as jest.Mock) = jest.fn().mockResolvedValue(mockDeal);
    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock) = jest.fn().mockResolvedValue(mockInvoice);

    await expect(
      judgeInvoiceStatusConsistency({
        dealId,
        executedAt,
      })
    ).rejects.toThrow(StatusMismatchDetected);

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith(dealId);
    expect(dataPersistence.fetchInvoiceWithLineItems).toHaveBeenCalledWith(dealId);
  });
});
