import { reconcileDealAndInvoice } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchDealsWithInvoices: jest.fn(),
  fetchInvoiceWithLineItems: jest.fn(),
  fetchAllDealStages: jest.fn(),
}));

describe('SCEN-090: 商談に紐付く複数の請求書がある場合、すべての請求金額を集計して検証する', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = new Date('2024-01-01T00:00:00Z');
  const targetPeriodEnd = new Date('2024-01-31T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('複数請求書の金額集計と検証が正常に完了する', async () => {
    // Mock fetchDealById
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValueOnce({
      dealId,
      dealName: 'ABC社システム構築案件',
      dealAmount: 5000000,
      stageId: 'stage-closed-won',
      closedDate: '2024-01-15T00:00:00Z',
      status: '成約済み',
    });

    // Mock fetchDealsWithInvoices
    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValueOnce([
      {
        invoiceId: 'INV-2024-001',
        invoiceAmount: 2500000,
        taxAmount: 250000,
        invoiceStatus: '請求済み',
        invoicedDate: '2024-01-16T00:00:00Z',
      },
      {
        invoiceId: 'INV-2024-002',
        invoiceAmount: 2500000,
        taxAmount: 250000,
        invoiceStatus: '請求済み',
        invoicedDate: '2024-01-20T00:00:00Z',
      },
    ]);

    // Mock fetchInvoiceWithLineItems
    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock)
      .mockResolvedValueOnce({
        invoiceId: 'INV-2024-001',
        lineItems: [
          {
            lineNumber: 1,
            productName: 'システム設計',
            quantity: 100,
            unitPrice: 25000,
            lineAmount: 2500000,
            taxRate: 0.1,
          },
        ],
      })
      .mockResolvedValueOnce({
        invoiceId: 'INV-2024-002',
        lineItems: [
          {
            lineNumber: 1,
            productName: 'システム構築',
            quantity: 100,
            unitPrice: 25000,
            lineAmount: 2500000,
            taxRate: 0.1,
          },
        ],
      });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValueOnce([
      {
        stageName: '成約済み',
        closedFlag: true,
        lostFlag: false,
      },
      {
        stageName: '失注',
        closedFlag: false,
        lostFlag: true,
      },
    ]);

    const result = await reconcileDealAndInvoice({
      dealId,
      targetPeriodStart,
      targetPeriodEnd,
    });

    expect(result.reconciliationStatus).toBe('success');
    expect(result.dealId).toBe(dealId);
    expect(result.dealAmount).toBe(5000000);
    expect(result.totalInvoiceAmount).toBe(5000000);
    expect(result.amountDiscrepancy).toBeNull();
    expect(result.invoiceCount).toBe(2);
    expect(result.invoices).toHaveLength(2);
    expect(result.invoices[0]).toEqual({
      invoiceId: 'INV-2024-001',
      invoiceAmount: 2500000,
      invoiceStatus: '請求済み',
      lineItemCount: 1,
    });
    expect(result.invoices[1]).toEqual({
      invoiceId: 'INV-2024-002',
      invoiceAmount: 2500000,
      invoiceStatus: '請求済み',
      lineItemCount: 1,
    });
    expect(result.detectedIssues).toHaveLength(0);
    expect(result.validationTimestamp).toBeInstanceOf(Date);
  });
});
