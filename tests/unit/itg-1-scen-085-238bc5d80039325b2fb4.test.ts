import { reconcileDealAndInvoice } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-085: 商談金額と請求金額の合計が一致しない場合、金額ズレを検出して結果を返す', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = new Date('2024-01-01T00:00:00Z');
  const targetPeriodEnd = new Date('2024-01-31T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();

    const mockFetchDealById = dataPersistence.fetchDealById as jest.Mock;
    mockFetchDealById.mockResolvedValue({
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'ABC株式会社 システム導入プロジェクト',
      dealAmount: 1000000,
      stage: '成約済み',
      closedDate: '2024-01-15T00:00:00Z',
      lossReason: null,
    });

    const mockFetchDealsWithInvoices = dataPersistence.fetchDealsWithInvoices as jest.Mock;
    mockFetchDealsWithInvoices.mockResolvedValue([
      {
        invoiceId: 'INV-2024-001',
        invoiceAmount: 800000,
        taxAmount: 80000,
        invoiceStatus: '発行済み',
        paidDate: null,
        paidAmount: 0,
      },
      {
        invoiceId: 'INV-2024-002',
        invoiceAmount: 150000,
        taxAmount: 15000,
        invoiceStatus: '発行済み',
        paidDate: null,
        paidAmount: 0,
      },
    ]);

    const mockFetchInvoiceWithLineItems = dataPersistence.fetchInvoiceWithLineItems as jest.Mock;
    mockFetchInvoiceWithLineItems
      .mockResolvedValueOnce({
        invoiceId: 'INV-2024-001',
        lineItems: [
          {
            lineItemId: 'LINE-001',
            lineNumber: 1,
            productName: 'システムライセンス',
            quantity: 10,
            unitPrice: 70000,
            lineAmount: 700000,
            taxRate: 0.1,
            taxAmount: 70000,
          },
          {
            lineItemId: 'LINE-002',
            lineNumber: 2,
            productName: '導入サポート',
            quantity: 1,
            unitPrice: 100000,
            lineAmount: 100000,
            taxRate: 0.1,
            taxAmount: 10000,
          },
        ],
      })
      .mockResolvedValueOnce({
        invoiceId: 'INV-2024-002',
        lineItems: [
          {
            lineItemId: 'LINE-003',
            lineNumber: 1,
            productName: '保守サービス',
            quantity: 1,
            unitPrice: 150000,
            lineAmount: 150000,
            taxRate: 0.1,
            taxAmount: 15000,
          },
        ],
      });

    const mockFetchAllDealStages = dataPersistence.fetchAllDealStages as jest.Mock;
    mockFetchAllDealStages.mockResolvedValue([
      {
        stageId: 'STAGE-001',
        stageName: '成約済み',
        isClosedStage: true,
        isLostStage: false,
      },
      {
        stageId: 'STAGE-002',
        stageName: '失注',
        isClosedStage: false,
        isLostStage: true,
      },
    ]);
  });

  test('商談金額と請求金額の合計が一致しない場合、金額ズレを検出して結果を返す', async () => {
    const result = await reconcileDealAndInvoice({
      dealId,
      targetPeriodStart,
      targetPeriodEnd,
    });

    expect(result).toBeDefined();
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.reconciliationStatus).toBe('amount_discrepancy');
    expect(result.dealAmount).toBe(1000000);
    expect(result.totalInvoiceAmount).toBe(950000);
    expect(result.amountDiscrepancy).toBe(50000);
    expect(result.invoiceCount).toBe(2);
    expect(result.invoices).toHaveLength(2);
    expect(result.invoices[0].invoiceId).toBe('INV-2024-001');
    expect(result.invoices[0].invoiceAmount).toBe(800000);
    expect(result.invoices[0].invoiceStatus).toBe('発行済み');
    expect(result.invoices[0].lineItemCount).toBe(2);
    expect(result.invoices[1].invoiceId).toBe('INV-2024-002');
    expect(result.invoices[1].invoiceAmount).toBe(150000);
    expect(result.invoices[1].invoiceStatus).toBe('発行済み');
    expect(result.invoices[1].lineItemCount).toBe(1);
    expect(result.detectedIssues).toHaveLength(1);
    expect(result.detectedIssues[0].issueType).toBe('金額ズレ');
    expect(result.detectedIssues[0].description).toContain('金額ズレを検出しました');
    expect(result.detectedIssues[0].severity).toBe('error');
    expect(result.validationTimestamp).toBeInstanceOf(Date);
  });
});
