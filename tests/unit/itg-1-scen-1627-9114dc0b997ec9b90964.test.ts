import { fetchDealsForPeriod, PeriodValidationError } from '../../src/logic/data-persistence';
import * as dataStore from '../../src/platform/data-store';

jest.mock('../../src/platform/data-store');

describe('SCEN-1627: 請求書期日が不正な日付形式の場合、エラーが発生し処理が中断される', () => {
  const mockDeals = [
    {
      id: 'deal-001',
      dealId: 'deal-001',
      customerId: 'cust-001',
      salesRepresentativeId: 'rep-001',
      dealName: 'A社との大型案件',
      dealAmount: 5000000,
      stageId: '提案中',
      expectedContractDate: '2024-01-20T00:00:00Z',
      description: 'テスト商談',
      contractedDate: null,
      lossReason: null,
      createdAt: '2024-01-05T09:00:00Z',
      updatedAt: '2024-01-08T14:30:00Z',
      createdBy: 'user-001',
      invoiceGenerationSLADeadline: '2024-01-25T23:59:59Z',
      invoiceSLAExceededFlag: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('期間の開始日時が終了日時より後の場合、PeriodValidationError が発生する', async () => {
    (dataStore.listRecords as jest.Mock).mockResolvedValue(mockDeals);

    await expect(
      fetchDealsForPeriod({
        periodStartDateTime: '2024-01-15T10:00:00Z',
        periodEndDateTime: '2024-01-10T10:00:00Z',
        salesRepresentativeIdFilter: null,
        customerIdFilter: null,
        stageIdFilter: null,
        sortBy: 'updatedAt',
      })
    ).rejects.toThrow(PeriodValidationError);
  });
});
