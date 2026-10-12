import { fetchDealsForPeriod } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store', () => ({
  ...jest.requireActual<typeof import('../../src/platform/data-store')>('../../src/platform/data-store'),
  listRecords: jest.fn(),
}));

const mockDataStore = require('../../src/platform/data-store');

describe('SCEN-1664: 新システムに存在するが旧システムに存在しない商談が、重大度warningで差異として記録される', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch deals with new-system-only deal and record warning discrepancy', async () => {
    const deals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: '新規案件A',
        dealAmount: 1000000,
        stageId: '提案段階',
        expectedContractDate: '2024-03-31T23:59:59Z',
        description: '旧システムに存在するレコード',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-04-30T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: '新規案件B',
        dealAmount: 2500000,
        stageId: '契約段階',
        expectedContractDate: '2024-02-28T23:59:59Z',
        description: '新システムにのみ存在するレコード',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T14:00:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-03-31T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-02-01T00:00:00Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(2);
    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.totalCount).toBe(2);
    expect(result.fetchedAt).toBeDefined();
  });
});
