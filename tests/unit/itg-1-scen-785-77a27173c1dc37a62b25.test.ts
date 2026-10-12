import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-785: fetchDealsForPeriod - 金額でソート', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should sort deals by deal amount in ascending order', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: '商談A',
        dealAmount: 500000,
        stageId: 'stage-01',
        expectedContractDate: '2024-02-15T00:00:00Z',
        description: 'テスト商談A',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-10T10:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-02-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: '商談B',
        dealAmount: 1200000,
        stageId: 'stage-02',
        expectedContractDate: '2024-02-28T00:00:00Z',
        description: 'テスト商談B',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-12T09:00:00Z',
        updatedAt: '2024-01-18T11:00:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-05T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: '商談C',
        dealAmount: 750000,
        stageId: 'stage-01',
        expectedContractDate: '2024-03-10T00:00:00Z',
        description: 'テスト商談C',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-11T13:00:00Z',
        updatedAt: '2024-01-20T15:45:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-03-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: '商談D',
        dealAmount: 300000,
        stageId: 'stage-03',
        expectedContractDate: '2024-02-05T00:00:00Z',
        description: 'テスト商談D',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-14T08:30:00Z',
        updatedAt: '2024-01-19T09:15:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-02-10T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    jest.mocked(dataStore.listRecords).mockResolvedValue(mockDeals as any);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-10T00:00:00Z',
      periodEndDateTime: '2024-01-21T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'dealAmount',
    });

    // Should return all 4 deals within period
    expect(result.deals).toHaveLength(4);
    expect(result.totalCount).toBe(4);

    // Verify sorted by dealAmount in ascending order
    expect(result.deals[0].dealId).toBe('deal-004'); // 300000
    expect(result.deals[0].dealAmount).toBe(300000);

    expect(result.deals[1].dealId).toBe('deal-001'); // 500000
    expect(result.deals[1].dealAmount).toBe(500000);

    expect(result.deals[2].dealId).toBe('deal-003'); // 750000
    expect(result.deals[2].dealAmount).toBe(750000);

    expect(result.deals[3].dealId).toBe('deal-002'); // 1200000
    expect(result.deals[3].dealAmount).toBe(1200000);

    // Verify all required fields are present
    result.deals.forEach(deal => {
      expect(deal.dealId).toBeDefined();
      expect(deal.customerId).toBeDefined();
      expect(deal.salesRepresentativeId).toBeDefined();
      expect(deal.dealName).toBeDefined();
      expect(deal.dealAmount).toBeDefined();
      expect(deal.stageId).toBeDefined();
      expect(deal.expectedContractDate).toBeDefined();
      expect(deal.description).toBeDefined();
      expect(deal.contractedDate).toBeNull();
      expect(deal.lossReason).toBeNull();
      expect(deal.createdAt).toBeDefined();
      expect(deal.updatedAt).toBeDefined();
      expect(deal.createdBy).toBeDefined();
      expect(deal.invoiceGenerationSLADeadline).toBeDefined();
      expect(deal.invoiceSLAExceededFlag).toBeDefined();
    });
  });
});
