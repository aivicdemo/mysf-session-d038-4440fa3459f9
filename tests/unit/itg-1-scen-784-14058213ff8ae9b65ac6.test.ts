import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-784: fetchDealsForPeriod - 作成日時でソート', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort deals by creation date in ascending order', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入案件',
        dealAmount: 5000000,
        stageId: '提案',
        expectedContractDate: '2025-03-15T00:00:00Z',
        description: 'A社向けシステム導入',
        contractedDate: null,
        lossReason: null,
        createdAt: '2025-01-05T10:30:00Z',
        updatedAt: '2025-01-20T14:45:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2025-04-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社保守契約更新',
        dealAmount: 2000000,
        stageId: '交渉中',
        expectedContractDate: '2025-02-28T00:00:00Z',
        description: 'B社保守契約の更新',
        contractedDate: null,
        lossReason: null,
        createdAt: '2025-01-10T09:15:00Z',
        updatedAt: '2025-01-15T11:20:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2025-03-28T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社追加機能開発',
        dealAmount: 3000000,
        stageId: '初期接触',
        expectedContractDate: '2025-04-30T00:00:00Z',
        description: 'A社向け追加機能開発案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2025-01-08T13:00:00Z',
        updatedAt: '2025-01-08T13:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2025-05-30T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'customer-003',
        salesRepresentativeId: 'rep-003',
        dealName: 'C社コンサルティング',
        dealAmount: 1500000,
        stageId: '提案',
        expectedContractDate: '2025-02-15T00:00:00Z',
        description: 'C社向けコンサルティング案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2025-01-12T08:45:00Z',
        updatedAt: '2025-01-12T08:45:00Z',
        createdBy: 'user-003',
        invoiceGenerationSLADeadline: '2025-03-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    jest.mocked(dataStore.listRecords).mockResolvedValue(mockDeals as any);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2025-01-05T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'createdAt',
    });

    // Should return all 4 deals within period
    expect(result.deals).toHaveLength(4);
    expect(result.totalCount).toBe(4);

    // Verify sorted by createdAt in ascending order
    expect(result.deals[0].dealId).toBe('deal-001'); // 2025-01-05T10:30:00Z
    expect(result.deals[1].dealId).toBe('deal-003'); // 2025-01-08T13:00:00Z
    expect(result.deals[2].dealId).toBe('deal-002'); // 2025-01-10T09:15:00Z
    expect(result.deals[3].dealId).toBe('deal-004'); // 2025-01-12T08:45:00Z

    // Verify fetchedAt is ISO 8601 format
    expect(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/.test(result.fetchedAt)).toBe(true);
  });
});
