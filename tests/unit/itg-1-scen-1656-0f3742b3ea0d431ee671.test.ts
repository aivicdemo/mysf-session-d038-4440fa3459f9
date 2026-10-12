import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import type { FetchDealsForPeriodOutput, SaveDealOutput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-1656: fetchDealsForPeriod syncs legacy system data for specified period', () => {
  it('should return deals created or updated within period in descending order by updatedAt', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');

    const dealRecords: SaveDealOutput[] = [
      {
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入案件',
        dealAmount: 5000000,
        stageId: 'stage-proposal',
        expectedContractDate: '2024-12-15T00:00:00Z',
        description: '大規模システム導入プロジェクト',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-11-20T10:30:00Z',
        updatedAt: '2024-11-21T14:45:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-12-20T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社保守契約',
        dealAmount: 1200000,
        stageId: 'stage-negotiation',
        expectedContractDate: '2024-11-30T00:00:00Z',
        description: '既存システムの保守契約更新',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-11-18T09:15:00Z',
        updatedAt: '2024-11-21T10:20:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-12-05T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        dealId: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社追加ライセンス',
        dealAmount: 800000,
        stageId: 'stage-closed-won',
        expectedContractDate: '2024-11-25T00:00:00Z',
        description: '追加ライセンス購入',
        contractedDate: '2024-11-25T16:00:00Z',
        lossReason: null,
        createdAt: '2024-11-10T11:00:00Z',
        updatedAt: '2024-11-25T16:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-11-30T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        dealId: 'deal-004',
        customerId: 'customer-003',
        salesRepresentativeId: 'rep-003',
        dealName: 'C社コンサルティング',
        dealAmount: 2500000,
        stageId: 'stage-discovery',
        expectedContractDate: '2025-01-31T00:00:00Z',
        description: 'デジタル変革コンサルティング',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-11-22T08:00:00Z',
        updatedAt: '2024-11-22T08:00:00Z',
        createdBy: 'user-003',
        invoiceGenerationSLADeadline: '2025-02-06T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(dealRecords);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-11-20T00:00:00Z',
      periodEndDateTime: '2024-11-21T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    // Verify total count includes only deals within period
    expect(result.totalCount).toBe(2);
    expect(result.deals).toHaveLength(2);
    expect(result.fetchedAt).toBeDefined();

    // Verify correct deals are returned (deal-001, deal-002 which have createdAt or updatedAt in period)
    // and sorted by updatedAt in descending order
    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].updatedAt).toBe('2024-11-21T14:45:00Z');

    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[1].updatedAt).toBe('2024-11-21T10:20:00Z');

    // Verify all attributes are preserved for deal-001
    expect(result.deals[0]).toMatchObject({
      dealId: 'deal-001',
      customerId: 'customer-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'A社システム導入案件',
      dealAmount: 5000000,
      stageId: 'stage-proposal',
      expectedContractDate: '2024-12-15T00:00:00Z',
      description: '大規模システム導入プロジェクト',
      contractedDate: null,
      lossReason: null,
      createdAt: '2024-11-20T10:30:00Z',
      createdBy: 'user-001',
      invoiceGenerationSLADeadline: '2024-12-20T23:59:59Z',
      invoiceSLAExceededFlag: false,
    });

    // Verify all attributes are preserved for deal-002
    expect(result.deals[1]).toMatchObject({
      dealId: 'deal-002',
      customerId: 'customer-002',
      salesRepresentativeId: 'rep-002',
      dealName: 'B社保守契約',
      dealAmount: 1200000,
      stageId: 'stage-negotiation',
      expectedContractDate: '2024-11-30T00:00:00Z',
      description: '既存システムの保守契約更新',
      contractedDate: null,
      lossReason: null,
      createdAt: '2024-11-18T09:15:00Z',
      createdBy: 'user-002',
      invoiceGenerationSLADeadline: '2024-12-05T23:59:59Z',
      invoiceSLAExceededFlag: false,
    });
  });
});
