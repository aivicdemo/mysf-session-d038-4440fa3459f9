import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

describe('SCEN-1657: 前日の営業データ同期対象期間の請求書レコードを旧システムから正常に取得し、次工程に引き継がれる', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch deals for period with proper filtering and sorting by updatedAt descending', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'sales-rep-001',
        dealName: 'A社向けシステム構築案件',
        dealAmount: 5000000,
        stageId: 'proposal',
        expectedContractDate: '2026-10-31T00:00:00Z',
        contractedDate: null,
        description: '基幹システム構築',
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-11-07T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-10-08T10:30:00Z',
        updatedAt: '2026-10-08T14:00:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'sales-rep-002',
        dealName: 'B社向けコンサルティング',
        dealAmount: 3000000,
        stageId: 'negotiation',
        expectedContractDate: '2026-10-25T00:00:00Z',
        contractedDate: null,
        description: '業務最適化コンサルティング',
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-11-04T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-10-07T09:00:00Z',
        updatedAt: '2026-10-08T11:30:00Z',
        createdBy: 'user-002',
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'cust-001',
        salesRepresentativeId: 'sales-rep-001',
        dealName: 'A社向け保守契約',
        dealAmount: 1200000,
        stageId: 'closed',
        expectedContractDate: '2026-10-20T00:00:00Z',
        contractedDate: '2026-10-20T00:00:00Z',
        description: '年間保守サービス',
        lossReason: null,
        invoiceGenerationSLADeadline: '2026-11-19T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-10-06T08:00:00Z',
        updatedAt: '2026-10-08T09:15:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'cust-003',
        salesRepresentativeId: 'sales-rep-003',
        dealName: 'C社向けライセンス販売',
        dealAmount: 800000,
        stageId: 'lost',
        expectedContractDate: '2026-10-15T00:00:00Z',
        contractedDate: null,
        description: 'ソフトウェアライセンス10年契約',
        lossReason: '予算削減',
        invoiceGenerationSLADeadline: '2026-11-14T00:00:00Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2026-10-05T07:00:00Z',
        updatedAt: '2026-10-07T16:00:00Z',
        createdBy: 'user-003',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(mockDeals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2026-10-08T00:00:00Z',
      periodEndDateTime: '2026-10-08T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].updatedAt).toBe('2026-10-08T14:00:00Z');
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[1].updatedAt).toBe('2026-10-08T11:30:00Z');
    expect(result.deals[2].dealId).toBe('deal-003');
    expect(result.deals[2].updatedAt).toBe('2026-10-08T09:15:00Z');
    expect(result.fetchedAt).toBeDefined();
    expect(typeof result.fetchedAt).toBe('string');
  });
});
