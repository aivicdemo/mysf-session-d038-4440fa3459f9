import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-792: fetchDealsForPeriod returns totalCount with total matching records', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return totalCount containing the number of deals matching search conditions', async () => {
    const testDeals = [
      {
        id: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入案件',
        dealAmount: 5000000,
        stageId: '提案段階',
        expectedContractDate: '2024-02-15T00:00:00Z',
        description: '大規模システム導入',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-01-10T14:30:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2024-03-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社保守契約更新',
        dealAmount: 1200000,
        stageId: '契約段階',
        expectedContractDate: '2024-01-25T00:00:00Z',
        description: '年間保守契約',
        contractedDate: '2024-01-20T00:00:00Z',
        lossReason: null,
        createdAt: '2023-12-20T09:00:00Z',
        updatedAt: '2024-01-15T11:00:00Z',
        createdBy: 'admin-002',
        invoiceGenerationSLADeadline: '2024-02-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        customerId: 'customer-003',
        salesRepresentativeId: 'rep-001',
        dealName: 'C社ライセンス追加',
        dealAmount: 800000,
        stageId: '初期段階',
        expectedContractDate: '2024-02-28T00:00:00Z',
        description: 'ソフトウェアライセンス追加購入',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-12T13:00:00Z',
        updatedAt: '2024-01-22T16:45:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2024-03-22T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(testDeals);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.totalCount).toBe(3);
    expect(result.deals).toHaveLength(3);
    expect(result.fetchedAt).toBeDefined();
  });
});
