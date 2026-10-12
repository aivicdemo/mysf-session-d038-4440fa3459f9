import { reconcileDealAndInvoice } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-087: 成約済み商談に対して請求ステータスが未請求の場合、ステータス不整合を検出して結果を返す', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = new Date('2026-01-01T00:00:00Z');
  const targetPeriodEnd = new Date('2026-01-31T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();

    const mockFetchDealById = dataPersistence.fetchDealById as jest.Mock;
    mockFetchDealById.mockResolvedValue({
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'ABC社システム導入案件',
      dealAmount: 5000000,
      stage: '成約',
      closedDate: '2025-12-15T00:00:00Z',
      lostReason: null,
    });

    const mockFetchDealsWithInvoices = dataPersistence.fetchDealsWithInvoices as jest.Mock;
    mockFetchDealsWithInvoices.mockResolvedValue([
      {
        invoiceId: 'INV-2026-001',
        invoiceAmount: 0,
        invoiceStatus: 'unbilled',
        invoiceDate: null,
        paymentStatus: 'unpaid',
      },
    ]);

    const mockFetchInvoiceWithLineItems = dataPersistence.fetchInvoiceWithLineItems as jest.Mock;
    mockFetchInvoiceWithLineItems.mockResolvedValue({
      invoiceId: 'INV-2026-001',
      lineItems: [],
    });

    const mockFetchAllDealStages = dataPersistence.fetchAllDealStages as jest.Mock;
    mockFetchAllDealStages.mockResolvedValue([
      {
        stageId: 'stage-closed-won',
        stageName: '成約',
        isClosedWonStage: true,
        isLostStage: false,
        displayOrder: 5,
      },
      {
        stageId: 'stage-lost',
        stageName: '失注',
        isClosedWonStage: false,
        isLostStage: true,
        displayOrder: 6,
      },
    ]);
  });

  test('成約済み商談に対して請求ステータスが未請求の場合、ステータス不整合を検出して結果を返す', async () => {
    const result = await reconcileDealAndInvoice({
      dealId,
      targetPeriodStart,
      targetPeriodEnd,
    });

    expect(result).toBeDefined();
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.reconciliationStatus).toBe('status_mismatch');
    expect(result.dealAmount).toBe(5000000);
    expect(result.totalInvoiceAmount).toBe(0);
    expect(result.amountDiscrepancy).toBeNull();
    expect(result.invoiceCount).toBe(1);
    expect(result.invoices).toHaveLength(1);
    expect(result.invoices[0].invoiceId).toBe('INV-2026-001');
    expect(result.invoices[0].invoiceAmount).toBe(0);
    expect(result.invoices[0].invoiceStatus).toBe('unbilled');
    expect(result.invoices[0].lineItemCount).toBe(0);
    expect(result.detectedIssues).toHaveLength(1);
    expect(result.detectedIssues[0].issueType).toBe('StatusMismatchDetected');
    expect(result.detectedIssues[0].description).toContain('ステータス不整合を検出しました');
    expect(result.detectedIssues[0].severity).toBe('error');
    expect(result.validationTimestamp).toBeInstanceOf(Date);
  });
});
