import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import { FetchDealsForPeriodInput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-1688: fetchDealsForPeriod with deals updated in period', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return deals updated within period', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');
    mockDataStore.listRecords = jest.fn().mockResolvedValue([
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-A',
        salesRepresentativeId: 'rep-001',
        dealName: '案件A',
        dealAmount: 1000000,
        stageId: '成約',
        expectedContractDate: '2025-01-15T00:00:00Z',
        contractedDate: '2025-01-10T00:00:00Z',
        description: 'テスト商談',
        lossReason: null,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-10T14:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2025-01-17T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-B',
        salesRepresentativeId: 'rep-002',
        dealName: '案件B',
        dealAmount: 500000,
        stageId: '成約',
        expectedContractDate: '2025-01-20T00:00:00Z',
        contractedDate: '2025-01-12T00:00:00Z',
        description: 'テスト商談2',
        lossReason: null,
        createdAt: '2025-01-02T09:00:00Z',
        updatedAt: '2025-01-12T16:45:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2025-01-19T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-A',
        salesRepresentativeId: 'rep-001',
        dealName: '案件C',
        dealAmount: 750000,
        stageId: '成約',
        expectedContractDate: '2025-02-01T00:00:00Z',
        contractedDate: '2025-01-18T00:00:00Z',
        description: 'テスト商談3',
        lossReason: null,
        createdAt: '2025-01-05T11:00:00Z',
        updatedAt: '2025-01-18T13:20:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2025-01-25T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'customer-C',
        salesRepresentativeId: 'rep-003',
        dealName: '案件D',
        dealAmount: 300000,
        stageId: '成約',
        expectedContractDate: '2025-02-05T00:00:00Z',
        contractedDate: '2025-01-25T00:00:00Z',
        description: 'テスト商談4',
        lossReason: null,
        createdAt: '2025-01-08T08:30:00Z',
        updatedAt: '2025-01-25T15:00:00Z',
        createdBy: 'user-003',
        invoiceGenerationSLADeadline: '2025-02-01T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ]);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2025-01-10T00:00:00Z',
      periodEndDateTime: '2025-01-25T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(result).toBeDefined();
    expect(result.deals).toBeDefined();
    expect(result.totalCount).toBe(2);
    expect(result.deals).toHaveLength(2);

    const dealIds = result.deals.map(d => d.dealId);
    expect(dealIds).toContain('deal-002');
    expect(dealIds).toContain('deal-004');
  });
});
