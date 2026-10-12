import { reconcileDealAndInvoice, DealNotFound } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-083: 商談IDが存在し、対象期間内に紐付く請求書があり、商談金額と請求金額が一致している場合', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = new Date('2024-01-01T00:00:00Z');
  const targetPeriodEnd = new Date('2024-01-31T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();

    const mockFetchDealById = dataPersistence.fetchDealById as jest.Mock;
    mockFetchDealById.mockResolvedValue({
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: '顧客A 新規契約',
      amount: 1000000,
      stage: 'Closed Won',
      closedDate: '2024-01-15',
      status: 'contracted',
    });

    const mockFetchDealsWithInvoices = dataPersistence.fetchDealsWithInvoices as jest.Mock;
    mockFetchDealsWithInvoices.mockResolvedValue([
      {
        invoiceId: 'INV-2024-001',
        dealId: '550e8400-e29b-41d4-a716-446655440000',
        invoiceAmount: 1000000,
        taxAmount: 100000,
        invoiceStatus: 'issued',
        invoiceDate: '2024-01-20',
        dueDate: '2024-02-20',
        paidAmount: 1000000,
        paidDate: '2024-02-10',
      },
    ]);

    const mockFetchInvoiceWithLineItems = dataPersistence.fetchInvoiceWithLineItems as jest.Mock;
    mockFetchInvoiceWithLineItems.mockResolvedValue({
      invoiceId: 'INV-2024-001',
      lineItems: [
        {
          invoiceId: 'INV-2024-001',
          lineItemId: 'LINE-001',
          productId: 'PROD-A',
          productName: 'ソフトウェアライセンス',
          quantity: 100,
          unitPrice: 10000,
          lineAmount: 1000000,
          taxRate: 0.1,
          lineItemTaxAmount: 100000,
        },
      ],
    });

    const mockFetchAllDealStages = dataPersistence.fetchAllDealStages as jest.Mock;
    mockFetchAllDealStages.mockResolvedValue([
      {
        stageId: 'STAGE-001',
        stageName: 'Closed Won',
        closedWonFlag: true,
        closedLostFlag: false,
        displayOrder: 10,
      },
      {
        stageId: 'STAGE-002',
        stageName: 'Closed Lost',
        closedWonFlag: false,
        closedLostFlag: true,
        displayOrder: 11,
      },
    ]);
  });

  test('商談金額と請求金額が一致し、ステータスが整合している場合、検証成功を返す', async () => {
    const result = await reconcileDealAndInvoice({
      dealId,
      targetPeriodStart,
      targetPeriodEnd,
    });

    expect(result).toBeDefined();
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.reconciliationStatus).toBe('success');
    expect(result.dealAmount).toBe(1000000);
    expect(result.totalInvoiceAmount).toBe(1000000);
    expect(result.amountDiscrepancy).toBeNull();
    expect(result.invoiceCount).toBe(1);
    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0].invoiceId).toBe('INV-2024-001');
    expect(result.invoices[0].invoiceAmount).toBe(1000000);
    expect(result.invoices[0].invoiceStatus).toBe('issued');
    expect(result.invoices[0].lineItemCount).toBe(1);
    expect(result.detectedIssues).toHaveLength(0);
    expect(result.validationTimestamp).toBeInstanceOf(Date);
  });
});
