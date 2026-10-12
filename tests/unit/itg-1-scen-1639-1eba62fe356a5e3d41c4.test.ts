import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { fetchDealsForPeriod, type SaveDealOutput } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1639: 不整合が1件以上検出された場合、推奨アクションが提示される', () => {
  const mockDataStore = dataStore as jest.Mocked<typeof dataStore>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内の商談レコード（請求SLA超過を含む）を正常に取得する', async () => {
    const deals: SaveDealOutput[] = [
      {
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム構築案件',
        dealAmount: 5000000,
        stageId: 'negotiation',
        expectedContractDate: '2025-02-28T23:59:59Z',
        description: '要件定義完了、見積提示済み',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-03-07T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-01T10:00:00Z',
        updatedAt: '2025-01-15T14:30:00Z',
        createdBy: 'admin-001',
      },
      {
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-002',
        dealName: 'B社保守契約',
        dealAmount: 1200000,
        stageId: 'won',
        expectedContractDate: '2025-01-31T23:59:59Z',
        description: '成約済み、請求書未生成',
        contractedDate: '2025-01-25T09:15:00Z',
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-02-01T23:59:59Z',
        invoiceSLAExceededFlag: true,
        createdAt: '2024-12-15T08:00:00Z',
        updatedAt: '2025-01-25T09:15:00Z',
        createdBy: 'admin-001',
      },
      {
        dealId: 'deal-003',
        customerId: 'customer-003',
        salesRepresentativeId: 'rep-001',
        dealName: 'C社データ移行案件',
        dealAmount: 3500000,
        stageId: 'discovery',
        expectedContractDate: '2025-03-15T23:59:59Z',
        description: '初期ヒアリング実施',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2025-03-22T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2025-01-10T11:20:00Z',
        updatedAt: '2025-01-20T16:45:00Z',
        createdBy: 'admin-001',
      },
    ];

    mockDataStore.listRecords.mockResolvedValue(deals as any);

    const input = {
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt' as const,
    };

    const result = await fetchDealsForPeriod(input);

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);

    // 請求SLA超過フラグがtrueのレコードが含まれていることを確認
    const dealWithSLAExceeded = result.deals.find((deal) => deal.invoiceSLAExceededFlag === true);
    expect(dealWithSLAExceeded).toBeDefined();
    expect(dealWithSLAExceeded?.dealId).toBe('deal-002');

    expect(result.fetchedAt).toBeDefined();
  });
});
