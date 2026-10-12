import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import { FetchDealsForPeriodInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-1687: fetchDealsForPeriod filters by period', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return deals updated within the specified period, sorted by updatedAt', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords = jest.fn().mockResolvedValue([
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入案件',
        dealAmount: 5000000,
        stageId: '成約',
        expectedContractDate: '2024-12-15T00:00:00Z',
        contractedDate: '2024-12-10T10:30:00Z',
        description: '大規模システム導入',
        lossReason: null,
        createdAt: '2024-11-01T08:00:00Z',
        updatedAt: '2024-12-10T10:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-12-17T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社コンサルティング',
        dealAmount: 3000000,
        stageId: '成約',
        expectedContractDate: '2024-12-20T00:00:00Z',
        contractedDate: '2024-12-18T14:15:00Z',
        description: '経営コンサルティング',
        lossReason: null,
        createdAt: '2024-11-05T09:00:00Z',
        updatedAt: '2024-12-18T14:15:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-12-22T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社追加ライセンス',
        dealAmount: 1500000,
        stageId: '提案',
        expectedContractDate: '2025-01-10T00:00:00Z',
        contractedDate: null,
        description: '既存顧客への追加サービス',
        lossReason: null,
        createdAt: '2024-12-01T11:00:00Z',
        updatedAt: '2024-12-05T16:45:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
      },
    ]);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2024-12-10T00:00:00Z',
      periodEndDateTime: '2024-12-19T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[1].dealId).toBe('deal-001');
  });
});
