import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import { FetchDealsForPeriodInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-1689: fetchDealsForPeriod with SLA exceeded flag true', () => {
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
        salesRepresentativeId: 'sales-rep-001',
        dealName: 'A社 システム導入案件',
        dealAmount: 5000000,
        stageId: '成約',
        expectedContractDate: '2024-12-15T09:00:00Z',
        contractedDate: '2024-12-10T10:30:00Z',
        description: 'A社向けシステム導入',
        lossReason: null,
        createdAt: '2024-10-01T08:00:00Z',
        updatedAt: '2024-12-10T10:30:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2024-12-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'sales-rep-001',
        dealName: 'B社 コンサル案件',
        dealAmount: 3000000,
        stageId: '成約',
        expectedContractDate: '2024-12-20T09:00:00Z',
        contractedDate: '2024-12-18T14:15:00Z',
        description: 'B社向けコンサル',
        lossReason: null,
        createdAt: '2024-11-01T08:00:00Z',
        updatedAt: '2024-12-18T14:15:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2025-01-05T00:00:00Z',
        invoiceSLAExceededFlag: true,
      },
    ]);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2024-10-01T00:00:00Z',
      periodEndDateTime: '2024-12-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(result).toBeDefined();
    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    const deal001 = result.deals.find(d => d.dealId === 'deal-001');
    expect(deal001?.invoiceSLAExceededFlag).toBe(false);

    const deal002 = result.deals.find(d => d.dealId === 'deal-002');
    expect(deal002?.invoiceSLAExceededFlag).toBe(true);
  });
});
