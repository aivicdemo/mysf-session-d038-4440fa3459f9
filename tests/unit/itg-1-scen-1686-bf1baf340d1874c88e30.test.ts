import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import { FetchDealsForPeriodInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-1686: fetchDealsForPeriod with SLA deadline <= 0', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return deals including one with negative SLA deadline', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords = jest.fn().mockResolvedValue([
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: '案件A',
        dealAmount: 1000000,
        stageId: '成約',
        expectedContractDate: '2026-01-15T00:00:00Z',
        contractedDate: '2026-01-10T00:00:00Z',
        description: 'テスト案件',
        lossReason: null,
        createdAt: '2026-01-05T10:00:00Z',
        updatedAt: '2026-01-10T15:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2026-01-05T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: '案件B',
        dealAmount: 500000,
        stageId: '提案',
        expectedContractDate: '2026-02-20T00:00:00Z',
        contractedDate: null,
        description: 'テスト案件2',
        lossReason: null,
        createdAt: '2026-01-08T09:00:00Z',
        updatedAt: '2026-01-12T14:00:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '-1',
        invoiceSLAExceededFlag: true,
      },
    ]);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2026-01-01T00:00:00Z',
      periodEndDateTime: '2026-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(result).toBeDefined();
    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    const deal002 = result.deals.find(d => d.dealId === 'deal-002');
    expect(deal002).toBeDefined();
    expect(deal002?.invoiceGenerationSLADeadline).toBe('-1');
    expect(deal002?.invoiceSLAExceededFlag).toBe(true);
  });
});
