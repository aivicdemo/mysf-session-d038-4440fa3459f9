import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-783: fetchDealsForPeriod - ステージIDフィルター', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter deals by stage ID', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-A',
        salesRepresentativeId: 'rep-001',
        dealName: '商談A',
        dealAmount: 1000000,
        stageId: 'stage-discovery',
        expectedContractDate: '2024-12-31T00:00:00Z',
        description: '初期段階の商談',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T14:30:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2025-01-20T14:30:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-B',
        salesRepresentativeId: 'rep-002',
        dealName: '商談B',
        dealAmount: 2000000,
        stageId: 'stage-proposal',
        expectedContractDate: '2024-11-30T00:00:00Z',
        description: '提案段階の商談',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-18T11:15:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2025-01-18T11:15:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-A',
        salesRepresentativeId: 'rep-001',
        dealName: '商談C',
        dealAmount: 1500000,
        stageId: 'stage-discovery',
        expectedContractDate: '2024-10-31T00:00:00Z',
        description: '別の初期段階商談',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-12T08:45:00Z',
        updatedAt: '2024-01-19T13:20:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2025-01-19T13:20:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'customer-C',
        salesRepresentativeId: 'rep-003',
        dealName: '商談D',
        dealAmount: 3000000,
        stageId: 'stage-proposal',
        expectedContractDate: '2024-09-30T00:00:00Z',
        description: '別の提案段階商談',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-08T07:30:00Z',
        updatedAt: '2024-01-17T10:00:00Z',
        createdBy: 'admin-001',
        invoiceGenerationSLADeadline: '2025-01-17T10:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    jest.mocked(dataStore.listRecords).mockResolvedValue(mockDeals as any);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: 'stage-discovery',
      sortBy: 'updatedAt',
    });

    // Should return only deals with stage-discovery
    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    // Verify all returned deals have stage-discovery
    expect(result.deals.every(d => d.stageId === 'stage-discovery')).toBe(true);

    // Verify sorted by updatedAt descending
    expect(result.deals[0].dealId).toBe('deal-001'); // 2024-01-20T14:30:00Z
    expect(result.deals[1].dealId).toBe('deal-003'); // 2024-01-19T13:20:00Z

    // Verify deals with other stages are excluded
    expect(result.deals.find(d => d.dealId === 'deal-002')).toBeUndefined();
    expect(result.deals.find(d => d.dealId === 'deal-004')).toBeUndefined();

    // Verify all required fields are present
    result.deals.forEach(deal => {
      expect(deal.dealId).toBeDefined();
      expect(deal.stageId).toBe('stage-discovery');
      expect(deal.dealName).toBeDefined();
      expect(deal.dealAmount).toBeDefined();
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
