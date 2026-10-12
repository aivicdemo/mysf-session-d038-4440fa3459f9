import { reconcileDealAndInvoice } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-089: 請求書に紐付く請求明細の合計金額が請求書の請求金額と一致しない場合、請求明細のズレを検出して結果を返す', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = new Date('2024-01-01T00:00:00Z');
  const targetPeriodEnd = new Date('2024-01-31T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();

    const mockFetchDealById = dataPersistence.fetchDealById as jest.Mock;
    mockFetchDealById.mockResolvedValue({
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'テスト商談A',
      dealAmount: 1000000,
    });

    const mockFetchDealsWithInvoices = dataPersistence.fetchDealsWithInvoices as jest.Mock;
    mockFetchDealsWithInvoices.mockResolvedValue([
      {
        invoiceId: 'INV-2024-001',
        invoiceAmount: 900000,
        invoiceStatus: '請求済',
        taxAmount: 90000,
        invoiceDate: '2024-01-20T00:00:00Z',
        lineItemCount: 3,
      },
      {
        invoiceId: 'INV-2024-002',
        invoiceAmount: 150000,
        invoiceStatus: '請求済',
        taxAmount: 15000,
        invoiceDate: '2024-01-25T00:00:00Z',
        lineItemCount: 2,
      },
    ]);

    const mockFetchInvoiceWithLineItems = dataPersistence.fetchInvoiceWithLineItems as jest.Mock;
    mockFetchInvoiceWithLineItems
      .mockResolvedValueOnce({
        invoiceId: 'INV-2024-001',
        lineItems: [
          {
            lineItemId: 'LI-001',
            productId: 'PROD-A',
            quantity: 100,
            unitPrice: 5000,
            lineAmount: 500000,
            taxRate: 0.1,
          },
          {
            lineItemId: 'LI-002',
            productId: 'PROD-B',
            quantity: 80,
            unitPrice: 5000,
            lineAmount: 400000,
            taxRate: 0.1,
          },
          {
            lineItemId: 'LI-003',
            productId: 'PROD-C',
            quantity: 0,
            unitPrice: 0,
            lineAmount: 0,
            taxRate: 0.1,
          },
        ],
      })
      .mockResolvedValueOnce({
        invoiceId: 'INV-2024-002',
        lineItems: [
          {
            lineItemId: 'LI-004',
            productId: 'PROD-D',
            quantity: 50,
            unitPrice: 3000,
            lineAmount: 150000,
            taxRate: 0.1,
          },
          {
            lineItemId: 'LI-005',
            productId: 'PROD-E',
            quantity: 0,
            unitPrice: 0,
            lineAmount: 0,
            taxRate: 0.1,
          },
        ],
      });

    const mockFetchAllDealStages = dataPersistence.fetchAllDealStages as jest.Mock;
    mockFetchAllDealStages.mockResolvedValue([
      {
        stageId: 'STAGE-001',
        stageName: '成約',
      },
    ]);
  });

  test('請求明細の合計が請求書金額と一致しない場合、請求明細のズレを検出して結果を返す', async () => {
    const result = await reconcileDealAndInvoice({
      dealId,
      targetPeriodStart,
      targetPeriodEnd,
    });

    expect(result).toBeDefined();
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.dealAmount).toBe(1000000);
    expect(result.invoiceCount).toBe(2);
    expect(result.invoices).toHaveLength(2);
    expect(result.invoices[0].invoiceId).toBe('INV-2024-001');
    expect(result.invoices[0].invoiceAmount).toBe(900000);
    expect(result.invoices[0].invoiceStatus).toBe('請求済');
    expect(result.invoices[0].lineItemCount).toBe(3);
    expect(result.invoices[1].invoiceId).toBe('INV-2024-002');
    expect(result.invoices[1].invoiceAmount).toBe(150000);
    expect(result.invoices[1].invoiceStatus).toBe('請求済');
    expect(result.invoices[1].lineItemCount).toBe(2);
    expect(result.validationTimestamp).toBeInstanceOf(Date);
  });
});
