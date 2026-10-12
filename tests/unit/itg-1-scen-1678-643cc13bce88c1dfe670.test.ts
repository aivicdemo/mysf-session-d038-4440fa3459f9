import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1678: 同期間内の全請求書を取得し、商談との紐付けと請求ステータスを確認する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('指定期間内の商談を取得し、更新日時の降順でソートして返す', async () => {
    const dealsData = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社システム導入案件',
        dealAmount: 5000000,
        stageId: 'stage-03',
        expectedContractDate: '2024-12-15T00:00:00Z',
        description: '基幹システム導入',
        contractedDate: '2024-12-01T10:30:00Z',
        lossReason: null,
        createdAt: '2024-11-01T09:00:00Z',
        updatedAt: '2024-11-15T14:22:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-12-08T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'rep-001',
        dealName: 'B社クラウド移行',
        dealAmount: 3200000,
        stageId: 'stage-02',
        expectedContractDate: '2024-11-30T00:00:00Z',
        description: 'クラウド移行プロジェクト',
        contractedDate: null,
        lossReason: null,
        createdAt: '2024-11-05T11:15:00Z',
        updatedAt: '2024-11-18T16:45:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-12-05T23:59:59Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'customer-001',
        salesRepresentativeId: 'rep-002',
        dealName: 'A社保守契約',
        dealAmount: 1500000,
        stageId: 'stage-04',
        expectedContractDate: '2024-11-20T00:00:00Z',
        description: '年間保守契約',
        contractedDate: '2024-11-10T09:00:00Z',
        lossReason: null,
        createdAt: '2024-10-20T08:30:00Z',
        updatedAt: '2024-11-10T09:05:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-11-17T23:59:59Z',
        invoiceSLAExceededFlag: true,
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(dealsData);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-11-01T00:00:00Z',
      periodEndDateTime: '2024-11-20T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);
    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[0].updatedAt).toBe('2024-11-18T16:45:00Z');
    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2024-11-15T14:22:00Z');
    expect(result.deals[2].dealId).toBe('deal-003');
    expect(result.deals[2].updatedAt).toBe('2024-11-10T09:05:00Z');
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
