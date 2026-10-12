import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import { FetchDealsForPeriodInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-1684: fetchDealsForPeriod with SLA exceeded flag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return deals with invoiceSLAExceededFlag correctly set', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords = jest.fn().mockResolvedValue([
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社契約案件',
        dealAmount: 1000000,
        stageId: '成約',
        expectedContractDate: '2025-01-15T00:00:00Z',
        contractedDate: '2025-01-10T09:00:00Z',
        description: 'テスト商談',
        lossReason: null,
        createdAt: '2025-01-05T10:00:00Z',
        updatedAt: '2025-01-10T09:00:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2025-01-12T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-001',
        dealName: 'B社契約案件',
        dealAmount: 2000000,
        stageId: '成約',
        expectedContractDate: '2025-02-20T00:00:00Z',
        contractedDate: '2025-02-15T14:30:00Z',
        description: 'テスト商談2',
        lossReason: null,
        createdAt: '2025-02-01T08:00:00Z',
        updatedAt: '2025-02-15T14:30:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2025-02-18T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-003',
        salesRepresentativeId: 'rep-002',
        dealName: 'C社契約案件',
        dealAmount: 1500000,
        stageId: '成約',
        expectedContractDate: '2025-03-10T00:00:00Z',
        contractedDate: '2025-03-05T11:15:00Z',
        description: 'テスト商談3',
        lossReason: null,
        createdAt: '2025-02-20T09:30:00Z',
        updatedAt: '2025-03-05T11:15:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2025-03-08T00:00:00Z',
        invoiceSLAExceededFlag: true,
      },
    ]);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-03-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);

    const deal003 = result.deals.find(d => d.dealId === 'deal-003');
    expect(deal003).toBeDefined();
    expect(deal003?.invoiceSLAExceededFlag).toBe(true);

    const deal001 = result.deals.find(d => d.dealId === 'deal-001');
    expect(deal001?.invoiceSLAExceededFlag).toBe(false);
  });
});
