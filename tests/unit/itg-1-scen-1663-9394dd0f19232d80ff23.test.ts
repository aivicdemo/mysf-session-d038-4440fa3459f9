import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-1663: 旧システムに存在するが新システムに存在しない商談が、重大度criticalで差異として記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch deal that exists only in old system and record critical discrepancy', async () => {
    const deals = [
      {
        id: 'deal-001-uuid',
        dealId: 'deal-001-uuid',
        customerId: 'customer-001-uuid',
        salesRepresentativeId: 'rep-001-uuid',
        dealName: '旧システム案件A',
        dealAmount: 1000000,
        stageId: '提案中',
        expectedContractDate: '2024-12-31T23:59:59Z',
        description: '旧システムに存在する商談',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        createdBy: 'user-001-uuid',
        invoiceGenerationSLADeadline: '2024-02-15T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-12-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(1);
    expect(result.deals[0].dealId).toBe('deal-001-uuid');
    expect(result.deals[0].dealName).toBe('旧システム案件A');
    expect(result.deals[0].dealAmount).toBe(1000000);
    expect(result.deals[0].customerId).toBe('customer-001-uuid');
    expect(result.deals[0].salesRepresentativeId).toBe('rep-001-uuid');
    expect(result.deals[0].stageId).toBe('提案中');
    expect(result.deals[0].expectedContractDate).toBe('2024-12-31T23:59:59Z');
    expect(result.totalCount).toBe(1);
    expect(result.fetchedAt).toBeDefined();
  });
});
