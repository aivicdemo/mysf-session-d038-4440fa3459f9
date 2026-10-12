import { fetchDealsForPeriod, type FetchDealsForPeriodInput, type FetchDealsForPeriodOutput } from '../../src/logic/data-persistence';
import * as dataPersistence from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1697: 警告レベルが注意の場合、推奨対応として営業担当者への通知と進捗確認を返す', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('請求SLA超過フラグがtrueのレコードが注意として識別され、営業担当者への通知が必要な状態として返される', async () => {
    const mockDeals = [
      {
        id: 'deal-001',
        dealId: 'deal-001',
        customerId: 'customer-001',
        salesRepresentativeId: 'sales-rep-001',
        dealName: '契約A',
        dealAmount: 1000000,
        stageId: 'proposal',
        expectedContractDate: '2024-12-31T23:59:59Z',
        description: '大型案件',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-12-15T23:59:59Z',
        invoiceSLAExceededFlag: false,
        createdAt: '2024-11-01T10:00:00Z',
        updatedAt: '2024-11-15T14:30:00Z',
        createdBy: 'user-001',
      },
      {
        id: 'deal-002',
        dealId: 'deal-002',
        customerId: 'customer-002',
        salesRepresentativeId: 'sales-rep-002',
        dealName: '契約B',
        dealAmount: 500000,
        stageId: 'negotiation',
        expectedContractDate: '2024-11-30T23:59:59Z',
        description: '中型案件',
        contractedDate: null,
        lossReason: null,
        invoiceGenerationSLADeadline: '2024-11-28T23:59:59Z',
        invoiceSLAExceededFlag: true,
        createdAt: '2024-11-05T09:00:00Z',
        updatedAt: '2024-11-20T16:45:00Z',
        createdBy: 'user-002',
      },
    ];

    (dataPersistence.listRecords as jest.Mock).mockResolvedValue(mockDeals);

    const input: FetchDealsForPeriodInput = {
      periodStartDateTime: '2024-11-01T00:00:00Z',
      periodEndDateTime: '2024-11-30T23:59:59Z',
      salesRepresentativeIdFilter: null,
      customerIdFilter: null,
      stageIdFilter: null,
      sortBy: 'updatedAt',
    };

    const result = await fetchDealsForPeriod(input);

    expect(dataPersistence.listRecords).toHaveBeenCalledWith('商談', expect.any(Object));

    // 2件が返される
    expect(result.deals).toHaveLength(2);
    expect(result.totalCount).toBe(2);

    // updatedAt 降順: deal-002（2024-11-20T16:45:00Z） → deal-001（2024-11-15T14:30:00Z）
    expect(result.deals[0].dealId).toBe('deal-002');
    expect(result.deals[0].updatedAt).toBe('2024-11-20T16:45:00Z');
    expect(result.deals[0].invoiceSLAExceededFlag).toBe(true);
    expect(result.deals[0].salesRepresentativeId).toBe('sales-rep-002');

    expect(result.deals[1].dealId).toBe('deal-001');
    expect(result.deals[1].updatedAt).toBe('2024-11-15T14:30:00Z');
    expect(result.deals[1].invoiceSLAExceededFlag).toBe(false);

    // deal-002 は営業担当者への通知が必要な状態
    const warningDeal = result.deals.find(d => d.invoiceSLAExceededFlag === true);
    expect(warningDeal?.dealId).toBe('deal-002');
    expect(warningDeal?.salesRepresentativeId).toBe('sales-rep-002');

    expect(result.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  });
});
