import { judgeInvoiceStatusConsistency } from '../../src/logic/invoice-status-judgment';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
}));

describe('SCEN-283: 商談がクローズ状態で請求書・請求明細が存在する場合、業務ルールの計算式に従い整合性の有無、不整合詳細、推奨アクションが返される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return consistent when deal and invoice are aligned', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const executedAt = new Date('2026-10-15T10:30:00.000Z');

    const mockDeal = {
      dealId,
      dealStatus: 'closed',
      dealClosedDate: new Date('2026-10-01T09:00:00.000Z'),
      dealAmount: 1000000,
    };

    const mockInvoice = {
      invoiceId: 'INV-2026-001',
      invoiceStatus: 'issued',
      invoiceDate: new Date('2026-10-05T14:30:00.000Z'),
      invoiceAmount: 1000000,
      lineItems: [
        {
          lineItemId: 'LI-001',
          invoiceId: 'INV-2026-001',
          quantity: 100,
          unitPrice: 10000,
          lineAmount: 1000000,
        },
      ],
    };

    (dataPersistence.fetchDealById as jest.Mock) = jest.fn().mockResolvedValue(mockDeal);
    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock) = jest.fn().mockResolvedValue(mockInvoice);

    const result = await judgeInvoiceStatusConsistency({
      dealId,
      executedAt,
    });

    expect(result.isConsistent).toBe(true);
    expect(result.dealStatus).toBe('closed');
    expect(result.invoiceStatus).toBe('issued');
    expect(result.mismatchDetails).toBeNull();
    expect(result.invoiceId).toBe('INV-2026-001');
  });
});
