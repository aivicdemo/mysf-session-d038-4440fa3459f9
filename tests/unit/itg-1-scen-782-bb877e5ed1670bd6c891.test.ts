import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-782: fetchDealsForPeriod - 取引先IDフィルター', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter deals by customer ID', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-A',
        salesRepresentativeId: 'rep-001',
        dealName: '商談A',
        dealAmount: 1000000,
        stageId: '提案中',
        expectedContractDate: '2025-03-15T00:00:00Z',
        description: '大型案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2025-01-10T08:00:00Z',
        updatedAt: '2025-01-15T10:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2025-04-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-B',
        salesRepresentativeId: 'rep-001',
        dealName: '商談B',
        dealAmount: 500000,
        stageId: '初期接触',
        expectedContractDate: '2025-02-28T00:00:00Z',
        description: '中規模案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2025-01-12T09:00:00Z',
        updatedAt: '2025-01-20T14:00:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2025-03-28T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-A',
        salesRepresentativeId: 'rep-002',
        dealName: '商談C',
        dealAmount: 750000,
        stageId: '契約段階',
        expectedContractDate: '2025-02-10T00:00:00Z',
        description: '追加案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2025-01-08T07:00:00Z',
        updatedAt: '2025-01-18T11:45:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2025-03-10T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'customer-C',
        salesRepresentativeId: 'rep-001',
        dealName: '商談D',
        dealAmount: 300000,
        stageId: '提案中',
        expectedContractDate: '2025-03-01T00:00:00Z',
        description: '小規模案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2025-01-05T06:00:00Z',
        updatedAt: '2025-01-05T06:00:00Z',
        createdBy: 'user-003',
        invoiceGenerationSLADeadline: '2025-04-01T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    jest.mocked(dataStore.listRecords).mockResolvedValue(mockDeals as any);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2025-01-10T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      customerIdFilter: 'customer-A',
      salesRepresentativeIdFilter: null,
      stageIdFilter: null,
      sortBy: null,
    });

    // Should return only deals for customer-A
    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    // Verify all returned deals belong to customer-A
    expect(result.deals.every(d => d.customerId === 'customer-A')).toBe(true);

    // Verify sorted by updatedAt in descending order (default)
    expect(result.deals[0].dealId).toBe('deal-003'); // 2025-01-18T11:45:00Z
    expect(result.deals[1].dealId).toBe('deal-001'); // 2025-01-15T10:30:00Z

    // Verify deals from other customers are excluded
    expect(result.deals.find(d => d.dealId === 'deal-002')).toBeUndefined();
    expect(result.deals.find(d => d.dealId === 'deal-004')).toBeUndefined();

    // Verify returned records have all required fields
    result.deals.forEach(deal => {
      expect(deal.dealId).toBeDefined();
      expect(deal.customerId).toBe('customer-A');
      expect(deal.dealName).toBeDefined();
      expect(deal.dealAmount).toBeDefined();
    });
  });
});
