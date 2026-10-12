import { reconcileDealAndInvoice } from '../../src/logic/deal-invoice-reconciliation';
import * as dataPersistence from '../../src/logic/data-persistence';

jest.mock('../../src/logic/data-persistence');

describe('SCEN-086: 成約済み商談に対して請求書が存在しない場合、未請求を検出して結果を返す', () => {
  const dealId = '550e8400-e29b-41d4-a716-446655440000';
  const targetPeriodStart = new Date('2024-01-01T00:00:00Z');
  const targetPeriodEnd = new Date('2024-01-31T23:59:59Z');

  beforeEach(() => {
    jest.clearAllMocks();

    const mockFetchDealById = dataPersistence.fetchDealById as jest.Mock;
    mockFetchDealById.mockResolvedValue({
      dealId: '550e8400-e29b-41d4-a716-446655440000',
      dealName: 'ABC社 システム導入案件',
      dealAmount: 5000000,
      stage: 'stage-closed-won',
      closedDate: '2024-01-15T00:00:00Z',
      dealStatus: 'closed_won',
    });

    const mockFetchDealsWithInvoices = dataPersistence.fetchDealsWithInvoices as jest.Mock;
    mockFetchDealsWithInvoices.mockResolvedValue([]);

    const mockFetchInvoiceWithLineItems = dataPersistence.fetchInvoiceWithLineItems as jest.Mock;
    mockFetchInvoiceWithLineItems.mockResolvedValue({
      invoiceId: null,
      lineItems: [],
    });

    const mockFetchAllDealStages = dataPersistence.fetchAllDealStages as jest.Mock;
    mockFetchAllDealStages.mockResolvedValue([
      {
        stageId: 'stage-closed-won',
        stageName: '成約',
        isClosedStage: true,
        isWonStage: true,
        isLostStage: false,
      },
      {
        stageId: 'stage-closed-lost',
        stageName: '失注',
        isClosedStage: true,
        isWonStage: false,
        isLostStage: true,
      },
    ]);
  });

  test('成約済み商談に対して請求書が存在しない場合、未請求を検出して結果を返す', async () => {
    const result = await reconcileDealAndInvoice({
      dealId,
      targetPeriodStart,
      targetPeriodEnd,
    });

    expect(result).toBeDefined();
    expect(result.dealId).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(result.reconciliationStatus).toBe('unbilled');
    expect(result.dealAmount).toBe(5000000);
    expect(result.totalInvoiceAmount).toBe(0);
    expect(result.amountDiscrepancy).toBeNull();
    expect(result.invoiceCount).toBe(0);
    expect(result.invoices).toHaveLength(0);
    expect(result.detectedIssues).toHaveLength(1);
    expect(result.detectedIssues[0].issueType).toBe('UnbilledDealDetected');
    expect(result.detectedIssues[0].description).toContain('未請求案件を検出しました');
    expect(result.detectedIssues[0].severity).toBe('error');
    expect(result.validationTimestamp).toBeInstanceOf(Date);
  });
});
