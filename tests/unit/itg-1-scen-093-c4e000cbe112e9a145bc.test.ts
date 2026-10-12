import { reconcileDealAndInvoice } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchDealsWithInvoices: jest.fn(),
  fetchInvoiceWithLineItems: jest.fn(),
  fetchAllDealStages: jest.fn(),
}));

describe('SCEN-093: 請求金額が負数の場合、エラーを返す', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = new Date('2026-01-01T00:00:00Z');
  const targetPeriodEnd = new Date('2026-01-31T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求金額が負数の場合、エラーをスローする', async () => {
    // Mock fetchDealById
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValueOnce({
      dealId,
      dealName: 'ABC Corporation 年間契約',
      dealAmount: 1000000,
      dealStage: 'won',
      closedDate: '2025-12-15T00:00:00Z',
    });

    // Mock fetchDealsWithInvoices with negative invoice amount
    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValueOnce([
      {
        invoiceId: 'INV-2026-001',
        invoiceAmount: -500000,
        invoiceStatus: 'draft',
        invoiceDate: '2026-01-10T00:00:00Z',
      },
    ]);

    // Mock fetchInvoiceWithLineItems with negative line amount
    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock).mockResolvedValueOnce({
      invoiceId: 'INV-2026-001',
      lineItems: [
        {
          lineItemId: 'LINE-001',
          productName: 'Software License',
          quantity: 10,
          unitPrice: -50000,
          lineAmount: -500000,
          taxRate: 0.1,
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
      {
        stageId: 'STAGE-002',
        stageName: 'lost',
        isClosedWon: false,
        isClosedLost: true,
      },
    ]);

    await expect(
      reconcileDealAndInvoice({
        dealId,
        targetPeriodStart,
        targetPeriodEnd,
      })
    ).rejects.toThrow('請求金額が負数です。データを確認してください。');
  });
});
