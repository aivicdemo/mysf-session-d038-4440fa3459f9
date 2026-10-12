import { fetchDealsForPeriod, type SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1622: 請求書の期日が本日を過ぎており送付済でない場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchDealsForPeriodが請求SLA超過フラグがtrueの案件を正常に取得する', async () => {
    const mockDealRecords: SaveDealOutput[] = [
      {
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: '案件A',
        dealAmount: 1000000,
        stageId: '成約',
        expectedContractDate: '2024-12-01T00:00:00Z',
        description: 'テスト商談',
        contractedDate: '2024-12-01T00:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-12-08T23:59:59Z',
        invoiceSLAExceededFlag: true,
        createdAt: '2024-11-15T10:00:00Z',
        updatedAt: '2024-12-05T14:30:00Z',
        createdBy: 'user-001',
      },
      {
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: '案件B',
        dealAmount: 2000000,
        stageId: '成約',
        expectedContractDate: '2024-11-20T00:00:00Z',
        description: 'テスト商談2',
        contractedDate: '2024-11-20T00:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-11-23T23:59:59Z',
        invoiceSLAExceededFlag: true,
        createdAt: '2024-11-01T09:00:00Z',
        updatedAt: '2024-12-06T10:15:00Z',
        createdBy: 'user-001',
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValueOnce(mockDealRecords);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-12-01T00:00:00Z',
      periodEndDateTime: '2024-12-10T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(true);
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(true);
    expect(result.fetchedAt).toBeDefined();
  });
});
