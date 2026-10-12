import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-786: fetchDealsForPeriod - 成約予定日でソート', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort deals by expected contract date in ascending order', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社案件',
        dealAmount: 1000000,
        stageId: 'stage-001',
        expectedContractDate: '2024-03-15T00:00:00Z',
        description: 'テスト商談1',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-001',
        dealName: 'B社案件',
        dealAmount: 500000,
        stageId: 'stage-001',
        expectedContractDate: '2024-02-10T00:00:00Z',
        description: 'テスト商談2',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-12T09:00:00Z',
        updatedAt: '2024-01-18T11:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-02-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-002',
        dealName: 'C社案件',
        dealAmount: 1500000,
        stageId: 'stage-002',
        expectedContractDate: '2024-04-20T00:00:00Z',
        description: 'テスト商談3',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-08T09:00:00Z',
        updatedAt: '2024-01-20T14:15:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-04-25T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'customer-003',
        salesRepresentativeId: 'rep-002',
        dealName: 'D社案件',
        dealAmount: 800000,
        stageId: 'stage-001',
        expectedContractDate: '2024-01-25T00:00:00Z',
        description: 'テスト商談4',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-05T09:00:00Z',
        updatedAt: '2024-01-22T16:45:00Z',
        createdBy: 'user-003',
        invoiceGenerationSLADeadline: '2024-01-30T00:00:00Z',
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
      sortBy: 'expectedContractDate',
    });

    // Should return all 4 deals within period
    expect(result.deals).toHaveLength(4);
    expect(result.totalCount).toBe(4);

    // Verify sorted by expectedContractDate in ascending order
    expect(result.deals[0].dealId).toBe('deal-004'); // 2024-01-25T00:00:00Z
    expect(result.deals[0].expectedContractDate).toBe('2024-01-25T00:00:00Z');

    expect(result.deals[1].dealId).toBe('deal-002'); // 2024-02-10T00:00:00Z
    expect(result.deals[1].expectedContractDate).toBe('2024-02-10T00:00:00Z');

    expect(result.deals[2].dealId).toBe('deal-001'); // 2024-03-15T00:00:00Z
    expect(result.deals[2].expectedContractDate).toBe('2024-03-15T00:00:00Z');

    expect(result.deals[3].dealId).toBe('deal-003'); // 2024-04-20T00:00:00Z
    expect(result.deals[3].expectedContractDate).toBe('2024-04-20T00:00:00Z');

    // Verify fetchedAt is ISO 8601 format
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/.test(result.fetchedAt)).toBe(true);
  });
});
