import { fetchDealsForPeriod } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1629: 商談がクローズ状態で請求書が存在しない場合、警告がログに記録されるが検証は実行される', () => {
  const mockDeals = [
    {
      id: 'deal-001',
      dealId: 'deal-001',
      customerId: 'customer-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'A社 新規案件',
      dealAmount: 1000000,
      stageId: '成約',
      expectedContractDate: '2024-01-15T00:00:00Z',
      description: 'テスト商談',
      contractedDate: '2024-01-10T00:00:00Z',
      lossReason: null,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-10T15:30:00Z',
      createdBy: 'user-001',
      invoiceGenerationSLADeadline: '2024-01-17T00:00:00Z',
      invoiceSLAExceededFlag: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockDeals);
  });

  it('警告がログに記録されていても、正常に完了して結果を返す', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result).toBeDefined();
    expect(result.deals).toHaveLength(1);
  });

  it('deal-001 を含むレコードが返される', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.deals[0].dealId).toBe('deal-001');
    expect(result.deals[0].customerId).toBe('customer-001');
    expect(result.deals[0].dealName).toBe('A社 新規案件');
    expect(result.deals[0].dealAmount).toBe(1000000);
    expect(result.deals[0].stageId).toBe('成約');
    expect(result.deals[0].contractedDate).toBe('2024-01-10T00:00:00Z');
  });

  it('totalCount=1、fetchedAt は ISO 8601 形式である', async () => {
    const result = await fetchDealsForPeriod({
      periodStartDateTime: '2024-01-01T00:00:00Z',
      periodEndDateTime: '2024-01-31T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    });

    expect(result.totalCount).toBe(1);
    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$/);
  });
});
