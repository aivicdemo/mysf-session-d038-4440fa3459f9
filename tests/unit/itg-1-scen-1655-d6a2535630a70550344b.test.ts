import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import type { FetchDealsForPeriodOutput, SaveDealOutput } from '../../src/logic/data-persistence';

jest.mock('../../src/platform/data-store.ts');

describe('SCEN-1655: fetchDealsForPeriod returns deals sorted by updatedAt', () => {
  it('should return all deals from period sorted by updatedAt in descending order', async () => {
    const mockDataStore = require('../../src/platform/data-store.ts');

    const dealRecords: SaveDealOutput[] = [
      {
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社新規案件',
        dealAmount: 1000000,
        stageId: '提案段階',
        expectedContractDate: '2026-12-31T23:59:59Z',
        description: 'テスト商談',
        contractedDate: null,
        lossReason: null,
        createdAt: '2026-10-01T10:00:00Z',
        updatedAt: '2026-10-15T14:30:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2026-11-30T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社拡大案件',
        dealAmount: 2500000,
        stageId: '成約',
        expectedContractDate: '2026-11-15T23:59:59Z',
        description: 'テスト商談2',
        contractedDate: '2026-11-10T09:00:00Z',
        lossReason: null,
        createdAt: '2026-09-20T08:00:00Z',
        updatedAt: '2026-10-12T11:20:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2026-12-10T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        dealId: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社追加案件',
        dealAmount: 500000,
        stageId: '初期接触',
        expectedContractDate: '2027-01-31T23:59:59Z',
        description: 'テスト商談3',
        contractedDate: null,
        lossReason: null,
        createdAt: '2026-10-05T15:45:00Z',
        updatedAt: '2026-10-05T15:45:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2027-01-15T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(dealRecords);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2026-10-01T00:00:00Z',
      periodEndDateTime: '2026-10-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.fetchedAt).toBeDefined();

    // Verify deals are sorted by updatedAt in descending order
    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].updatedAt).toBe('2026-10-15T14:30:00Z');
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[1].updatedAt).toBe('2026-10-12T11:20:00Z');
    expect(result.deals[2].dealId).toBe('deal-003');
    expect(result.deals[2].updatedAt).toBe('2026-10-05T15:45:00Z');

    // Verify all attributes are present
    expect(result.deals[0]).toMatchObject({
      dealId: 'deal-001',
      customerId: 'customer-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'A社新規案件',
      dealAmount: 1000000,
      stageId: '提案段階',
      expectedContractDate: '2026-12-31T23:59:59Z',
      description: 'テスト商談',
      contractedDate: null,
      lossReason: null,
      createdAt: '2026-10-01T10:00:00Z',
      createdBy: 'admin-001',
      invoiceGenerationSLADeadline: '2026-11-30T23:59:59Z',
      invoiceSLAExceededFlag: false,
    });
  });
});
