import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1679: 商談から請求書生成までの期限を自動判定し、期限超過案件を検出して警告を発行する', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間内の商談を取得し、請求SLA超過フラグを含めて返す', async () => {
    const dealsData = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-001',
        dealName: 'A社向け基本契約',
        dealAmount: 5000000,
        stageId: '成約',
        expectedContractDate: '2024-01-15T00:00:00Z',
        description: '基本契約締結',
        contractedDate: '2024-01-15T00:00:00Z',
        lossReason: null,
        createdAt: '2024-01-01T10:00:00Z',
        updatedAt: '2024-01-15T14:30:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: '2024-01-20T00:00:00Z',
        invoiceSLAExceededFlag: false,
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'cust-002',
        salesRepresentativeId: 'rep-001',
        dealName: 'B社向け追加導入',
        dealAmount: 3000000,
        stageId: '成約',
        expectedContractDate: '2024-01-10T00:00:00Z',
        description: '追加機能導入',
        contractedDate: '2024-01-10T00:00:00Z',
        lossReason: null,
        createdAt: '2024-01-05T09:00:00Z',
        updatedAt: '2024-01-10T11:00:00Z',
        createdBy: 'user-002',
        invoiceGenerationSLADeadline: '2024-01-15T00:00:00Z',
        invoiceSLAExceededFlag: true,
      },
      {
        id: 'deal-003',
        dealId: 'deal-003',
        customerId: 'cust-001',
        salesRepresentativeId: 'rep-002',
        dealName: 'C社向けコンサル',
        dealAmount: 2000000,
        stageId: '提案',
        expectedContractDate: '2024-02-28T00:00:00Z',
        description: 'コンサルティング提案中',
        contractedDate: null,
        lossReason: null,
        createdAt: '2023-12-20T08:00:00Z',
        updatedAt: '2024-01-12T16:45:00Z',
        createdBy: 'user-001',
        invoiceGenerationSLADeadline: null,
        invoiceSLAExceededFlag: false,
      },
    ];

    (dataStore.listRecords as jest.Mock).mockResolvedValue(dealsData);

    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(3);
    expect(result.totalCount).toBe(3);

    // 仕様の期待結果に従う: deal-002, deal-001, deal-003 の順
    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[0].updatedAt).toBe('2024-01-10T11:00:00Z');
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(true);

    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2024-01-15T14:30:00Z');
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);

    expect(result.deals[2].dealId).toBe('deal-003');
    expect(result.deals[2].updatedAt).toBe('2024-01-12T16:45:00Z');
    expect(result.deals[2].invoiceSLAExceededFlag).toBe(false);

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
