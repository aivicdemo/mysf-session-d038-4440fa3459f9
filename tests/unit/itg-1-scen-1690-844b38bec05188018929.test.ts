import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import { FetchDealsForPeriodInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-1690: fetchDealsForPeriod with invoiceSLAExceededFlag false', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return deals with invoiceSLAExceededFlag false', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords = jest.fn().mockResolvedValue([
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社向けシステム導入',
        dealAmount: 5000000,
        stageId: '成約',
        expectedContractDate: '2024-01-15T00:00:00Z',
        contractedDate: '2024-01-10T09:00:00Z',
        description: '大規模システム導入案件',
        lossReason: null,
        createdAt: '2023-12-01T10:00:00Z',
        updatedAt: '2024-01-10T09:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-01-17T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社向けコンサルティング',
        dealAmount: 2000000,
        stageId: '成約',
        expectedContractDate: '2024-01-20T00:00:00Z',
        contractedDate: '2024-01-12T14:30:00Z',
        description: '経営コンサルティング案件',
        lossReason: null,
        createdAt: '2023-12-05T11:00:00Z',
        updatedAt: '2024-01-12T14:30:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-01-19T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'C社向けサポート契約',
        dealAmount: 1500000,
        stageId: '成約',
        expectedContractDate: '2024-01-25T00:00:00Z',
        contractedDate: '2024-01-14T16:00:00Z',
        description: '年間サポート契約',
        lossReason: null,
        createdAt: '2023-12-10T09:30:00Z',
        updatedAt: '2024-01-14T16:00:00Z',
        createdBy: 'user-003',
        invoiceGenerationSLADeadline: '2024-01-21T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
    ]);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2024-01-09T00:00:00Z',
      periodEndDateTime: '2024-01-15T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(result).toBeDefined();
    expect(result.deals).toBeDefined();
    expect(result.totalCount).toBe(3);
    expect(result.deals).toHaveLength(3);

    result.deals.forEach(deal => {
      expect(deal.invoiceSLAExceededFlag).toBe(false);
    });
  });
});
