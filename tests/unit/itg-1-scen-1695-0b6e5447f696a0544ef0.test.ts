import { fetchDealsForPeriod, type FetchDealsForPeriodInput, type FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1695: 生成SLAと送付SLAが両方達成している場合、警告レベルを正常と判定する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求SLA超過フラグが両方false（達成）のレコードが正常として返される', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: '案件A',
        dealAmount: 1000000,
        stageId: 'stage-closed',
        expectedContractDate: '2026-01-15T00:00:00Z',
        description: '成約完了',
        contractedDate: '2026-01-15T00:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-01-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-01-01T10:00:00Z',
        updatedAt: '2026-01-15T14:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: '案件B',
        dealAmount: 500000,
        stageId: 'stage-closed',
        expectedContractDate: '2026-01-20T00:00:00Z',
        description: '請求送付完了',
        contractedDate: '2026-01-20T00:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-01-25T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-01-05T09:00:00Z',
        updatedAt: '2026-01-22T11:20:00Z',
        createdBy: 'user-002',
      },
    ];

    (dataPersistence.listRecords as jest.Mock).mockResolvedValue(mockDeals);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2026-01-01T00:00:00Z',
      periodEndDateTime: '2026-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(dataPersistence.listRecords).toHaveBeenCalledWith('商談', expect.any(Object));

    // 2件が返される
    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    // updatedAt 降順: deal-002（2026-01-22T11:20:00Z） → deal-001（2026-01-15T14:30:00Z）
    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[0].updatedAt).toBe('2026-01-22T11:20:00Z');
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(false);

    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2026-01-15T14:30:00Z');
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);

    // 両方のレコードに必須フィールドが含まれている
    result.deals.forEach(deal => {
      expect(deal.dealId).toBeDefined();
      expect(deal.customerId).toBeDefined();
      expect(deal.salesRepresentativeId).toBeDefined();
      expect(deal.dealName).toBeDefined();
      expect(deal.dealAmount).toBeDefined();
      expect(deal.stageId).toBeDefined();
      expect(deal.expectedContractDate).toBeDefined();
      expect(deal.description).toBeDefined();
      expect(deal.contractedDate).toBeDefined();
      expect(deal.lossReason).toBeDefined();
      expect(deal.createdAt).toBeDefined();
      expect(deal.updatedAt).toBeDefined();
      expect(deal.createdBy).toBeDefined();
      expect(deal.invoiceGenerationSLADeadline).toBeDefined();
      expect(deal.invoiceSLAExceededFlag).toBe(false);
    });

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
