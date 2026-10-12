import { reconcileDealAndInvoice } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-088: 失注商談に対して請求書が存在する場合、ステータス不整合を検出して結果を返す', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = new Date('2024-01-01T00:00:00Z');
  const targetPeriodEnd = new Date('2024-01-31T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();

    const mockFetchDealById = dataPersistence.fetchDealById as jest.Mock;
    mockFetchDealById.mockResolvedValue({
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'ABC社 システム導入プロジェクト',
      dealAmount: 5000000,
      dealStage: '失注',
      stageDefinition: {
        stageName: '失注',
        isClosedWonStage: false,
        isClosedLostStage: true,
      },
      closedDate: '2023-12-15T00:00:00Z',
      lostReason: '予算削減',
    });

    const mockFetchDealsWithInvoices = dataPersistence.fetchDealsWithInvoices as jest.Mock;
    mockFetchDealsWithInvoices.mockResolvedValue([
      {
        invoiceId: 'INV-2024-0001',
        invoiceAmount: 2500000,
        invoiceStatus: '未請求',
        invoiceIssuedDate: '2024-01-10T00:00:00Z',
        paymentStatus: '未入金',
      },
    ]);

    const mockFetchInvoiceWithLineItems = dataPersistence.fetchInvoiceWithLineItems as jest.Mock;
    mockFetchInvoiceWithLineItems.mockResolvedValue({
      invoiceId: 'INV-2024-0001',
      lineItems: [
        {
          invoiceId: 'INV-2024-0001',
          lineItemNo: 1,
          productId: 'PROD-001',
          productName: 'システム導入コンサルティング',
          quantity: 100,
          unitPrice: 25000,
          lineAmount: 2500000,
          taxRate: 0.1,
        },
      ],
    });

    const mockFetchAllDealStages = dataPersistence.fetchAllDealStages as jest.Mock;
    mockFetchAllDealStages.mockResolvedValue([
      {
        stageName: '新規',
        isClosedWonStage: false,
        isClosedLostStage: false,
      },
      {
        stageName: '成約済み',
        isClosedWonStage: true,
        isClosedLostStage: false,
      },
      {
        stageName: '失注',
        isClosedWonStage: false,
        isClosedLostStage: true,
      },
    ]);
  });

  test('失注商談に対して請求書が存在する場合、ステータス不整合を検出して結果を返す', async () => {
    const result = await reconcileDealAndInvoice({
      dealId,
      targetPeriodStart,
      targetPeriodEnd,
    });

    expect(result).toBeDefined();
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.reconciliationStatus).toBe('status_mismatch');
    expect(result.dealAmount).toBe(5000000);
    expect(result.totalInvoiceAmount).toBe(2500000);
    expect(result.amountDiscrepancy).toBe(2500000);
    expect(result.invoiceCount).toBe(1);
    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0].invoiceId).toBe('INV-2024-0001');
    expect(result.invoices[0].invoiceAmount).toBe(2500000);
    expect(result.invoices[0].invoiceStatus).toBe('未請求');
    expect(result.invoices[0].lineItemCount).toBe(1);
    expect(result.detectedIssues).toHaveLength(1);
    expect(result.detectedIssues[0].issueType).toBe('status_mismatch');
    expect(result.detectedIssues[0].description).toContain('失注商談に対して請求書が存在しています');
    expect(result.detectedIssues[0].severity).toBe('error');
    expect(result.validationTimestamp).toBeInstanceOf(Date);
  });
});
