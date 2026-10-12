import { reconcileDealAndInvoice } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchDealsWithInvoices: jest.fn(),
  fetchInvoiceWithLineItems: jest.fn(),
  fetchAllDealStages: jest.fn(),
}));

describe('SCEN-092: 商談金額が負数の場合、エラーを返す', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = new Date('2026-01-01T00:00:00Z');
  const targetPeriodEnd = new Date('2026-01-31T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談金額が負数の場合、エラーをスローする', async () => {
    // Mock fetchDealById with negative deal amount
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValueOnce({
      dealId,
      dealAmount: -50000,
      dealStage: 'won',
      closedDate: '2026-01-15T00:00:00Z',
      dealLineItems: [
        {
          productId: 'PROD-001',
          quantity: 10,
          unitPrice: 5000,
        },
      ],
    });

    // Mock fetchDealsWithInvoices
    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValueOnce([
      {
        invoiceId: 'INV-001',
        invoiceAmount: 50000,
        invoiceStatus: 'issued',
        lineItemCount: 1,
      },
    ]);

    // Mock fetchInvoiceWithLineItems
    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock).mockResolvedValueOnce({
      invoiceId: 'INV-001',
      lineItems: [
        {
          productId: 'PROD-001',
          quantity: 10,
          unitPrice: 5000,
          lineAmount: 50000,
        },
      ],
    });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValueOnce([
      {
        stageId: 'STAGE-001',
        stageName: 'won',
        isClosedWon: true,
        isClosedLost: false,
      },
    ]);

    await expect(
      reconcileDealAndInvoice({
        dealId,
        targetPeriodStart,
        targetPeriodEnd,
      })
    ).rejects.toThrow('商談金額が負数です。データを確認してください。');
  });
});
