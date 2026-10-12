import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import { FetchDealsForPeriodInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-1691: fetchDealsForPeriod within period', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return deals within the specified period', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords = jest.fn().mockResolvedValue([
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: '顧客A 契約案件',
        dealAmount: 1000000,
        stageId: '成約',
        expectedContractDate: '2024-01-15T00:00:00Z',
        contractedDate: '2024-01-15T10:30:00Z',
        description: '大型案件',
        lossReason: null,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-01-22T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: '顧客B 案件',
        dealAmount: 500000,
        stageId: '成約',
        expectedContractDate: '2024-01-20T00:00:00Z',
        contractedDate: '2024-01-20T14:45:00Z',
        description: '中規模案件',
        lossReason: null,
        createdAt: '2024-01-12T08:00:00Z',
        updatedAt: '2024-01-20T14:45:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-01-27T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ]);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2024-01-10T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(result).toBeDefined();
    expect(result.deals).toBeDefined();
    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    result.deals.forEach(deal => {
      expect(deal.invoiceSLAExceededFlag).toBe(false);
    });
  });
});
