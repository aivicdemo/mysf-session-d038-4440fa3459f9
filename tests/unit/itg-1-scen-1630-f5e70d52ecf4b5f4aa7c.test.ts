import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1630: 請求書の発行日付が未来日の場合、警告がログに記録されるが検証は実行される', () => {
  const mockDeals = [
    {
      id: 'deal-001',
      dealId: 'deal-001',
      customerId: 'customer-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'A社案件',
      dealAmount: 1000000,
      stageId: '成約',
      expectedContractDate: '2025-01-15T00:00:00Z',
      description: 'テスト商談',
      contractedDate: '2025-01-10T00:00:00Z',
      lossReason: null,
      createdAt: '2025-01-05T10:00:00Z',
      updatedAt: '2025-01-10T15:30:00Z',
      createdBy: 'user-001',
      invoiceGenerationSLADeadline: '2025-01-12T00:00:00Z',
      invoiceSLAExceededFlag: false,
    },
    {
      id: 'deal-002',
      dealId: 'deal-002',
      customerId: 'customer-002',
      salesRepresentativeId: 'rep-002',
      dealName: 'B社案件',
      dealAmount: 500000,
      stageId: '成約',
      expectedContractDate: '2025-02-20T00:00:00Z',
      description: 'テスト商談2',
      contractedDate: null,
      lossReason: null,
      createdAt: '2025-01-08T09:00:00Z',
      updatedAt: '2025-01-09T14:20:00Z',
      createdBy: 'user-002',
      invoiceGenerationSLADeadline: '2025-02-25T00:00:00Z',
      invoiceSLAExceededFlag: false,
    },
    {
      id: 'deal-003',
      dealId: 'deal-003',
      customerId: 'customer-003',
      salesRepresentativeId: 'rep-001',
      dealName: 'C社案件',
      dealAmount: 2000000,
      stageId: '成約',
      expectedContractDate: '2026-06-30T00:00:00Z',
      description: 'テスト商談3',
      contractedDate: '2026-06-28T00:00:00Z',
      lossReason: null,
      createdAt: '2025-01-06T11:00:00Z',
      updatedAt: '2026-06-28T16:45:00Z',
      createdBy: 'user-001',
      invoiceGenerationSLADeadline: '2026-07-05T00:00:00Z',
      invoiceSLAExceededFlag: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockDeals);
  });

  it('指定期間内（2025-01-01 以降、2025-01-31 以前）のレコードを抽出する', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);
  });

  it('返却する deals 配列は updatedAt の降順でソートされている', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].updatedAt).toBe('2025-01-10T15:30:00Z');
    expect(result.deals[1].dealId).toBe('deal-002');
    expect(result.deals[1].updatedAt).toBe('2025-01-09T14:20:00Z');
  });

  it('警告がログに記録されていても、正常な出力を返す', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2025-01-01T00:00:00Z',
      periodEndDateTime: '2025-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result).toBeDefined();
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });
});
