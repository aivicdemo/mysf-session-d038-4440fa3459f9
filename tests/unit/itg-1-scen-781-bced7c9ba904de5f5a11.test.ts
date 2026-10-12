import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-781: fetchDealsForPeriod - 営業担当者IDフィルター', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should filter deals by sales representative ID', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-A',
        salesRepresentativeId: 'rep-001',
        dealName: 'ABC会社との提案',
        dealAmount: 500000,
        stageId: '提案',
        expectedContractDate: '2024-03-15T00:00:00Z',
        description: '新規案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-10T09:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-03-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-B',
        salesRepresentativeId: 'rep-002',
        dealName: 'XYZ社との契約',
        dealAmount: 800000,
        stageId: '契約',
        expectedContractDate: '2024-02-28T00:00:00Z',
        description: '大型案件',
        contractedDate: '2024-02-25T00:00:00Z',
        lossReason: null,
        createdAt: '2024-01-05T10:00:00Z',
        updatedAt: '2024-02-01T11:00:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-03-06T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-C',
        salesRepresentativeId: 'rep-001',
        dealName: 'DEF社との商談',
        dealAmount: 300000,
        stageId: '初期接触',
        expectedContractDate: '2024-04-10T00:00:00Z',
        description: 'フォローアップ案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-12T08:00:00Z',
        updatedAt: '2024-01-20T16:45:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-04-15T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-004',
        dealId: 'deal-004',
        customerId: 'customer-A',
        salesRepresentativeId: 'rep-003',
        dealName: 'GHI社との追加提案',
        dealAmount: 1200000,
        stageId: '提案',
        expectedContractDate: '2024-03-30T00:00:00Z',
        description: '追加案件',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-01-18T13:00:00Z',
        updatedAt: '2024-01-22T09:15:00Z',
        createdBy: 'user-003',
        invoiceGenerationSLADeadline: '2024-04-04T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
    ];

    jest.mocked(dataStore.listRecords).mockResolvedValue(mockDeals as any);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-02-29T23:59:59Z',
      salesRepresentativeIdFilter: 'rep-001',
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    // Should return only deals for rep-001
    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    // Verify all returned deals belong to rep-001
    expect(result.deals.every(d => d.salesRepresentativeId === 'rep-001')).toBe(true);

    // Verify sorted by updatedAt descending
    expect(result.deals[0].dealId).toBe('deal-003'); // 2024-01-20T16:45:00Z
    expect(result.deals[1].dealId).toBe('deal-001'); // 2024-01-15T14:30:00Z

    // Verify deals from other representatives are excluded
    expect(result.deals.find(d => d.dealId === 'deal-002')).toBeUndefined();
    expect(result.deals.find(d => d.dealId === 'deal-004')).toBeUndefined();
  });
});
