import {
  reconcileDealAndInvoice,
  ReconcileDealAndInvoiceInput,
  ReconcileDealAndInvoiceOutput,
} from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>(
    '../../src/logic/data-persistence'
  ),
  fetchDealById: jest.fn(),
  fetchDealsWithInvoices: jest.fn(),
  fetchInvoiceWithLineItems: jest.fn(),
  fetchAllDealStages: jest.fn(),
}));

describe('SCEN-099: 商談金額から算出した期待請求金額と請求書の請求金額を照合し、差異がない場合は一致と判定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('商談金額と請求金額が完全に一致する場合、amountDiscrepancy が null で reconciliationStatus が success となる', async () => {
    const dealId = '550e8400-e29b-41d4-a716-446655440000';
    const targetPeriodStart = new Date('2024-01-01T00:00:00Z');
    const targetPeriodEnd = new Date('2024-01-31T23:59:59Z');

    const mockDealData = {
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'ABC社 システム導入プロジェクト',
      dealAmount: 1000000,
      stage: '成約',
      closedDate: new Date('2024-01-15T00:00:00Z'),
    };

    const mockInvoices = [
      {
        invoiceId: 'INV-2024-001',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        invoiceStatus: 'issued',
        issuedDate: new Date('2024-01-20T00:00:00Z'),
      },
    ];

    const mockLineItems = [
      {
        invoiceId: 'INV-2024-001',
        lineItems: [
          {
            lineItemId: 'LINE-001',
            productId: 'PROD-A',
            quantity: 100,
            unitPrice: 5000,
            lineAmount: 500000,
            taxRate: 0.1,
          },
          {
            lineItemId: 'LINE-002',
            productId: 'PROD-B',
            quantity: 100,
            unitPrice: 5000,
            lineAmount: 500000,
            taxRate: 0.1,
          },
        ],
      },
    ];

    const mockDealStages = [
      {
        stage: '成約',
        isClosedStage: true,
        isWonStage: true,
      },
      {
        stage: '失注',
        isClosedStage: true,
        isWonStage: false,
      },
    ];

    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValue(mockDealData);
    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValue(
      mockInvoices
    );
    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock).mockResolvedValue(
      mockLineItems
    );
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValue(
      mockDealStages
    );

    const result = await reconcileDealAndInvoice({
      dealId,
      targetPeriodStart,
      targetPeriodEnd,
    });

    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.reconciliationStatus).toBe('success');
    expect(result.dealAmount).toBe(1000000);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.amountDiscrepancy).toBeNull();
    expect(result.invoiceCount).toBe(1);
    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0]).toEqual({
      invoiceId: 'INV-2024-001',
      invoiceAmount: 1000000,
      invoiceStatus: 'issued',
      lineItemCount: 2,
    });
    expect(result.detectedIssues).toEqual([]);
    expect(result.validationTimestamp).toBeInstanceOf(Date);

    expect(dataPersistence.fetchDealById).toHaveBeenCalledWith(dealId);
    expect(dataPersistence.fetchDealsWithInvoices).toHaveBeenCalledWith(dealId);
    expect(dataPersistence.fetchInvoiceWithLineItems).toHaveBeenCalledWith(
      'INV-2024-001'
    );
    expect(dataPersistence.fetchAllDealStages).toHaveBeenCalled();
  });
});
