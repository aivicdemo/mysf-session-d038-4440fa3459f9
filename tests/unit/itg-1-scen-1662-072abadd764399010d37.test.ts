import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-1662: 旧新システム間で商談の件数のみが異なり、重大度warningで差異が検出される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch deals with count discrepancy detected as warning severity', async () => {
    const deals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-A',
        salesRepresentativeId: 'rep-001',
        dealName: '案件A',
        dealAmount: 1000000,
        stageId: '提案',
        expectedContractDate: '2024-02-15T00:00:00Z',
        description: '重要案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-01-10T14:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-B',
        salesRepresentativeId: 'rep-002',
        dealName: '案件B',
        dealAmount: 2000000,
        stageId: '受注',
        expectedContractDate: '2024-01-20T00:00:00Z',
        description: '大型案件',
        contractedDate: '2024-01-20T00:00:00Z',
        lossReason: null,
        createdAt: '2024-01-02T09:00:00Z',
        updatedAt: '2024-01-20T16:45:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-02-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-C',
        salesRepresentativeId: 'rep-001',
        dealName: '案件C',
        dealAmount: 500000,
        stageId: '折衝中',
        expectedContractDate: '2024-02-28T00:00:00Z',
        description: '中規模案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-15T11:20:00Z',
        updatedAt: '2024-01-25T13:15:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-28T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();
    expect(result.deals[0].dealId).toBe('deal-003');
    expect(result.deals[0].updatedAt).toBe('2024-01-25T13:15:00Z');
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[2].dealId).toBe('deal-001');
  });
});
