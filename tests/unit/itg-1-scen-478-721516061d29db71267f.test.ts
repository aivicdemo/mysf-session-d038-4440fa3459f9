import { displayCustomerTransactionHistory } from '../../src/logic/customer-transaction-history';
import * as dataLayerModule from '../../src/logic/data-persistence';
import * as verificationModule from '../../src/logic/deal-invoice-link-validation';
import * as accessControlModule from '../../src/logic/access-control-enforcement';

jest.mock('../../src/logic/data-persistence');
jest.mock('../../src/logic/deal-invoice-link-validation');
jest.mock('../../src/logic/access-control-enforcement');

describe('SCEN-478: 請求レコード一覧が空の場合', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('処理は継続され空の結果が返される', async () => {
    const customerId = '550e8400-e29b-41d4-a716-446655440000';
    const loginUserId = 'user-12345';
    const currentDateTime = new Date('2026-10-07T10:00:00Z');

    (accessControlModule.enforceAccessControlForDataDisplay as jest.Mock).mockResolvedValue({
      allowed: true,
      accessLevel: 'full',
    });

    (dataLayerModule.fetchCustomerWithRelatedRecords as jest.Mock).mockResolvedValue({
      customerId,
      customerName: 'テスト顧客A',
      deals: [
        {
          dealId: 'deal-001',
          dealName: 'プロジェクトX',
          dealDate: new Date('2026-09-01T00:00:00Z'),
          dealAmount: 500000,
          dealStage: '受注',
          createdDate: new Date('2026-09-01T00:00:00Z'),
        },
      ],
      relatedRecords: [],
    });

    (dataLayerModule.fetchInvoicesForPeriod as jest.Mock).mockResolvedValue([]);

    (verificationModule.verifyInvoiceReferenceIntegrity as jest.Mock).mockResolvedValue({
      isConsistent: true,
      inconsistencies: [],
    });

    const result = await displayCustomerTransactionHistory({
      customerId,
      loginUserId,
      currentDateTime,
    });

    expect(result.customerId).toBe(customerId);
    expect(result.customerName).toBe('テスト顧客A');
    expect(result.transactionHistory.some((r: any) => r.recordId === 'deal-001')).toBe(true);
    expect(result.inconsistencies).toEqual([]);
    expect(result.specialInvoiceStatuses).toEqual([]);
    expect(result.notificationContent).toBeNull();
  });
});
