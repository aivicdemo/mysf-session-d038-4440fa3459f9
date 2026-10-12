import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchDealsForPeriod, type SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1638: 複数の請求書のステータスが一貫していない場合、不整合として検出される', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内の複数商談を取得し、ステータスの一貫性を検証可能な状態で返す', async () => {
    const deals: SaveDealOutput[] = [
      {
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入',
        dealAmount: 5000000,
        stageId: '提案',
        expectedContractDate: '2025-03-31T00:00:00Z',
        description: '基幹システム導入案件',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-04-30T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-02-01T14:30:00Z',
        createdBy: 'user-001',
      },
      {
        dealId: 'deal-002',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社保守契約',
        dealAmount: 1200000,
        stageId: '成約',
        expectedContractDate: '2025-02-28T00:00:00Z',
        description: '12ヶ月の保守契約',
        contractedDate: '2025-02-15T09:00:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-03-17T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-10T08:30:00Z',
        updatedAt: '2025-02-15T09:00:00Z',
        createdBy: 'user-001',
      },
      {
        dealId: 'deal-003',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社コンサル案件',
        dealAmount: 3500000,
        stageId: '受注',
        expectedContractDate: '2025-03-15T00:00:00Z',
        description: '経営コンサル6ヶ月プログラム',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-04-15T23:59:59Z',
        invoiceSLAExceededFlag: true,
        createdAt: '2025-01-20T11:00:00Z',
        updatedAt: '2025-02-10T16:45:00Z',
        createdBy: 'user-002',
      },
      {
        dealId: 'deal-004',
        customerId: 'cust-003',
        salesRepresentativeId: 'rep-001',
        dealName: 'C社失注案件',
        dealAmount: 800000,
        stageId: '失注',
        expectedContractDate: '2025-02-20T00:00:00Z',
        description: '予算承認取得できず',
        contractedDate: null,
        lossReason: '予算削減',
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-05T09:15:00Z',
        updatedAt: '2025-02-05T13:20:00Z',
        createdBy: 'user-001',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals as any);

    const input = {
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-02-28T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(4);
    expect(result.totalCount).toBe(4);
    expect(result.deals[0]).toMatchObject({
      dealId: 'deal-001',
      stageId: '提案',
      contractedDate: null,
      invoiceSLAExceededFlag: false,
    });
    expect(result.deals[1]).toMatchObject({
      dealId: 'deal-002',
      stageId: '成約',
      contractedDate: '2025-02-15T09:00:00Z',
      invoiceSLAExceededFlag: false,
    });
    expect(result.deals[2]).toMatchObject({
      dealId: 'deal-003',
      stageId: '受注',
      contractedDate: null,
      invoiceSLAExceededFlag: true,
    });
    expect(result.deals[3]).toMatchObject({
      dealId: 'deal-004',
      stageId: '失注',
      lossReason: '予算削減',
      contractedDate: null,
    });
    expect(result.fetchedAt).toBeDefined();
  });
});
