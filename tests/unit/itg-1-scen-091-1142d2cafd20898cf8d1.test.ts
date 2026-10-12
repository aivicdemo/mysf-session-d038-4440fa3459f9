import { reconcileDealAndInvoice } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence', () => ({
  ...jest.requireActual<typeof import('../../src/logic/data-persistence')>('../../src/logic/data-persistence'),
  fetchDealById: jest.fn(),
  fetchDealsWithInvoices: jest.fn(),
  fetchInvoiceWithLineItems: jest.fn(),
  fetchAllDealStages: jest.fn(),
}));

describe('SCEN-091: 検証対象期間外の請求書は集計に含めない', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = new Date('2024-01-01T00:00:00Z');
  const targetPeriodEnd = new Date('2024-01-31T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間外の請求書を除外して検証する', async () => {
    // Mock fetchDealById
    (dataPersistence.fetchDealById as jest.Mock).mockResolvedValueOnce({
      dealId,
      dealName: 'A社システム導入案件',
      dealAmount: 5000000,
      stageId: 'stage-closed-won',
      closedDate: '2024-01-15T00:00:00Z',
      status: '成約済み',
    });

    // Mock fetchDealsWithInvoices - one invoice in period, one outside
    (dataPersistence.fetchDealsWithInvoices as jest.Mock).mockResolvedValueOnce([
      {
        invoiceId: 'INV-2024-001',
        invoiceAmount: 2500000,
        taxAmount: 250000,
        invoiceStatus: '請求済み',
        paidDate: '2024-01-25T00:00:00Z',
        paidAmount: 2500000,
      },
      {
        invoiceId: 'INV-2024-002',
        invoiceAmount: 2500000,
        taxAmount: 250000,
        invoiceStatus: '請求済み',
        paidDate: '2024-02-15T00:00:00Z',
        paidAmount: 2500000,
      },
    ]);

    // Mock fetchInvoiceWithLineItems - only for period-in invoice
    (dataPersistence.fetchInvoiceWithLineItems as jest.Mock).mockResolvedValueOnce({
      invoiceId: 'INV-2024-001',
      lineItems: [
        {
          lineNumber: 1,
          productId: 'PROD-001',
          productName: 'システム導入サービス',
          quantity: 1,
          unitPrice: 2500000,
          lineAmount: 2500000,
          taxRate: 0.1,
        },
      ],
    });

    // Mock fetchAllDealStages
    (dataPersistence.fetchAllDealStages as jest.Mock).mockResolvedValueOnce([
      {
        stageId: 'stage-closed-won',
        stageName: '成約済み',
        isClosedWon: true,
        isClosedLost: false,
      },
    ]);

    const result = await reconcileDealAndInvoice({
      dealId,
      targetPeriodStart,
      targetPeriodEnd,
    });

    expect(result.dealId).toBe(dealId);
    expect(result.dealAmount).toBe(5000000);
    expect(result.totalInvoiceAmount).toBe(2500000);
    expect(result.amountDiscrepancy).toBe(2500000);
    expect(result.invoiceCount).toBe(1);
    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0]).toEqual({
      invoiceId: 'INV-2024-001',
      invoiceAmount: 2500000,
      invoiceStatus: '請求済み',
      lineItemCount: 1,
    });
    expect(result.reconciliationStatus).toBe('amount_discrepancy');
    expect(result.detectedIssues).toHaveLength(1);
    expect(result.detectedIssues[0].issueType).toBe('amount_discrepancy');
    expect(result.detectedIssues[0].severity).toBe('error');
    expect(result.validationTimestamp).toBeInstanceOf(Date);
  });
});
