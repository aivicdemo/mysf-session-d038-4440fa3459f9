import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-780: fetchDealsForPeriod - 全フィルター条件省略で更新日時降順', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return deals within period in descending updated date order when no filters applied', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社案件',
        dealAmount: 500000,
        stageId: '提案段階',
        expectedContractDate: '2024-02-15T00:00:00Z',
        description: '大型案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-05T10:30:00Z',
        updatedAt: '2024-01-20T14:45:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社案件',
        dealAmount: 300000,
        stageId: '初期接触',
        expectedContractDate: '2024-03-01T00:00:00Z',
        description: '中規模案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-10T09:15:00Z',
        updatedAt: '2024-01-15T11:22:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-04-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'cust-003',
        salesRepresentativeId: 'rep-001',
        dealName: 'C社案件',
        dealAmount: 750000,
        stageId: '交渉段階',
        expectedContractDate: '2024-02-28T00:00:00Z',
        description: '大型重要案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-02T08:00:00Z',
        updatedAt: '2024-01-25T16:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-28T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'cust-004',
        salesRepresentativeId: 'rep-003',
        dealName: 'D社案件',
        dealAmount: 200000,
        stageId: '見積段階',
        expectedContractDate: '2024-02-10T00:00:00Z',
        description: '小規模案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2023-12-28T13:45:00Z',
        updatedAt: '2023-12-30T09:20:00Z',
        createdBy: 'user-003',
        invoiceGenerationSLADeadline: '2024-03-10T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-005',
        dealId: 'deal-005',
        customerId: 'cust-005',
        salesRepresentativeId: 'rep-002',
        dealName: 'E社案件',
        dealAmount: 450000,
        stageId: '提案段階',
        expectedContractDate: '2024-03-15T00:00:00Z',
        description: '新規顧客案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-12T07:00:00Z',
        updatedAt: '2024-01-28T13:15:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-04-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    jest.mocked(dataStore.listRecords).mockResolvedValue(mockDeals as any);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: null,
    });

    // Should have 4 deals within period (deal-001, 002, 003, 005; deal-004 is out of range)
    expect(result.deals).toHaveLength(4);
    expect(result.totalCount).toBe(4);

    // Verify deals are sorted by updatedAt in descending order
    expect(result.deals[0].dealId).toBe('deal-005'); // 2024-01-28T13:15:00Z
    expect(result.deals[1].dealId).toBe('deal-003'); // 2024-01-25T16:30:00Z
    expect(result.deals[2].dealId).toBe('deal-001'); // 2024-01-20T14:45:00Z
    expect(result.deals[3].dealId).toBe('deal-002'); // 2024-01-15T11:22:00Z

    // Verify fetchedAt is ISO 8601 format
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/.test(result.fetchedAt)).toBe(true);
  });
});
